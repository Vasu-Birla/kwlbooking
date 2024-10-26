import express from "express";

import { login , home, error404, error500, loginAdmin,profile,profilePost,addUser, addUserPost, viewUsers, changeUserStatus, deleteUser, user_withdrawal_report, deposit_to_User, withdrawal_to_User, addOwner, addUserOwner, changeOwnerStatus, deleteOwner, Owner_withdrawal_report, deposit_to_Owner, withdrawal_to_Owner, viewOwners, pending_bookings, confirmed_bookings, ongoing_bookings, completed_bookings, cancelled_bookings, logout, index ,
  user_document_management,Owner_document_management,vehicleCategory,vehicleModel,vehicleTypes,vehicleFeatures,viewVehicles,
  checkemail,
  checkphonenumber,
  vehicleCategoryPost,
  vehicleModelPost,
  updateModels,
  deleteMake,
  changeMakeStatus,
  checkModel,
  checkMake,
  vehicleTypesPost,
  vehicleFeaturesPost,
  UpdatevehicleTypes,
  changeTypeStatus,
  deleteVehicleType,
  UpdateFeature,
  changeFeatureStatus,
  deleteFeature,
  checkType,
  checkFeature,
  updateUser,
  adduserAmount,
  adduserAmountPost,
  addownerAmount,
  addownerAmountPost,
  changeLicenseStatus,
  senddocNotification,
  updateOwner,
  senddocNotificationOwner,
  promotional_plans,
  promotional_plansPost,
  discount_coupons,
  discount_couponsPost,
  checkCoupanCode,
  changePlanStatus,
  deletePlan,
  changeCouponStatus,
  deleteCoupon,
  changeVehicleStatus,
  deleteVehicle,
  addSubadmin,
  addCountry,
  multi_currency,
  general_setting,
  addAppSlider,
  notifications,
  ownerRatings,
  userRatings,
  affiliation,
  referralAmounts,
  deposits_fee,
  users_faqs,
  owners_faqs,
  owners_privacy_policy,
  users_privacy_policy,
  users_terms_condition,
  owners_terms_condition,
  inquiry_contacts,
  about_us,
  queries,
  general_settingPost,
  addCountryPost,
  checkCountry,
  checkcountryCode,
  checkcurrencyName,
  changeCountryStatus,
  deleteCountry,
  addAppSliderPost,
  deleteSlider,
  updateCountryDetails,
  notificationsPost,
  affiliationPost,
  deleteAcode,
  referralAmountsPost,
  deletereferrals,
  deposits_feePost,
  deleteDepositeRate,
  addFAQ,
  deleteFAQ,
  editFAQ,
  addPrivacyPolicy,
  deletePrivacyPolicy,
  addTermsCondition,
  deleteTerms,
  users_cancellation_policy,
  addCancellationPolicy,
  deleteCancellationPolicy,
  owners_cancellation_policy,
  QueriesPost,
  AftersendemailQuriesReload,
  sendMailtoUser,
  updateUserPic,
  updateAdmin,
  changepass,
  addAboutus,
  deleteAboutus,
  ForgotPassword,
  sendOTP,
  verifyOTP,
  resetpassword,
  inquiry_contactsPost,
  checksubadminemail,
  checksubadminphonenumber,
  checksubadminusername,
  viewSubadmins,
  updateSubadmin,
  changeSubadminStatus,
  deleteSubadmin
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






//------------------- User Section ------------------



router.route('/addUser').get(isAuthenticatedAdmin,addUser)

router.route('/addUser').post(docUploads.fields([{ name: 'front_image', maxCount: 1 }, { name: 'back_image', maxCount: 1 } ]),isAuthenticatedAdmin,addUserPost)


router.route('/updateUser').post( isAuthenticatedAdmin,profileUpload.single('profile_image'),updateUser)


router.route('/adduserAmount').get(isAuthenticatedAdmin,adduserAmount)

router.route('/adduserAmount').post(isAuthenticatedAdmin,adduserAmountPost)










router.route('/checkemail').post(isAuthenticatedAdmin, checkemail)

router.route('/checkphonenumber').post(isAuthenticatedAdmin, checkphonenumber)


router.route('/viewUsers').get(isAuthenticatedAdmin,viewUsers)

router.route('/changeUserStatus').post(isAuthenticatedAdmin,changeUserStatus)

router.route('/deleteUser').post(isAuthenticatedAdmin,deleteUser)

router.route('/user_withdrawal_report').get(isAuthenticatedAdmin,user_withdrawal_report)
router.route('/user_document_management').get(isAuthenticatedAdmin,user_document_management)


router.route('/changeLicenseStatus').post(isAuthenticatedAdmin,changeLicenseStatus)

router.route('/senddocNotification').post(isAuthenticatedAdmin,senddocNotification)




router.route('/deposit_to_User').post(isAuthenticatedAdmin,deposit_to_User)

router.route('/withdrawal_to_User').post(isAuthenticatedAdmin,withdrawal_to_User)




  //------------------- Owner  Section ------------------



router.route('/addOwner').get(isAuthenticatedAdmin,addOwner)


router.route('/addOwner').post(isAuthenticatedAdmin,docUploads.array('front_image'),addUserOwner)



router.route('/viewOwners').get(isAuthenticatedAdmin,viewOwners)

router.route('/updateOwner').post( isAuthenticatedAdmin,profileUpload.single('profile_image'),updateOwner)



router.route('/changeOwnerStatus').post(isAuthenticatedAdmin,changeOwnerStatus)

router.route('/deleteOwner').post(isAuthenticatedAdmin,deleteOwner)

router.route('/senddocNotificationOwner').post(isAuthenticatedAdmin,senddocNotificationOwner)




router.route('/Owner_withdrawal_report').get(isAuthenticatedAdmin,Owner_withdrawal_report)
router.route('/Owner_document_management').get(isAuthenticatedAdmin,Owner_document_management)



router.route('/deposit_to_Owner').post(isAuthenticatedAdmin,deposit_to_Owner)

router.route('/withdrawal_to_Owner').post(isAuthenticatedAdmin,withdrawal_to_Owner)


router.route('/addownerAmount').get(isAuthenticatedAdmin,addownerAmount)

router.route('/addownerAmount').post(isAuthenticatedAdmin,addownerAmountPost)



  //------------------- Booking  Section ------------------  

router.route('/pending_bookings').get(isAuthenticatedAdmin,pending_bookings)

router.route('/confirmed_bookings').get(isAuthenticatedAdmin,confirmed_bookings)

router.route('/ongoing_bookings').get(isAuthenticatedAdmin,ongoing_bookings)

router.route('/completed_bookings').get(isAuthenticatedAdmin,completed_bookings)

router.route('/cancelled_bookings').get(isAuthenticatedAdmin,cancelled_bookings)





  //------------------- Vehicle Make models  Section ------------------  
router.route('/vehicleCategory').get(isAuthenticatedAdmin,vehicleCategory)

router.route('/checkMake').post(isAuthenticatedAdmin, checkMake)

router.route('/vehicleCategory').post(isAuthenticatedAdmin,vehicleUploads.single('make_image'),vehicleCategoryPost)

router.route('/vehicleModel').get(isAuthenticatedAdmin,vehicleModel)




router.route('/vehicleModel').post(isAuthenticatedAdmin,vehicleModelPost)

router.route('/updateModels').post(isAuthenticatedAdmin,updateModels)

router.route('/deleteMake').post(isAuthenticatedAdmin,deleteMake)

router.route('/changeMakeStatus').post(isAuthenticatedAdmin,changeMakeStatus)

router.route('/checkModel').post(isAuthenticatedAdmin, checkModel)





//------------ Vechicle types section -------------------

router.route('/vehicleTypes').get(isAuthenticatedAdmin,vehicleTypes)

router.route('/vehicleTypes').post(isAuthenticatedAdmin,vehicleUploads.single('type_image'),vehicleTypesPost)

router.route('/UpdatevehicleTypes').post(isAuthenticatedAdmin,vehicleUploads.single('type_image'),UpdatevehicleTypes)


router.route('/changeTypeStatus').post(isAuthenticatedAdmin,changeTypeStatus)

router.route('/deleteVehicleType').post(isAuthenticatedAdmin,deleteVehicleType)



router.route('/checkType').post(isAuthenticatedAdmin,checkType)









router.route('/vehicleFeatures').get(isAuthenticatedAdmin,vehicleFeatures)


router.route('/checkFeature').post(isAuthenticatedAdmin,checkFeature)

router.route('/vehicleFeatures').post(isAuthenticatedAdmin,vehicleUploads.single('feature_image'),vehicleFeaturesPost)

router.route('/UpdateFeature').post(isAuthenticatedAdmin,vehicleUploads.single('type_image'),UpdateFeature)


router.route('/changeFeatureStatus').post(isAuthenticatedAdmin,changeFeatureStatus)

router.route('/deleteFeature').post(isAuthenticatedAdmin,deleteFeature)



//====================== Vehicle Section ======================================= 





router.route('/viewVehicles').get(isAuthenticatedAdmin,viewVehicles)


router.route('/changeVehicleStatus').post(isAuthenticatedAdmin,changeVehicleStatus)

router.route('/deleteVehicle').post(isAuthenticatedAdmin,deleteVehicle)





//============== Promotion Section =============== 

router.route('/promotional_plans').get(isAuthenticatedAdmin,promotional_plans)

router.route('/promotional_plans').post(isAuthenticatedAdmin,promotional_plansPost)

router.route('/changePlanStatus').post(isAuthenticatedAdmin,changePlanStatus)

router.route('/deletePlan').post(isAuthenticatedAdmin,deletePlan)





//================= Coupon Section ============================

router.route('/discount_coupons').get(isAuthenticatedAdmin,discount_coupons)

router.route('/discount_coupons').post(isAuthenticatedAdmin,discount_couponsPost)

router.route('/checkCoupanCode').post(isAuthenticatedAdmin,checkCoupanCode)


router.route('/changeCouponStatus').post(isAuthenticatedAdmin,changeCouponStatus)

router.route('/deleteCoupon').post(isAuthenticatedAdmin,deleteCoupon)








//====================   Subadmin Section ============================ 

router.route('/addSubadmin').get(isAuthenticatedAdmin,addSubadmin)

router.route('/addSubadmin').post(isAuthenticatedAdmin,addSubadmin)

router.route('/checksubadminemail').post(isAuthenticatedAdmin,checksubadminemail)

router.route('/checksubadminphonenumber').post(isAuthenticatedAdmin,checksubadminphonenumber)


router.route('/checksubadminusername').post(isAuthenticatedAdmin,checksubadminusername)




router.route('/viewSubadmins').get(isAuthenticatedAdmin,viewSubadmins)

router.route('/updateSubadmin').post(isAuthenticatedAdmin,updateSubadmin)

router.route('/changeSubadminStatus').post(isAuthenticatedAdmin,changeSubadminStatus)

router.route('/deleteSubadmin').post(isAuthenticatedAdmin,deleteSubadmin)






//----------------- Country Section ------------------------

router.route('/addCountry').get(isAuthenticatedAdmin,addCountry)

router.route('/addCountry').post(isAuthenticatedAdmin,countryUploads.single('country_image'),addCountryPost)



router.route('/checkCountry').post(isAuthenticatedAdmin,checkCountry)

router.route('/checkcountryCode').post(isAuthenticatedAdmin,checkcountryCode)

router.route('/checkcurrencyName').post(isAuthenticatedAdmin,checkcurrencyName)


router.route('/updateCountryDetails').post(isAuthenticatedAdmin,countryUploads.single('country_image'),updateCountryDetails)



router.route('/changeCountryStatus').post(isAuthenticatedAdmin,changeCountryStatus)

router.route('/deleteCountry').post(isAuthenticatedAdmin,deleteCountry)

router.route('/multi_currency').get(isAuthenticatedAdmin,multi_currency)








//------------ Importaant Credencials Setting  Section -------------------------


router.route('/general_setting').get(isAuthenticatedAdmin,general_setting)

router.route('/general_setting').post(isAuthenticatedAdmin,general_settingPost)







//------------ App Slider  Section -------------------------

router.route('/addAppSlider').get(isAuthenticatedAdmin,addAppSlider)

router.route('/addAppSlider').post(isAuthenticatedAdmin,sliderUploads.array('slider_image'),addAppSliderPost)

router.route('/deleteSlider').post(isAuthenticatedAdmin,deleteSlider)




//------------ Notifiation  Section -------------------------


router.route('/notifications').get(isAuthenticatedAdmin,notifications)

router.route('/notifications').post(isAuthenticatedAdmin,fileUpload.single('emailAttachment'),notificationsPost)






//------------ Ratings  Section -------------------------

router.route('/userRatings').get(isAuthenticatedAdmin,userRatings)

router.route('/ownerRatings').get(isAuthenticatedAdmin,ownerRatings)




//------------ affiliations Section -------------------------

router.route('/affiliation').get(isAuthenticatedAdmin,affiliation)

router.route('/affiliation').post(isAuthenticatedAdmin,affiliationPost)


router.route('/deleteAcode').post(isAuthenticatedAdmin,deleteAcode)






//------------ referralAmounts Section -------------------------

router.route('/referralAmounts').get(isAuthenticatedAdmin,referralAmounts)

router.route('/referralAmounts').post(isAuthenticatedAdmin,referralAmountsPost)


router.route('/deletereferrals').post(isAuthenticatedAdmin,deletereferrals)



//------------ Deposite Section -------------------------

router.route('/deposits_fee').get(isAuthenticatedAdmin,deposits_fee)

router.route('/deposits_fee').post(isAuthenticatedAdmin,deposits_feePost)

router.route('/deleteDepositeRate').post(isAuthenticatedAdmin,deleteDepositeRate)






//------------ USER FAQs Section -------------------------

router.route('/users_faqs').get(isAuthenticatedAdmin,users_faqs)


router.route('/users_faqs').post(isAuthenticatedAdmin ,addFAQ)

router.route('/deleteFAQ').post(isAuthenticatedAdmin ,deleteFAQ)

router.route('/editFAQ').post(isAuthenticatedAdmin,editFAQ)





//------------ Owner FAQs Section -------------------------

router.route('/owners_faqs').get(isAuthenticatedAdmin,owners_faqs)

// router.route('/addFAQ').get((req, res) => res.redirect(req.url));

router.route('/owners_faqs').post(isAuthenticatedAdmin ,addFAQ)





//---------------  Privacy Policy Section  -------------

router.route('/users_privacy_policy').get(isAuthenticatedAdmin,users_privacy_policy)

router.route('/users_privacy_policy').post(isAuthenticatedAdmin,addPrivacyPolicy)

router.route('/deletePrivacyPolicy').post(isAuthenticatedAdmin,deletePrivacyPolicy)


router.route('/owners_privacy_policy').get(isAuthenticatedAdmin,owners_privacy_policy)

router.route('/owners_privacy_policy').post(isAuthenticatedAdmin,addPrivacyPolicy)




//------------------------ Cancellation Policy Section -----------------------


router.route('/users_cancellation_policy').get(isAuthenticatedAdmin,users_cancellation_policy)

router.route('/users_cancellation_policy').post(isAuthenticatedAdmin,addCancellationPolicy)

router.route('/deleteCancellationPolicy').post(isAuthenticatedAdmin,deleteCancellationPolicy)


router.route('/owners_cancellation_policy').get(isAuthenticatedAdmin,owners_cancellation_policy)

router.route('/owners_cancellation_policy').post(isAuthenticatedAdmin,addCancellationPolicy)





router.route('/users_terms_condition').get(isAuthenticatedAdmin,users_terms_condition)

router.route('/users_terms_condition').post(isAuthenticatedAdmin,addTermsCondition)


router.route('/owners_terms_condition').get(isAuthenticatedAdmin,owners_terms_condition)


router.route('/owners_terms_condition').post(isAuthenticatedAdmin,addTermsCondition)


router.route('/deleteTerms').post(isAuthenticatedAdmin,deleteTerms)





//--------------  addInquiryDetails ---------

router.route('/inquiry_contacts').get(isAuthenticatedAdmin,inquiry_contacts)

router.route('/inquiry_contacts').post(isAuthenticatedAdmin,inquiry_contactsPost)






//---------------- About us section -----------------------------
router.route('/about_us').get(isAuthenticatedAdmin,about_us)

router.route('/about_us').post(isAuthenticatedAdmin,addAboutus)

router.route('/deleteAboutus').post(isAuthenticatedAdmin,deleteAboutus)







//--------------------- Ticket system 
router.route('/queries').get(isAuthenticatedAdmin,queries)

router.route('/queries').post(isAuthenticatedAdmin, QueriesPost)

router.route('/sendemail').get(isAuthenticatedAdmin ,AftersendemailQuriesReload)

router.route('/sendemail').post(isAuthenticatedAdmin,sendMailtoUser)






//------------- Subadmin -----------------------




//===============================  End Router ================================
export default router;


