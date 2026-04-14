const db = require('../config/database');

const InvitationTemplateModel = {
  async getByEventId(eventId) {
    const query = 'SELECT * FROM invitation_templates WHERE event_id = $1 AND is_active = TRUE LIMIT 1';
    const result = await db.query(query, [eventId]);
    return result.rows[0];
  },

  async create(templateData) {
    const { event_id, template_name, max_guests_per_student } = templateData;
    const query = `
      INSERT INTO invitation_templates (id, event_id, template_name, max_guests_per_student)
      VALUES (gen_random_uuid(), $1, $2, $3)
      RETURNING *
    `;
    const result = await db.query(query, [event_id, template_name, max_guests_per_student || 2]);
    return result.rows[0];
  }
};

module.exports = InvitationTemplateModel;
