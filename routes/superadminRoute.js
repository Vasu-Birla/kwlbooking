import express from "express";

import { login , home, error404, error500, loginAdmin,profile,profilePost,logout, index ,  
  updateUserPic,
  updateAdmin,
  changepass,

  ForgotPassword,
  sendOTP,
  verifyOTP,
  resetpassword,
  appointments,
  cancelBooking,
  reschedule,
  rescheduleBooking,
  updateBooking,
  reports,
  auditLogs,
  logoutandProceed,
  addAgent,
  checkagentemail,
  checkagentphonenumber,
  checkagentusername,
  viewAgents,
  updateAgent,
  changeAgentStatus,
  deleteAgent
} from "../controllers/superadminController.js";
import { isAuthenticatedAdmin } from "../middleware/Adminauth.js";



import {  profileUpload , fileUpload } from '../middleware/uploader.js';

const router = express.Router();

router.route('/').get(isAuthenticatedAdmin,home)

router.route('/index').get(isAuthenticatedAdmin,index)





//------------------- Admin Start -------------------------------

router.route('/login').get(login);

router.route('/login').post(loginAdmin)

router.route('/logout').get(logout)


router.route('/logout').post(logout)

router.route('/logoutandProceed').post(logoutandProceed)




//---------- appointments ------------- 


router.route('/appointments').get(isAuthenticatedAdmin,appointments);




//------------------------- Forgot Reset Password ----------------

router.route('/ForgotPassword').get(ForgotPassword)

router.route('/sendOTP').post(sendOTP)

router.route('/verify-otp').post(verifyOTP)

router.route('/reset-password').post(resetpassword)




router.route('/profile').get(isAuthenticatedAdmin,profile)

router.route('/profile').post(isAuthenticatedAdmin,updateAdmin) 

router.route('/updateUserPic').post(isAuthenticatedAdmin,profileUpload.single('image'),updateUserPic)


router.route('/updateAdmin').post( isAuthenticatedAdmin,profileUpload.single('image'),profilePost)

router.route('/changepass').post( isAuthenticatedAdmin,profileUpload.single('profile_image'),changepass)


//-------------- booking setion ---------------------------------


router.route('/cancelBooking').post(isAuthenticatedAdmin,cancelBooking)


router.route('/reschedule').get(isAuthenticatedAdmin,reschedule)

router.route('/rescheduleBooking').post(isAuthenticatedAdmin,rescheduleBooking)

router.route('/updateBooking').post(isAuthenticatedAdmin,updateBooking)




//----------------------




router.route('/reports').get(isAuthenticatedAdmin,reports)
router.route('/reports').post(isAuthenticatedAdmin,reports)



router.route('/auditLogs').get(isAuthenticatedAdmin,auditLogs)
//-----------------



//----------- add Agent -------------

router.route('/addAgent').get(isAuthenticatedAdmin,addAgent)

router.route('/addAgent').post(isAuthenticatedAdmin,addAgent)




router.route('/checkagentemail').post(isAuthenticatedAdmin,checkagentemail)

router.route('/checkagentphonenumber').post(isAuthenticatedAdmin,checkagentphonenumber)


router.route('/checkagentusername').post(isAuthenticatedAdmin,checkagentusername)


router.route('/viewAgents').get(isAuthenticatedAdmin,viewAgents)

router.route('/viewAgents1').get(isAuthenticatedAdmin,viewAgents)

router.route('/updateAgent').post(isAuthenticatedAdmin,updateAgent)

router.route('/changeAgentStatus').post(isAuthenticatedAdmin,changeAgentStatus)

router.route('/deleteAgent').post(isAuthenticatedAdmin,deleteAgent)





//============================================ Admin section End -------------------------------


router.route('/error404').get(error404);

router.route('/error500').get(error500)


//===============================  End Router ================================
export default router;


