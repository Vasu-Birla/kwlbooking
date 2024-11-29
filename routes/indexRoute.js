import express from 'express'
import { acuityBookings, appointment_types, book, booking, booking_availability, cancelBooking, check_times, confirmbooking, dates_availability, fetchAndSyncAcuityBookings, getBookingOtp, getLoginOtp, home, login, logout, logoutandProceed, multibooking, reschedule, rescheduleBooking, time_availability, updateBooking, verifyLoginOtp, verifyOTP, viewBookings } from '../controllers/indexController.js';



import { isAuthenticatedUser } from "../middleware/Userauth.js";

import { globalAuth } from "../middleware/globleauth.js"


const router = express.Router();

router.route('/').get(globalAuth,home)

router.route('/book').get(globalAuth,book)




//----------------- Booking Section -------------



router.route('/booking').get(globalAuth,booking)

router.route('/booking_availability').get(globalAuth,booking_availability)

router.route('/dates_availability').get( globalAuth,dates_availability);

router.use('/appointment_types', globalAuth,appointment_types);

router.route('/time_availability').get( globalAuth,time_availability);

router.route('/check_times').post( check_times);



router.route('/getBookingOtp').post(getBookingOtp)

router.route('/verifyOTP').post(verifyOTP)

router.route('/confirmbooking').post(confirmbooking)

router.route('/multibooking').post(multibooking)





router.route('/viewBookings').get(isAuthenticatedUser,viewBookings)

router.route('/cancelBooking').post(isAuthenticatedUser,cancelBooking)


router.route('/reschedule').get(isAuthenticatedUser,reschedule)

router.route('/rescheduleBooking').post(isAuthenticatedUser,rescheduleBooking)

router.route('/updateBooking').post(isAuthenticatedUser,updateBooking)




//---------- Login section 

router.route('/getLoginOtp').post(getLoginOtp)

router.route('/verifyLoginOtp').post(verifyLoginOtp)

router.route('/login').post(login)

router.route('/logout').get(isAuthenticatedUser,logout)


router.route('/logoutandProceed').post(logoutandProceed)




//----------------  acuityBookings -------------

router.route('/acuityBookings').get(fetchAndSyncAcuityBookings)






export default router