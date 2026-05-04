const db = require('../config/database');

const InvitationModel = {
  async create(data, client = db) {
    const { event_id, eventparticipant_id, seat_id, qr_token, quantity = 1 } = data;
    const query = `
      INSERT INTO invitations (id, event_id, eventparticipant_id, seat_id, qr_token, quantity, status, comm_status)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'ACTIVE', 'PENDING')
      RETURNING *
    `;
    const res = await client.query(query, [event_id, eventparticipant_id, seat_id, qr_token, quantity]);
    return res.rows[0];
  },

  async bulkCreate(invitations, client = db) {
    // Using unnest for bulk insert performance
    const query = `
      INSERT INTO invitations (id, event_id, eventparticipant_id, seat_id, qr_token, quantity, status, comm_status)
      SELECT gen_random_uuid(), unnest($1::uuid[]), unnest($2::int[]), unnest($3::uuid[]), unnest($4::text[]), unnest($5::int[]), 'ACTIVE', 'PENDING'
      RETURNING *
    `;
    const res = await client.query(query, [
      invitations.map(i => i.event_id),
      invitations.map(i => i.participant_id),
      invitations.map(i => i.seat_id),
      invitations.map(i => i.qr_token),
      invitations.map(i => i.quantity)
    ]);
    return res.rows;
  },

  async getByToken(token) {
    const query = `
      SELECT i.*, ep.user_id, ep.type_id, pt.type_name, e.event_name, s.zone as group_name, s.seat_number
      FROM invitations i
      JOIN event_participants ep ON i.eventparticipant_id = ep.eventparticipant_id
      JOIN people_types pt ON ep.type_id = pt.id
      JOIN events e ON i.event_id = e.id
      JOIN seats s ON i.seat_id = s.id
      WHERE i.qr_token = $1
    `;
    const res = await db.query(query, [token]);
    return res.rows[0];
  },

  async verifyAndUse(token, device_info = null, ip_address = null) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      const invitation = await this.getByToken(token);
      if (!invitation) {
        await this.logScan(null, 'FAILED_INVALID', device_info, ip_address, client);
        await client.query('COMMIT');
        return { success: false, reason: 'INVALID_TOKEN' };
      }

      if (invitation.status === 'USED') {
        await this.logScan(invitation.id, 'FAILED_USED', device_info, ip_address, client);
        await client.query('COMMIT');
        return { success: false, reason: 'ALREADY_USED', invitation };
      }

      // Mark as used
      await client.query('UPDATE invitations SET status = \'USED\' WHERE id = $1', [invitation.id]);
      await this.logScan(invitation.id, 'SUCCESS', device_info, ip_address, client);
      
      await client.query('COMMIT');
      return { success: true, invitation };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async logScan(invitationId, status, device_info, ip_address, client = db) {
    const query = `
      INSERT INTO invitation_scans (invitation_id, status, device_info, ip_address)
      VALUES ($1, $2, $3, $4)
    `;
    return client.query(query, [invitationId, status, device_info, ip_address]);
  }
};

module.exports = InvitationModel;
