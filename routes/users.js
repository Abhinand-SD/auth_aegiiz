const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireRole, requireAdminOrSelf } = require('../middleware/role');

// get all users (admin only)
router.get('/', authenticate, requireRole('admin'), userController.getAllUsers);

// get single user (admin or self)
router.get('/:id', authenticate, requireAdminOrSelf('id'), userController.getUser);

// update (admin or self)
router.put('/:id', authenticate, requireAdminOrSelf('id'), userController.updateUser);

// delete (admin or self)
router.delete('/:id', authenticate, requireAdminOrSelf('id'), userController.deleteUser);

module.exports = router;
