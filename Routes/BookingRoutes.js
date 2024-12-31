const bookingController = require('../controlers/bookingCotroller');
const authController = require('../controlers/authController');
const express = require('express');
const router = express.Router();

router.get(
  '/checkoutSession/:tourID',
  authController.protect,
  bookingController.getCheckoutSession
);

module.exports = router;
