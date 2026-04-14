const db = require('../config/database');

const UserModel = {
  async findByUsername(username) {
    const query = `
      SELECT id, username, password_hash, role, is_active, created_at
      FROM users
      WHERE username = $1
    `;
    const result = await db.query(query, [username]);
    return result.rows[0];
  }
};

module.exports = UserModel;
