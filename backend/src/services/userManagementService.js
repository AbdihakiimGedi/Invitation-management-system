const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');
const ActivityLogService = require('./activityLogService');

const allowedSort = new Set(['created_at', 'username', 'role', 'is_active', 'full_name', 'email']);

const UserManagementService = {
  async ensureSchema(client = db) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_roles (
        role_name VARCHAR(50) PRIMARY KEY,
        description TEXT,
        is_system BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      INSERT INTO system_roles (role_name, description) VALUES
        ('Admin', 'Full system administration'),
        ('Attendance Staff', 'QR scanning and attendance reporting'),
        ('Event Staff', 'Event operations staff'),
        ('Graduate', 'Graduate participant portal'),
        ('Guest', 'Guest participant portal'),
        ('Special Guest', 'VIP guest participant portal')
      ON CONFLICT (role_name) DO UPDATE SET description = EXCLUDED.description
    `);
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(150)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(150)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS generated_password VARCHAR(150)');
    await client.query('ALTER TABLE users ALTER COLUMN generated_password TYPE VARCHAR(150)');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    await ActivityLogService.ensureSchema(client);
  },

  async getRoles() {
    await this.ensureSchema();
    const result = await db.query(`
      SELECT role_name, description
      FROM system_roles
      ORDER BY role_name ASC
    `);
    return result.rows;
  },

  async validateRole(role, client = db) {
    const result = await client.query('SELECT 1 FROM system_roles WHERE role_name = $1 LIMIT 1', [role]);
    if (result.rowCount === 0) {
      const error = new Error('Invalid user role');
      error.statusCode = 400;
      throw error;
    }
  },

  async listUsers(filters = {}) {
    await this.ensureSchema();
    const params = [];
    const conditions = [];

    if (filters.search) {
      params.push(`%${String(filters.search).trim()}%`);
      const p = `$${params.length}`;
      conditions.push(`(
        COALESCE(full_name, '') ILIKE ${p}
        OR username ILIKE ${p}
        OR COALESCE(email, '') ILIKE ${p}
      )`);
    }
    if (filters.role) {
      params.push(filters.role);
      conditions.push(`role = $${params.length}`);
    }
    if (filters.status === 'active' || filters.status === 'inactive') {
      params.push(filters.status === 'active');
      conditions.push(`is_active = $${params.length}`);
    }

    const sortBy = allowedSort.has(filters.sortBy) ? filters.sortBy : 'created_at';
    const sortDir = String(filters.sortDir || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(`
      SELECT
        id,
        COALESCE(full_name, username) AS full_name,
        username,
        email,
        phone,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      ${whereSql}
      ORDER BY ${sortBy} ${sortDir}
      LIMIT 200
    `, params);
    return result.rows;
  },

  generatePassword() {
    return crypto.randomBytes(9).toString('base64url');
  },

  async createUser(actorUserId, data) {
    await this.ensureSchema();
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await this.ensureSchema(client);
      await this.validateRole(data.role, client);

      if (!data.username || !data.role) {
        const error = new Error('Username and role are required');
        error.statusCode = 400;
        throw error;
      }

      const password = data.password || this.generatePassword();
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await client.query(`
        INSERT INTO users (
          id,
          username,
          password_hash,
          generated_password,
          role,
          is_active,
          full_name,
          email,
          phone
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, COALESCE($5, TRUE), $6, $7, $8)
        RETURNING id, username, role, is_active, full_name, email, phone, created_at
      `, [
        data.username.trim(),
        passwordHash,
        password,
        data.role,
        data.is_active,
        data.full_name || null,
        data.email || null,
        data.phone || null
      ]);

      await ActivityLogService.log({
        actorUserId,
        actionType: 'USER_CREATED',
        entityType: 'users',
        entityId: result.rows[0].id,
        description: `User created: ${result.rows[0].username}`,
        metadata: { role: result.rows[0].role }
      }, client);

      await client.query('COMMIT');
      return { user: result.rows[0], password };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        error.message = 'Username already exists';
        error.statusCode = 409;
      }
      throw error;
    } finally {
      client.release();
    }
  },

  async updateUser(actorUserId, userId, data) {
    await this.ensureSchema();
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await this.ensureSchema(client);
      if (data.role) await this.validateRole(data.role, client);

      const result = await client.query(`
        UPDATE users
        SET
          full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          role = COALESCE($4, role),
          is_active = COALESCE($5, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, username, role, is_active, full_name, email, phone, created_at, updated_at
      `, [
        data.full_name ?? null,
        data.email ?? null,
        data.phone ?? null,
        data.role ?? null,
        data.is_active ?? null,
        userId
      ]);

      if (result.rowCount === 0) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
      }

      await ActivityLogService.log({
        actorUserId,
        actionType: 'USER_UPDATED',
        entityType: 'users',
        entityId: userId,
        description: `User updated: ${result.rows[0].username}`,
        metadata: { role: result.rows[0].role, is_active: result.rows[0].is_active }
      }, client);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async resetPassword(actorUserId, userId) {
    await this.ensureSchema();
    const password = this.generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(`
      UPDATE users
      SET password_hash = $1,
          generated_password = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, username, role, is_active, full_name, email, phone, created_at, updated_at
    `, [passwordHash, password, userId]);

    if (result.rowCount === 0) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    await ActivityLogService.log({
      actorUserId,
      actionType: 'USER_PASSWORD_RESET',
      entityType: 'users',
      entityId: userId,
      description: `Password reset for ${result.rows[0].username}`
    });

    return { user: result.rows[0], password };
  }
};

module.exports = UserManagementService;
