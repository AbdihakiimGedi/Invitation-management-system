const db = require('../config/database');
const UserService = require('./userService');
const GraduateModel = require('../models/graduateModel');

const GraduateService = {
  async registerGraduate(data) {
    const client = await db.pool ? await db.pool.connect() : null; 
    // Note: My database.js exports a wrapper around pool.query. 
    // For transactions, we really should export the pool itself.
    // I will adjust database.js to export the pool for transaction support.

    try {
      if (client) await client.query('BEGIN');
      
      // 1. Create User
      const user = await UserService.createUser({
        username: data.username,
        password: data.password,
        role: 'Graduate'
      }, client || db);

      // 2. Create Graduate record
      const graduate = await GraduateModel.create({
        user_id: user.id,
        department_id: data.department_id,
        student_id: data.student_id,
        degree_level: data.degree_level,
        gpa: data.gpa,
        academic_percentage: data.academic_percentage
      }, client || db);

      if (client) await client.query('COMMIT');
      
      return { ...user, ...graduate };
    } catch (error) {
      if (client) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (client) client.release();
    }
  },

  async listGraduates() {
    return await GraduateModel.getAll();
  }
};

module.exports = GraduateService;
