const express = require('express');
const usercontroller = require('./../controlers/usersCon');
const authcontroller = require('./../controlers/authController');
const router = express.Router();

router.post('/signup', authcontroller.signup);
router.post('/login', authcontroller.login);
router.post('/forgotpassword', authcontroller.forgotpassword);
router.post('/resetpassword/:token', authcontroller.resetPassword);

//For routes that require login access
router.use(authcontroller.protect);

router.patch('/updateMyPassword', authcontroller.updatePassword);
router.patch('/update', usercontroller.updateMe);
router.delete('/deleteMe', usercontroller.deleteMe);
router.get('/me', usercontroller.getMe, usercontroller.getuser);

router
  .route('/')
  .get(usercontroller.getallusers)
  .post(usercontroller.creatusers);

router
  .route('/:id')
  .get(usercontroller.getuser)
  .patch(usercontroller.updateuser)
  .delete(authcontroller.restrictTo('superAdmin'), usercontroller.deleteuser);

module.exports = router;
