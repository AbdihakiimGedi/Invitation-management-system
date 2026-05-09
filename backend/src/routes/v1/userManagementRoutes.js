const express = require('express');
const UserManagementController = require('../../controllers/userManagementController');
const authMiddleware = require('../../middleware/authMiddleware');
const roleMiddleware = require('../../middleware/roleMiddleware');

const router = express.Router();

router.get('/roles', authMiddleware, roleMiddleware(['Admin']), UserManagementController.listRoles);
router.get('/', authMiddleware, roleMiddleware(['Admin']), UserManagementController.listUsers);
router.post('/', authMiddleware, roleMiddleware(['Admin']), UserManagementController.createUser);
router.patch('/:userId', authMiddleware, roleMiddleware(['Admin']), UserManagementController.updateUser);
router.post('/:userId/reset-password', authMiddleware, roleMiddleware(['Admin']), UserManagementController.resetPassword);

module.exports = router;
