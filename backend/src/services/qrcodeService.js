const QRCode = require('qrcode');
const crypto = require('crypto');

const QRCodeService = {
  /**
   * Generates a QR code for the given data
   * @param {string} data - The data to encode in the QR code
   * @returns {Promise<string>} Base64 Data URL of the QR code
   */
  async generateQRCode(data) {
    try {
      // PDF requirement 5.14: Encrypted QR codes
      // We'll use a simple but secure hash for the internal data or sign it.
      // For now, we'll just generate the QR code from the provided string.
      const qrDataURL = await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      return qrDataURL;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  },

  /**
   * Generates a security hash for the QR data to prevent tampering
   */
  generateSecurityHash(data) {
    return crypto.createHmac('sha256', process.env.JWT_SECRET)
      .update(data)
      .digest('hex');
  }
};

module.exports = QRCodeService;
