const User = require('./../models/usermodel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

const filterObj = (Obj, ...allowedFields) => {
  let newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //Create error if user post password data.
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates', 400));
  }

  //Update user document.
  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = exports.getallusers = catchAsync(async (req, res) => {
  console.log('Fetching Users');

  const users = await User.find();

  console.log('Users fetched');

  //SEND RESPONSE
  res.status(200).json({
    status: 'success',
    requestedat: req.requestTime,
    result: users.length,
    data: {
      user: users,
    },
  });
});

exports.creatusers = catchAsync(async (req, res, next) => {
  res.status(500).json({
    status: 'error',
    message: 'This route will not be defined, Use /signup instead',
  });
});

exports.getuser = factory.getOne(User);
exports.getAlluser = factory.getAll(User);

//Do not update password with this.
exports.updateuser = factory.updateOne(User);
exports.deleteuser = factory.deleteOne(User);
