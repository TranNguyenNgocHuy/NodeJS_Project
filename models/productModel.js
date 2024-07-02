const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'The product must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        50,
        'A product name must have less or equal then 50 characters'
      ],
      minlength: [5, 'A product name must have more or equal then 5 characters']
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'The product must have a price'],
      min: [1, 'Price must be greater 1']
    },
    priceDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Price discount must be greater or equal 0'],
      validate: {
        validator: function(val) {
          // Only works with creation, not with updates
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price'
      }
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity must be greater or equal 0']
    },
    imageCover: {
      type: String,
      required: [true, 'The product must have a cover image URL']
    },
    images: [String],
    brand: {
      type: String,
      required: [true, 'The product must have a brand'],
      trim: true
    },
    weight: {
      type: Number,
      required: [true, 'The product must have a weight']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0']
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Ratings quantity must be greater or equal 0']
    },
    createdAt: {
      type: Date,
      default: Date.now,
      select: false
    },
    createBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual property
productSchema.virtual('discountPercent').get(function() {
  let discountPercent = 0;
  if (this.priceDiscount === 0) return discountPercent;

  const discountMoney = this.price - this.priceDiscount;
  discountPercent = (discountMoney / this.price) * 100;

  return discountPercent;
});

// Virtual populate
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save and .create
productSchema.pre('save', function(next) {
  console.log(this);
  next();
});

// QUERY MIDDLEWARE
productSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'createBy',
    select: '-__v -passwordChangedAt'
  });
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
