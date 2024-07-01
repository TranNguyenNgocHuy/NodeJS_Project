const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);
router.patch(
  '/update-my-password',
  authController.authenticated,
  authController.updatePassword
);

router.patch(
  '/update-my-profile',
  authController.authenticated,
  userController.updateUserProfile
);

router.delete(
  '/delete-by-user',
  authController.authenticated,
  userController.deleteByUser
);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router.route('/:id').get(userController.getUser);

module.exports = router;
