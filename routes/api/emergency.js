'use strict';

let _ = require('underscore');
const express = require('express');
const config = require('./../../config');
const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors-api');
const router = express.Router();
const emergencyHandler = require('./../../model_handlers/api/emergency-handler');

/*
    Name : List
    Purpose : List
    Original Author : Gaurav Patel
    Created At : 11th Dec 2020
*/
router.get('/list', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.customer_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }

        let response = await emergencyHandler.list(req.query);
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
    Name : Add
    Purpose : Add
    Original Author : Gaurav Patel
    Created At : 11th Dec 2020
*/
router.post('/add', async(req, res) => {
    try {
        if (!req.body.code || !req.body.customer_id || !req.body.name || !req.body.mobile_country_code || !req.body.mobile) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }

        let response = await emergencyHandler.add(req.body, req);
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
    Name : edit
    Purpose : edit
    Original Author : Gaurav Patel
    Created At : 31st Mar 2021
*/
router.post('/edit', async(req, res) => {
    try {
        if (!req.body.code || !req.body.contact_id || !req.body.customer_id || !req.body.name || !req.body.mobile_country_code || !req.body.mobile) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }

        let response = await emergencyHandler.edit(req.body, req);
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
    Name : delete
    Purpose : delete
    Original Author : Gaurav Patel
    Created At : 31st Mar 2021
*/
router.post('/delete', async(req, res) => {
    try {
        if (!req.body.code || !req.body.customer_id || !req.body.contact_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }

        let response = await emergencyHandler.deleteContact(req.body);
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