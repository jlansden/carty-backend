'use strict';

let _ = require('underscore');
const express = require('express');
const config = require('./../../config');
const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors-api');
const router = express.Router();
const stateHandler = require('./../../model_handlers/api/state-handler');

/*
    Name : List
    Purpose : List
    Original Author : Gaurav Patel
    Created At : 1st march 2021
*/
router.get('/list', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }

        let response = await stateHandler.list(req.query);
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