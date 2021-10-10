const express = require('express');
const {
  getBootcamps,
  getBootcamp,
  getBootcampsInRadius,
  createBootcamp,
  updateBootcamp,
  bootcampPhotoUpload,
  deleteBootcamp,
} = require('../controllers/bootcamps');

const { protect, authorize } = require('../middleware/auth');

const advancedResults = require('../middleware/advancedResults');

const Bootcamp = require('../models/Bootcamp');

//adding a resource router to link bootcamp route and resource route
const coursesRouter = require('./courses');
const reviewsRouter = require('./reviews');
const router = express.Router();
router.use('/:bootcampId/courses', coursesRouter);
router.use('/:bootcampId/reviews', reviewsRouter);
router.route('/radius/:zipcode/:distance').get(getBootcampsInRadius);
router
  .route('/:id/photo')
  .put(protect, authorize('publisher', 'admin'), bootcampPhotoUpload);
router
  .route('/')
  .get(advancedResults(Bootcamp, 'courses'), getBootcamps)
  .post(protect, authorize('publisher', 'admin'), createBootcamp);
router
  .route('/:id')
  .get(getBootcamp)
  .put(protect, authorize('publisher', 'admin'), updateBootcamp)
  .delete(protect, authorize('publisher', 'admin'), deleteBootcamp);

module.exports = router;
