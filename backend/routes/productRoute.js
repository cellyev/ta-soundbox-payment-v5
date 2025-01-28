const express = require("express");
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const router = express.Router();

router.get("/all-products", getAllProducts);

router.post(
  "/create-product-by-admin-who-not-admin-cannot-access-it",
  createProduct
);
router.put(
  "/update-product-by-admin-who-not-admin-cannot-access-it/:_id",
  updateProduct
);

router.delete(
  "/delete-product-by-admin-who-not-admin-cannot-access-it/:_id",
  deleteProduct
);

module.exports = router;
