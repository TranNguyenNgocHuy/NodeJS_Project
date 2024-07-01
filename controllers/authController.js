const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchErrorAsync = require('../utils/catchErrorAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const generateSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expries: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  user.password = undefined;
  res.cookie('jwt', token);
  res.status(statusCode).json({
    status: 'success',
    token: token,
    data: {
      user
    }
  });
};

exports.signup = catchErrorAsync(async (req, res, next) => {
  const newUser = await User.create({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    avatarImg: req.body.avatarImg,
    role: req.body.role
  });

  generateSendToken(newUser, 201, res);
});

exports.login = catchErrorAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.isValidPassword(password, user.password))) {
    return next(new AppError('Email or password invalid!', 401));
  }

  generateSendToken(user, 200, res);
});

exports.authenticated = catchErrorAsync(async (req, res, next) => {
  let token;
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

  const isDecode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(isDecode.id);
  if (!currentUser) {
    return next(
      new AppError('The user belong to this token does no longer exist', 401)
    );
  }

  if (currentUser.changePasswordAfterIssued(isDecode.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }
  // Access authentication
  req.user = currentUser;
  next();
});

exports.permission = (...roles) => {
  console.log('hello');
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchErrorAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetPasswordURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const emailContent = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetPasswordURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message: emailContent
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to your email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.resetPassword = catchErrorAsync(async (req, res, next) => {
  // 1. Get user base on password token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expires', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  generateSendToken(user, 210, res);
});

exports.updatePassword = catchErrorAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!user.isValidPassword(req.body.passwordCurrent, user.password)) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  generateSendToken(user, 200, res);
});
