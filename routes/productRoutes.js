const express = require("express"); 

const {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    patchProduct,
    deleteProduct
} = require("../controllers/productController");
const router = express.Router();

const authenticateToken = require("../middleware/middleware");

router.post("/", authenticateToken, createProduct);
router.get("/", authenticateToken, getAllProducts);
router.get("/:id", authenticateToken, getProductById);
router.put("/:id", authenticateToken, updateProduct);
router.patch("/:id", authenticateToken, patchProduct);
router.delete("/:id", authenticateToken, deleteProduct);

module.exports = router;



