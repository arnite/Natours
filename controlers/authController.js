const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('./../models/usermodel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = await signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.Node_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  //Remove password from output.
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const token = await signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  //1. check if email and pasword exist
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  //2. check if user exist and password exist
  const user = await User.findOne({ email }).select('+password ');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3. if everything is ok, send token to client
  const token = signToken(user._id);

  res.status(200).json({
    status: 'sucess',
    token,
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  // Getting token and check if it is there.
  let token = '';

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // Verification of the token.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user stil exists.
  const freshuser = await User.findById(decoded.id);

  if (!freshuser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // Check if user changed password after TOKEN was issued.
  if (freshuser.changedPasswordAt(decoded.iat)) {
    return next(new AppError('The password has been changed', 401));
  }

  //GRANT ACCESS TO PROTECTED ROUTES.
  req.user = freshuser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array. i.e ['admin', 'lead-guide']

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform this action.', 403)
      );
    }
    next();
  };
};

exports.forgotpassword = catchAsync(async (req, res, next) => {
  //Get user based on posted email.
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new AppError('There is no user with that email adddress.', 404)
    );
  }

  //Then generate the random token.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it to user email.
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forget your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password resetToken',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    (user.passwordResetToken = undefined),
      (user.passwordResetExpires = undefined),
      await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!')
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //Get user based on their token.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //If token has not expired, and there is user, set the new password.
  if (!user) {
    return next(new AppError('Token is invalid', 400));
  }

  (user.password = req.body.password),
    (user.passwordConfirm = req.body.passwordConfirm);
  (user.passwordResetToken = undefined),
    (user.passwordResetExpires = undefined);

  await user.save();

  //log user in, send JWT token.
  const token = signToken(user._id);

  res.status(200).json({
    status: 'sucess',
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get user from collection.
  const user = await User.findById(req.user.id).select('+password');

  //Check if POSTED current password is correct.
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 404));
  }

  //If so, update password.
  (user.password = req.body.password),
    (user.password = req.body.passwordConfirm);

  await user.save();

  //Log user in, Send Token.
  createSendToken(user, 200, res);
});
