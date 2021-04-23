const express = require('express')
const router = express.Router();
const userController = require('../controllers/userController')

router.post("/register", userController.registerUser);
router.get('/verifytoken/:token', userController.verifyToken);
router.post('/resendtoken', userController.resendVerifyToken);
router.post('/forgotpassword', userController.forgotPassword);
router.get('/resetpassword/:token', userController.resetPassword);
router.post('/resetpassword/:token', userController.resetPassword);
router.post('/login', userController.login);
router.get('/getusers', userController.getUsers);

module.exports = router;