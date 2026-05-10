const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PeopleController = require('../../controllers/peopleController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();

// Ensure 'uploads' directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'import-' + Date.now() + path.extname(file.originalname));
  }
});
const allowedMimeTypes = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv'
]);
const allowedExtensions = new Set(['.xlsx', '.xls', '.csv']);
const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.UPLOAD_MAX_BYTES || 5 * 1024 * 1024) },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowedExtensions.has(ext) || !allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error('Only CSV and Excel files are allowed'));
    }
    return cb(null, true);
  }
});

function handleUpload(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' || error.message.includes('Only CSV') ? 400 : 500;
    return res.status(status).json({ error: error.message });
  });
}

// Admin-only routes
router.get('/types', authMiddleware, roleMiddleware(['Admin']), PeopleController.listTypes);
router.get('/lookup/:tableName', authMiddleware, roleMiddleware(['Admin']), PeopleController.getLookupData);
router.get('/departments/by-faculty/:facultyId', authMiddleware, roleMiddleware(['Admin']), PeopleController.getDepartmentsByFaculty);
router.get('/columns/:tableName', authMiddleware, roleMiddleware(['Admin']), PeopleController.listColumns);
router.get('/schema/:tableName', authMiddleware, roleMiddleware(['Admin']), PeopleController.getMappingSchema);
router.get('/preview', authMiddleware, roleMiddleware(['Admin']), PeopleController.searchPreview);
router.post('/upload-preview', authMiddleware, roleMiddleware(['Admin']), handleUpload, PeopleController.uploadPreview);
router.post('/import', authMiddleware, roleMiddleware(['Admin']), PeopleController.processImport);
router.post('/manual-register', authMiddleware, roleMiddleware(['Admin']), PeopleController.manualRegister);
router.post('/process-participation', authMiddleware, roleMiddleware(['Admin']), PeopleController.finalizeParticipation);
router.patch('/participation', authMiddleware, roleMiddleware(['Admin']), PeopleController.updateParticipationStatus);

// Participant Transfer feature
router.get('/transfer/available/:excludeEventId', authMiddleware, roleMiddleware(['Admin']), PeopleController.listAvailableTransferEvents);
router.patch('/transfer', authMiddleware, roleMiddleware(['Admin']), PeopleController.transferParticipant);

module.exports = router;
