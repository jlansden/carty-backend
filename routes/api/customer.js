'use strict';

let _ = require('underscore');
const express = require('express');
const config = require('./../../config');
const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors-api');
const router = express.Router();
const customerHandler = require('./../../model_handlers/api/customer-handler');

/*
    Name : Add Address
    Purpose : Add Address
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.post('/address', async(req, res) => {
    try {
        if (!req.body.code || !req.body.customer_id || !req.body.action) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        if(req.body.action=='add' || req.body.action=='edit'){
            if(!req.body.address || !req.body.address_type || !req.body.latitude || !req.body.longitude){
                jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
                return;
            }
        }
        if(req.body.action=='edit' || req.body.action=='delete'){
            if (!req.body.address_id) {
                jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
                return;
            }
        }
        let response = await customerHandler.address(req.body);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
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
    Name : rate Trip
    Purpose : rate Trip
    Original Author : Gaurav Patel
    Created At : 10th Dec 2020
*/
router.get('/rate-the-trip', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.page || !req.query.customer_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }
        req.query.time_zone = config.time_zone
        if(req.headers.time_zone){
            req.query.time_zone = req.headers.time_zone
        }
        let response = await customerHandler.rateTheTrip(req.query);
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
    Name : cancel trip
    Purpose : cancel trip
    Original Author : Gaurav Patel
    Created At : 13th Jan 2021
*/
router.post('/cancel-trip', async(req, res) => {
    try {
        if (!req.body.code || !req.body.trip_id || !req.body.customer_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await customerHandler.cancelTrip(req.body);
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
    Name : Sync Contact
    Purpose : Sync Contact
    Original Author : Gaurav Patel
    Created At : 28th Jan 2021
*/
router.post('/sync-contact', async(req, res) => {
    try {
        if (req.body.code && req.body.customer_id && req.body.contacts) {
            let response = await customerHandler.syncContact(req.body);
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
    Name : Share Trip
    Purpose : Share Trip
    Original Author : Gaurav Patel
    Created At : 28th Jan 2021
*/
router.post('/share-trip', async(req, res) => {
    try {
        if (req.body.code && req.body.customer_id && req.body.share_ids && req.body.trip_id) {
            let response = await customerHandler.shareTrip(req.body);
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
    Name : get Share Trip
    Purpose : get Share Trip
    Original Author : Gaurav Patel
    Created At : 28th Jan 2021
*/
router.get('/get-shared-trip', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.customer_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }
        let response = await customerHandler.getSharedTrip(req.query);
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

module.exports = router;