const Product = require('../models/productModel');
const APIFeatures = require('../utils/apiFeatures');

exports.aliasTopHighestPrice = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-price';
  req.query.fields = 'name,price,brand,description,ratingsAverage';
  next();
};

exports.getAllProducts = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: 'Invalid data sent!'
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};

exports.getProductStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err
    });
  }
};
