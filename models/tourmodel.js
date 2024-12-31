const mongoose = require('mongoose');
const slugify = require('slugify');

const tourschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must not exceed 40 characters'],
      minlength: [10, 'A tour name must not be below 10 characters'],
    },
    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a durations'],
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a groupsize'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty must either be easy, medium or difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'A tour ratings average must be greater than 1'],
      max: [5, 'A tour ratings average must be less than 5'],
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    summary: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    pricediscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Pride discount must be lower than price',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      requried: [true, 'A tour must have an image cover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

tourschema.index({ price: 1, ratingsAverage: -1 });
tourschema.index({ slug: 1 });

tourschema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual populate
tourschema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE this runs before the .save() and .create() command
tourschema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//QUERY MIDDLEWARE
tourschema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

tourschema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-_v-_passwordChangedAt',
  });
  next();
});

//AGGREGATION MIDDLEWARE
tourschema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

/*
tourschema.post('save', function (doc, next) {
  console.log(doc);
  next();
});
*/

const Tour = mongoose.model('Tour', tourschema);

module.exports = Tour;
