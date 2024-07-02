const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router();

router
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.authenticated,
    authController.permission('customer'),
    reviewController.createReview
  );

module.exports = router;
