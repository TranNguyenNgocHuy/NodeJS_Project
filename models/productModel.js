const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'The product must have a name'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'The product must have a price']
  },
  priceDiscount: Number,
  quantity: {
    type: Number,
    default: 0
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
    default: 4.5
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
