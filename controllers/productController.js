const Product = require('../models/productModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchErrorAsync = require('../utils/catchErrorAsync');

exports.aliasTopHighestPrice = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-price';
  req.query.fields = 'name,price,brand,description,ratingsAverage';
  next();
};

exports.getAllProducts = catchErrorAsync(async (req, res, next) => {
  const features = new APIFeatures(Product.find(), req.query)
    .fillter()
    .sort()
    .limitFields()
    .paginate();
  const products = await features.query;
  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products
    }
  });
});

exports.getProduct = catchErrorAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product
    }
  });
});

exports.createProduct = catchErrorAsync(async (req, res, next) => {
  const newProduct = await Product.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      product: newProduct
    }
  });
});

exports.updateProduct = catchErrorAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      product
    }
  });
});

exports.deleteProduct = catchErrorAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError('No product found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getProductStats = catchErrorAsync(async (req, res, next) => {
  const stats = await Product.aggregate([
    {
      $match: {
        ratingsAverage: { $gte: 4.7 }
      }
    },
    {
      $group: {
        // _id: its mean group by ex: _id: null || _id: '$brand'
        _id: { $toUpper: '$name' },
        numProducts: { $sum: 1 },
        numRating: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: {
        avgPrice: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});
