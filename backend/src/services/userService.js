const bcrypt = require('bcryptjs');
const db = require('../config/database');

const UserService = {
  async createUser(userData, client = db) {
    const { username, password, role } = userData;
    const password_hash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (id, username, password_hash, role)
      VALUES (gen_random_uuid(), $1, $2, $3)
      RETURNING id, username, role, created_at
    `;
    
    const result = await client.query(query, [username, password_hash, role]);
    return result.rows[0];
  }
};

module.exports = UserService;
