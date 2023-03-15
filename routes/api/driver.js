'use strict';

let _ = require('underscore');
const express = require('express');
const config = require('./../../config');
const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors-api');
const router = express.Router();
const driverHandler = require('./../../model_handlers/api/driver-handler');

/*
    Name : Vehicle Management
    Purpose : Vehicle Management
    Original Author : Gaurav Patel
    Created At : 27th Nov 2020
*/
router.post('/vehicle-management', async(req, res) => {
    try {
        if (!req.body.code || !req.body.driver_id || !req.body.action) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        if(req.body.action=='add'){
            if(!req.body.vehicle_id || !req.body.model_id || !req.body.make_id || !req.body.year || !req.files.front_photo || !req.files.rear_photo || !req.files.left_photo || !req.files.right_photo){
                jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
                return;
            }
        }
        if(req.body.action == 'delete' || req.body.action == 'set_default'){
            if(!req.body.vehicle_id){
                jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
                return;
            }
        }
        let response = await driverHandler.vehicleManagement(req.body, req);
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
    Name : Driver Details
    Purpose : Driver Details
    Original Author : Gaurav Patel
    Created At : 9th Dec 2020
*/
router.get('/details', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.driver_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }
        req.query.time_zone = config.time_zone
        if(req.headers.time_zone){
            req.query.time_zone = req.headers.time_zone
        }
        let response = await driverHandler.details(req.query);
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
    Name : Finance Details
    Purpose : Finance Details
    Original Author : Gaurav Patel
    Created At : 10th Dec 2020
*/
router.get('/finance', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.driver_id || !req.query.start_date || !req.query.end_date) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }
        let response = await driverHandler.finance(req.query);
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
    Name : Online Offline
    Purpose : Online Offline
    Original Author : Gaurav Patel
    Created At : 18th Dec 2020
*/
router.post('/online-offline', async(req, res) => {
    try {
        if (!req.body.code || !req.body.driver_id || !req.body.action) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await driverHandler.onlineOffline(req.body);
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

module.exports = router;