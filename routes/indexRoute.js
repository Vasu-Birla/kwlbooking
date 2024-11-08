import express from 'express'
import { book, booking_availability, home, viewBookings } from '../controllers/indexController.js';



import { isAuthenticatedUser } from "../middleware/Userauth.js";


const router = express.Router();

router.route('/').get(home)

router.route('/book').get(book)

router.route('/booking_availability').get(booking_availability)

router.route('/viewBookings').get(isAuthenticatedUser,viewBookings)







export default router