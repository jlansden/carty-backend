'use strict';

const config = require('./../../config');
const responseCodes = require('./../../helpers/response-codes');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors-api');
const express = require('express');
const router = express.Router();
const authHandler = require('./../../model_handlers/api/auth-handler');
const _ = require('underscore');


/*
    Name : Sign in
    Purpose : Sign in
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.post('/sign-in', async(req, res) => {
    try {
        if (req.body.code && req.body.mobile && req.body.mobile_country_code && req.body.user_type) {
            let response;
            if(req.body.user_type == 'customer'){
                response = await authHandler.signInCustomer(req.body);
            }
            else{
                response = await authHandler.signInDriver(req.body);
            }
            jsonResponse(res, responseCodes.OK, errors.noError(), response);
        } else {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.body.code), null);
            return;
        }
    }
});

/*
	Name : Sign up
	Purpose : Sign up
	Original Author : Gaurav Patel
	Created At : Created At : 26th Nov 2020
*/
router.post('/sign-up', async(req, res) => {
    try {
        if (req.body.user_type && req.body.code && req.body.name && req.body.email && req.body.mobile_country_code && req.body.mobile) {
            let response;
            if(req.body.user_type == 'customer'){
                if(req.body.gender){
                    response = await authHandler.signUpCustomer(req.body, req);
                }
                else{
                    jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
                    return;
                }
            }
            else{
                if(req.body.city || req.body.gender){
                    response = await authHandler.signUpDriver(req.body, req);
                }
                else{
                    jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
                    return;
                }
            }
            jsonResponse(res, responseCodes.OK, errors.noError(), response);
        } else {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.body.code), null);
            return;
        }
    }
});


/*
    Name : Check Email Mobile
    Purpose : Check Email Mobile
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.post('/check-email-mobile-exists', async(req, res) => {
    try {
        if (req.body.code && req.body.email && req.body.mobile_country_code && req.body.mobile && req.body.name && req.body.user_type) {
            let response = await authHandler.checkEmailMobileExists(req.body);
            jsonResponse(res, responseCodes.OK, errors.noError(), response);
        } else {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.body.code), null);
            return;
        }
    }
});

/*
    Name : Verify OTP
    Purpose : Verify OTP
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.post('/verify-otp', async(req, res) => {
    try {
        if (req.body.code && req.body.user_type && req.body.user_id && req.body.otp) {
            let response = await authHandler.verifyOTP(req.body);
            jsonResponse(res, responseCodes.OK, errors.noError(), response);
        } else {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.body.code), null);
            return;
        }
    }
});

/*
    Name : Resend OTP
    Purpose : Resend OTP
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.post('/resend-otp', async(req, res) => {
    try {
        if (req.body.code && req.body.user_type && req.body.user_id) {
            let response = await authHandler.resendOTP(req.body);
            jsonResponse(res, responseCodes.OK, errors.noError(), response);
        } else {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.body.code), null);
            return;
        }
    }
});

/*
    Name : Verify Mobile
    Purpose : Verify Mobile
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.post('/verify-mobile', async(req, res) => {
    try {
        if (req.body.code && req.body.verify_mobile_id && req.body.otp) {
            let response = await authHandler.verifyMobile(req.body);
            jsonResponse(res, responseCodes.OK, errors.noError(), response);
        } else {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.body.code), null);
            return;
        }
    }
});

/*
    Name : Resend OTP
    Purpose : Resend OTP
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.post('/resend-otp-verify-mobile', async(req, res) => {
    try {
        if (req.body.code && req.body.verify_mobile_id && req.body.name) {
            let response = await authHandler.resendOtpUsingMobileVerify(req.body);
            jsonResponse(res, responseCodes.OK, errors.noError(), response);
        } else {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.body.code), null);
            return;
        }
    }
});


/*
    Name : Logout Delete Account
    Purpose : Logout Delete Account
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.get('/logout-delete-account', async(req, res) => {
    try {
        if (!req.query.code || !req.query.user_id || !req.query.action || !req.query.user_type) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }
        let response = await authHandler.logoutDeleteAccount(req.query);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.query.code), null);
            return;
        }
    }
});

/*
    Name : Get Profile
    Purpose : Get Profile
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.get('/get-profile', async(req, res) => {
    try {
        if (!req.query.code || !req.query.user_type || !req.query.user_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }
        let response;
        if(req.query.user_type == 'customer'){
            response = await authHandler.profileCustomer({customer_id:req.query.user_id}, req.query.code);
        }
        else{
            response = await authHandler.profileDriver({driver_id:req.query.user_id}, req.query.code);
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.query.code), null);
            return;
        }
    }
});

/*
    Name : Update Profile
    Purpose : Update Profile
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.post('/update-profile', async(req, res) => {
    try {
        if (!req.body.code || !req.body.user_type || !req.body.user_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response;
        if(req.body.user_type == 'customer'){
            req.body.customer_id = req.body.user_id
            response = await authHandler.updateProfileCustomer(req.body, req);
        }
        else{
            req.body.driver_id = req.body.user_id
            response = await authHandler.updateProfileDriver(req.body, req);
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.body.code), null);
            return;
        }
    }
});

/*
    Name : Account Setup
    Purpose : Account Setup
    Original Author : Gaurav Patel
    Created At : 27th Nov 2020
*/
router.post('/account-setup', async(req, res) => {
    try {
        if (!req.body.code || !req.body.user_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        req.body.driver_id = req.body.user_id
        let response = await authHandler.accountSetup(req.body, req);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.body.code), null);
            return;
        }
    }
});

/*
    Name : Update Player ID
    Purpose : Update Player ID
    Original Author : Gaurav Patel
    Created At : 17th Dec 2020
*/
router.post('/update-player-id', async(req, res) => {
    try {
        if (!req.body.code || !req.body.user_id || !req.body.user_type || !req.body.player_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await authHandler.updatePlayerId(req.body);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, req.body.code), null);
            return;
        }
    }
});

module.exports = router;