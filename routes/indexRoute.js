import express from 'express'
import { appointment_types, book, booking_availability, check_times, confirmbooking, dates_availability, getBookingOtp, getLoginOtp, home, login, logout, time_availability, verifyLoginOtp, verifyOTP, viewBookings } from '../controllers/indexController.js';



import { isAuthenticatedUser } from "../middleware/Userauth.js";

import { globalAuth } from "../middleware/globleauth.js"


const router = express.Router();

router.route('/').get(globalAuth,home)

router.route('/book').get(globalAuth,book)




//----------------- Booking Section -------------

router.route('/booking_availability').get(globalAuth,booking_availability)

router.route('/dates_availability').get( dates_availability);

router.use('/appointment_types', appointment_types);

router.route('/time_availability').get( time_availability);

router.route('/check_times').post( check_times);



router.route('/getBookingOtp').post(getBookingOtp)

router.route('/verifyOTP').post(verifyOTP)

router.route('/confirmbooking').post(confirmbooking)



router.route('/viewBookings').get(isAuthenticatedUser,viewBookings)




//---------- Login section 

router.route('/getLoginOtp').post(getLoginOtp)

router.route('/verifyLoginOtp').post(verifyLoginOtp)

router.route('/login').post(login)

router.route('/logout').get(logout)









export default router