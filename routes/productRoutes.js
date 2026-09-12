const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const {authenticate,optionalAuthenticate,authorize} = require("../middleware/middleware");
const controller = require("../controllers/productController");

const router = express.Router();
const admin = [authenticate, authorize("admin")];

router.post("/", ...admin,controller.createProduct);
router.post("/import", ...admin,upload.single("file"),controller.importProducts);
router.get("/export", ...admin,controller.exportProducts);
router.get("/",optionalAuthenticate,controller.getAllProducts);
router.get("/:id",optionalAuthenticate,controller.getProductById);
router.put("/:id", ...admin,controller.updateProduct);
router.patch("/:id/publish", ...admin,controller.publishProduct);
router.patch("/:id/unpublish", ...admin,controller.unpublishProduct);
router.delete("/:id", ...admin,controller.deleteProduct);
router.delete("/", ...admin,controller.deleteAllProducts);

module.exports = router;
