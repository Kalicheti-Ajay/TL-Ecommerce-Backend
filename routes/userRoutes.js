const express = require("express");
const {authenticate, authorize} = require("../middleware/middleware");
const {register,login,listUsers,updateUserRole} = require("../controllers/userController");

const router = express.Router();
router.post("/register",register);
router.post("/login",login);
router.get("/users",authenticate,authorize("admin"),listUsers);
router.patch("/users/:id/role",authenticate,authorize("admin"),updateUserRole);

module.exports = router;
