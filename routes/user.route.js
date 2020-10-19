const express = require("express");
const router = express.Router();

const userController = require('../controllers/user.controller')

router.post("/create", userController.createUser);
router.get("/activate", userController.activateUser);
router.get("/get", userController.getUser);
router.post("/login", userController.loginUser);
router.get("/logout", userController.logoutUser);
router.post("/resetpassword", userController.passwordResetUser);
router.post("/delete", userController.deleteUser);

module.exports = router;
