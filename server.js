const express = require('express');
const dotenv = require('dotenv');
const bootcamps = require('./routes/bootcamps');
const courses = require('./routes/courses');
const auth = require('./routes/auth');
const users = require('./routes/users');
const reviews = require('./routes/reviews');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const xss = require('xss-clean');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const path = require('path');
const fileupload = require('express-fileupload');
const colors = require('colors');
const errorhandler = require('./middleware/error');
const dbConnect = require('./config/db');
const errorHandler = require('./middleware/error');

// include envars

dotenv.config({ path: './config/config.env' });

const app = express();
const PORT = process.env.PORT || 5000;

//body parser

app.use(express.json());

//cookie parser

app.use(cookieParser());

//connect to mongoDB

dbConnect();

//using morgan middleware

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//fileupload middleware
app.use(fileupload());

//Sanitize data:
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

//Prevent xss attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

//Enable cors
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

//mount the router

app.use('/api/v1/bootcamps', bootcamps);
app.use('/api/v1/courses', courses);
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/reviews', reviews);
app.use(errorHandler);

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on PORT ${process.env.PORT} `
      .yellow.bold
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});
