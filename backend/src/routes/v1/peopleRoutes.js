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
const upload = multer({ storage: storage });


// Admin-only routes
router.get('/types', authMiddleware, roleMiddleware(['Admin']), PeopleController.listTypes);
router.get('/columns/:tableName', authMiddleware, roleMiddleware(['Admin']), PeopleController.listColumns);
router.get('/schema/:tableName', authMiddleware, roleMiddleware(['Admin']), PeopleController.getMappingSchema);
router.get('/preview', authMiddleware, roleMiddleware(['Admin']), PeopleController.searchPreview);
router.post('/upload-preview', authMiddleware, roleMiddleware(['Admin']), upload.single('file'), PeopleController.uploadPreview);
router.post('/import', authMiddleware, roleMiddleware(['Admin']), PeopleController.processImport);
router.post('/process-participation', authMiddleware, roleMiddleware(['Admin']), PeopleController.finalizeParticipation);
router.patch('/participation', authMiddleware, roleMiddleware(['Admin']), PeopleController.updateParticipationStatus);

// Participant Transfer feature
router.get('/transfer/available/:excludeEventId', authMiddleware, roleMiddleware(['Admin']), PeopleController.listAvailableTransferEvents);
router.patch('/transfer', authMiddleware, roleMiddleware(['Admin']), PeopleController.transferParticipant);

module.exports = router;
