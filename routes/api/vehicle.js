'use strict';

let _ = require('underscore');
const express = require('express');
const config = require('./../../config');
const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors-api');
const router = express.Router();
const vehicleHandler = require('./../../model_handlers/api/vehicle-handler');

/*
    Name : List
    Purpose : List
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.get('/list', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.customer_id || !req.query.start_address || !req.query.finish_address || !req.query.start_latitude || !req.query.start_longitude || !req.query.finish_latitude || !req.query.finish_longitude) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }

        let response = await vehicleHandler.list(req.query);
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
    Name : List
    Purpose : List
    Original Author : Gaurav Patel
    Created At : 27th Nov 2020
*/
router.get('/list-driver', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }

        let response = await vehicleHandler.listDriver(req.query);
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

module.exports = router;