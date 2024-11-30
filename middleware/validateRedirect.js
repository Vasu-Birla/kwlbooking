import * as path from 'path';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

// Allowed redirects for '/' and '/superadmin'
const allowedRedirects = [
    // Routes under '/'
    '/',
    '/book',
    '/booking_availability',
    '/dates_availability',
    '/appointment_types',
    '/time_availability',
    '/check_times',
    '/getBookingOtp',
    '/verifyOTP',
    '/confirmbooking',
    '/viewBookings',
    '/cancelBooking',
    '/reschedule',
    '/rescheduleBooking',
    '/updateBooking',
    '/getLoginOtp',
    '/verifyLoginOtp',
    '/login',
    '/logout',
    '/acuityBookings',
    '/logoutandProceed',
    '/booking',
    '/multibooking',
    '/kilbooking',

    // Routes under '/superadmin'
    '/superadmin',
    '/superadmin/index',
    '/superadmin/login',
    '/superadmin/logout',
    '/superadmin/appointments',
    '/superadmin/ForgotPassword',
    '/superadmin/sendOTP',
    '/superadmin/verify-otp',
    '/superadmin/reset-password',
    '/superadmin/profile',
    '/superadmin/updateUserPic',
    '/superadmin/updateAdmin',
    '/superadmin/changepass',
    '/superadmin/cancelBooking',
    '/superadmin/reschedule',
    '/superadmin/rescheduleBooking',
    '/superadmin/updateBooking',
    '/superadmin/reports',
    '/superadmin/auditLogs',
    '/superadmin/auditlogs',
    '/superadmin/error404',
    '/superadmin/error500',
    '/superadmin/logoutandProceed'
];

const validateRedirectUrl = (req, res, next) => {
    const redirectUrl = req.query.redirect || req.body.redirect || '';
    
    // Check if the redirectUrl or current path is allowed
    if (!allowedRedirects.includes(redirectUrl) && !allowedRedirects.includes(req.path)) {
        return res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
    }

    next();
};

export { validateRedirectUrl };
