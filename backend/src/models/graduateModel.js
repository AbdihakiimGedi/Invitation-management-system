const db = require('../config/database');

const GraduateModel = {
  async create(graduateData, client = db) {
    const { user_id, department_id, student_id, degree_level, gpa, academic_percentage } = graduateData;
    const query = `
      INSERT INTO graduates (user_id, department_id, student_id, degree_level, gpa, academic_percentage)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await client.query(query, [user_id, department_id, student_id, degree_level, gpa, academic_percentage]);
    return result.rows[0];
  },

  async getAll() {
    const query = `
      SELECT g.*, u.username, u.role, d.name as department_name, f.name as faculty_name
      FROM graduates g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN departments d ON g.department_id = d.id
      LEFT JOIN faculties f ON d.faculty_id = f.id
      ORDER BY g.degree_level DESC, g.gpa DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }
};

module.exports = GraduateModel;
