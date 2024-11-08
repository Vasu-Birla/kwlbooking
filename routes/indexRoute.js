import express from 'express'
import { book, booking_availability, dates_availability, getLoginOtp, home, login, logout, verifyLoginOtp, viewBookings } from '../controllers/indexController.js';



import { isAuthenticatedUser } from "../middleware/Userauth.js";

import { globalAuth } from "../middleware/globleauth.js"


const router = express.Router();

router.route('/').get(globalAuth,home)

router.route('/book').get(globalAuth,book)

router.route('/booking_availability').get(globalAuth,booking_availability)

router.route('/dates_availability').get(isAuthenticatedUser, dates_availability);


router.route('/viewBookings').get(isAuthenticatedUser,viewBookings)




//---------- Login section 

router.route('/getLoginOtp').post(getLoginOtp)

router.route('/verifyLoginOtp').post(verifyLoginOtp)

router.route('/login').post(login)

router.route('/logout').get(logout)









export default router