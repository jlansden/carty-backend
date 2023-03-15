'use strict';

let _ = require('underscore');
const express = require('express');
const config = require('./../../config');
const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors-api');
const router = express.Router();
const notiHandler = require('./../../model_handlers/api/notification-handler');

/*
    Name : List
    Purpose : List
    Original Author : Gaurav Patel
    Created At : 4th Dec 2020
*/
router.get('/list', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.user_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }
        req.query.time_zone = config.time_zone
        if(req.headers.time_zone){
            req.query.time_zone = req.headers.time_zone
        }

        let response = await notiHandler.list(req.query);
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
    Name : Delete
    Purpose : Delete
    Original Author : Gaurav Patel
    Created At : 4th Dec 2020
*/
router.get('/delete', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.user_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }

        let response = await notiHandler.deleteNoti(req.query);
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