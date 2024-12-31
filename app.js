const express = require('express');
const app = express();
const IntegrateDB = require('./config/db');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');

const tourRouter = require('./Routes/touroutes');
const userRouter = require('./Routes/useroutes');
const reviewRouter = require('./Routes/reviewRouter');
const bookingRouter = require('./Routes/BookingRoutes');
const AppError = require('./utils/appError');
const globalerrorhandler = require('./controlers/errorController');
const SuperAdmin = require('./config/SuperAdmin');

//Database integration
IntegrateDB();

//Super Admin creation
SuperAdmin();

// 1) Global Middlewares
console.log(process.env.NODE_ENV);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Body parser, reading data from body into req.body.
app.use(express.json());

//Serving static files.
app.use(express.static(`${__dirname}/public`));

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Test Route
app.get('/test', (req, res) => {
  res.status(200).send('Server is working');
});

// Main Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/review', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Unresolved Route
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Error handler
app.use(globalerrorhandler);

module.exports = app;
