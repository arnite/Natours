const express = require('express');
const tourcontroller = require('./../controlers/tourscon');
const authcontroller = require('./../controlers/authController');
const router = express.Router();
const reviewRouter = require('./../Routes/reviewRouter');

router.use('/:tourId/review', reviewRouter);

router
  .route('/topchair')
  .get(tourcontroller.aliastours, tourcontroller.getalltours);

router.route('/tourstats').get(tourcontroller.getourStats);

router.route('/monthlyplan/:year').get(tourcontroller.getmonthlyplan);

router
  .route('/')
  .get(authcontroller.protect, tourcontroller.getalltours)
  .post(tourcontroller.createalltours);

router
  .route('/:id')
  .get(tourcontroller.getours)
  .patch(tourcontroller.updatealltours)
  .delete(
    authcontroller.protect,
    authcontroller.restrictTo('admin', 'lead-guide'),
    tourcontroller.deletetour
  );

module.exports = router;
