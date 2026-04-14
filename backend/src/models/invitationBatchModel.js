const db = require('../config/database');

const InvitationBatchModel = {
  async create(batchData, client = db) {
    const { event_id, batch_name, total_count = 0, qty_per_person = 1 } = batchData;
    const query = `
      INSERT INTO invitation_batches (id, event_id, batch_name, status, total_count, processed_count, qty_per_person)
      VALUES (gen_random_uuid(), $1, $2, 'Pending', $3, 0, $4)
      RETURNING *
    `;
    const result = await client.query(query, [event_id, batch_name, total_count, qty_per_person]);
    return result.rows[0];
  },

  async updateProgress(id, processedCount, client = db) {
    const query = 'UPDATE invitation_batches SET processed_count = $1 WHERE id = $2 RETURNING *';
    const result = await client.query(query, [processedCount, id]);
    return result.rows[0];
  },

  async setError(id, errorMessage, client = db) {
    const query = 'UPDATE invitation_batches SET status = \'Failed\', error_message = $1 WHERE id = $2 RETURNING *';
    const result = await client.query(query, [errorMessage, id]);
    return result.rows[0];
  },

  async updateStatus(id, status, client = db) {
    const query = 'UPDATE invitation_batches SET status = $1::text, sent_at = CASE WHEN $1::text = \'Sent\' OR $1::text = \'Completed\' THEN CURRENT_TIMESTAMP ELSE sent_at END WHERE id = $2 RETURNING *';
    const result = await client.query(query, [status, id]);
    return result.rows[0];
  },

  async getPendingBatch() {
    const query = 'SELECT * FROM invitation_batches WHERE status = \'Pending\' ORDER BY created_at ASC LIMIT 1';
    const res = await db.query(query);
    return res.rows[0];
  },

  async getAllByEvent(eventId) {
    const query = 'SELECT * FROM invitation_batches WHERE event_id = $1 ORDER BY created_at DESC';
    const res = await db.query(query, [eventId]);
    return res.rows;
  }
};

module.exports = InvitationBatchModel;
