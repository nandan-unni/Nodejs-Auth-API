const express = require("express");
const router = express.Router();

const userController = require('../controllers/user.controller')

router.post("/create", userController.createUser);
router.get("/activate/:token", userController.activateUser);
router.get("/get", userController.getUser);
router.post("/login", userController.loginUser);
router.get("/logout", userController.logoutUser);
router.post("/delete", userController.deleteUser);
router.post("/forgotpassword", userController.forgotPassword);
router.get("/forgotpassword/:token", userController.forgotPasswordVerify);
router.post("/resetpassword", userController.resetPassword);

module.exports = router;
