const reviewController = require('../controlers/reviewController');
const authController = require('../controlers/authController');
const express = require('express');
const router = express.Router({ mergeParams: true });

//To only allow logged in users
router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReview)
  .post(reviewController.setTourUserId, reviewController.createReview);

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(reviewController.deleteReview)
  .patch(reviewController.updateReview);

module.exports = router;
