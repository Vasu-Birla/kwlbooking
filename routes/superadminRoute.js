import express from "express";

import { login , home, error404, error500, loginAdmin,profile,profilePost,logout, index ,  
  updateUserPic,
  updateAdmin,
  changepass,

  ForgotPassword,
  sendOTP,
  verifyOTP,
  resetpassword,

  appointments
} from "../controllers/superadminController.js";
import { isAuthenticatedAdmin } from "../middleware/Adminauth.js";

import upload from '../middleware/upload.js';

import { docUploads, profileUpload , vehicleUploads, countryUploads ,sliderUploads, fileUpload } from '../middleware/uploader.js';

const router = express.Router();

router.route('/').get(isAuthenticatedAdmin,home)

router.route('/index').get(isAuthenticatedAdmin,index)





//------------------- Admin Start -------------------------------

router.route('/login').get(login);

router.route('/login').post(loginAdmin)

router.route('/logout').get(logout)


//---------- appointments ------------- 


router.route('/appointments').get(appointments);




//------------------------- Forgot Reset Password ----------------

router.route('/ForgotPassword').get(ForgotPassword)

router.route('/sendOTP').post(sendOTP)

router.route('/verify-otp').post(verifyOTP)

router.route('/reset-password').post(resetpassword)




router.route('/profile').get(isAuthenticatedAdmin,profile)

router.route('/profile').post(isAuthenticatedAdmin,updateAdmin) 

router.route('/updateUserPic').post(isAuthenticatedAdmin,profileUpload.single('image'),updateUserPic)


router.route('/updateAdmin').post( isAuthenticatedAdmin,profileUpload.single('profile_image'),updateAdmin)

router.route('/changepass').post( isAuthenticatedAdmin,profileUpload.single('profile_image'),changepass)




//--------------- Admin section End -------------------------------


router.route('/error404').get(error404);

router.route('/error500').get(error500)


//===============================  End Router ================================
export default router;


