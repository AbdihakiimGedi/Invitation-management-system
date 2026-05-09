const db = require('../config/database');

const ActivityLogService = {
  async ensureSchema(client = db) {
    await client.query(`
      CREATE TABLE IF NOT EXISTS system_activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action_type VARCHAR(80) NOT NULL,
        entity_type VARCHAR(80),
        entity_id TEXT,
        description TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async log({ actorUserId = null, actionType, entityType = null, entityId = null, description = null, metadata = {} }, client = db) {
    if (!actionType) return null;
    await this.ensureSchema(client);
    const result = await client.query(`
      INSERT INTO system_activity_logs (
        actor_user_id,
        action_type,
        entity_type,
        entity_id,
        description,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING *
    `, [
      actorUserId,
      actionType,
      entityType,
      entityId == null ? null : String(entityId),
      description,
      JSON.stringify(metadata || {})
    ]);
    return result.rows[0];
  },

  async getLogs(filters = {}) {
    await this.ensureSchema();
    const params = [];
    const conditions = [];

    if (filters.search) {
      params.push(`%${String(filters.search).trim()}%`);
      const p = `$${params.length}`;
      conditions.push(`(
        description ILIKE ${p}
        OR action_type ILIKE ${p}
        OR entity_type ILIKE ${p}
      )`);
    }

    if (filters.actionType) {
      params.push(filters.actionType);
      conditions.push(`action_type = $${params.length}`);
    }

    if (filters.actorUserId) {
      params.push(filters.actorUserId);
      conditions.push(`actor_user_id = $${params.length}`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = parseInt(filters.limit) || 100;
    const offset = parseInt(filters.offset) || 0;

    const result = await db.query(`
      SELECT
        l.*,
        COALESCE(u.full_name, u.username, 'System') AS actor_name,
        u.role AS actor_role
      FROM system_activity_logs l
      LEFT JOIN users u ON u.id = l.actor_user_id
      ${whereSql}
      ORDER BY l.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const countRes = await db.query(`SELECT COUNT(*)::int FROM system_activity_logs ${whereSql}`, params);

    return {
      logs: result.rows,
      total: countRes.rows[0].count,
      limit,
      offset
    };
  }
};

module.exports = ActivityLogService;
