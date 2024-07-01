const AppError = require('../utils/appError');

const handleIvalidErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

const handleValidateErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJwtError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJwtExpriredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDevelopment = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProduction = (err, res) => {
  // Error Operational: sent message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // Error programing or other unknow: don't show error detail
  } else {
    console.error('ERROR 🔥', err);

    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDevelopment(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    // Handle error form DB to client
    if (err.name === 'CastError') error = handleIvalidErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    if (err.name === 'ValidationError') error = handleValidateErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJwtError();
    if (err.name === 'TokenExpiredError') error = handleJwtExpriredError();

    sendErrorProduction(error, res);
  }
};
