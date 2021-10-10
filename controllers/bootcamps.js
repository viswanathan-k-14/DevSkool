const path = require('path');
const geocoder = require('../utils/geocoder');
const Bootcamp = require('../models/Bootcamp');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

//@desc  get all bootcamps
//@endpoint  /api/v1/bootcamps
//@access   Public

exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

//@desc  get single bootcamp
//@endpoint  /api/v1/bootcamps/:id
//@access   Public

exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    next(
      new ErrorResponse(`Bootcamp with id ${req.params.id} is not found`, 404)
    );
  } else {
    return res.status(200).json({ success: true, data: bootcamp });
  }
});

//@desc  create a bootcamp
//@endpoint  /api/v1/bootcamps
//@access   Private

exports.createBootcamp = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;

  const publishedBootcamps = await Bootcamp.findOne({ user: req.user.id });

  // A publisher can post only one bootcamp
  if (publishedBootcamps && req.user.role !== 'admin') {
    next(
      new ErrorResponse(
        `Limits to create bootcamp reached for ${req.user.name}`,
        404
      )
    );
  } else {
    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({ success: true, data: bootcamp });
  }
});

//@desc   update a bootcamp
//@endpoint  /api/v1/bootcamps/:id
//@access   Private

exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp with id ${req.params.id} is not found`, 404)
    );
  }

  // check if the bootcamp updated is owned by the current user
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        ` User ${req.user.id} is not authorized to update this bootcamp`,
        401
      )
    );
  }
  bootcamp = await Bootcamp.findOneAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  return res.status(200).json({ success: true, data: bootcamp });
});

//@desc  delete a bootcamp
//@endpoint  /api/v1/bootcamps/:id
//@access   Private

exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp with id ${req.params.id} is not found`, 404)
    );
  }

  // check if the bootcamp deleted is owned by the current user
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        ` User ${req.user.id} is not authorized to delete this bootcamp`,
        401
      )
    );
  }
  bootcamp.remove();
  return res.status(204).json({ success: true, data: {} });
});

//@desc  find bootcamps with zipcode and distance
//@endpoint  /api/v1/bootcamps/:zipcode/:distance
//@access   Private

exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // fetch lat / long
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Get radius in radians
  const radius = distance / 3963;

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

// @desc      Upload photo for bootcamp
// @route     PUT /api/v1/bootcamps/:id/photo
// @access    Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is bootcamp owner
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to update this bootcamp`,
        401
      )
    );
  }

  if (!req.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = req.files.file;

  // Make sure the image is a photo
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  // // Check filesize
  if (file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  }

  // Create custom filename
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.error(err);
      return next(new ErrorResponse(`Problem with file upload`, 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
});
