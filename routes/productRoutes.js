const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.param('id', productController.checkID);

router
  .route('/top-5-highest-price')
  .get(
    productController.aliasTopHighestPrice,
    productController.getAllProducts
  );

router.route('/product-stats').get(productController.getProductStats);

router
  .route('/')
  .get(
    authController.authenticated,
    authController.permission('admin'),
    productController.getAllProducts
  )
  .post(productController.createProduct);

router
  .route('/:id')
  .get(productController.getProduct)
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = router;
