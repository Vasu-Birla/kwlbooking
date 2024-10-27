import express from 'express'
import { book, booking_availability, home } from '../controllers/indexController.js';

const router = express.Router();

router.route('/').get(home)

router.route('/book').get(book)

router.route('/booking_availability').get(booking_availability)



export default router