'use strict';

const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const stateHandler = require('./../../model_handlers/backend/state-handler');


router.post('/create', function(req, res) {
    stateHandler.create(req.body, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});


router.get('/get', function(req, res) {
    stateHandler.get(req, function(error, responses) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), responses);
    });
});


router.post('/action', function(req, res) {
    stateHandler.action(req.body, function(error, responses) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), responses);
    });
});


router.post('/update', function(req, res) {
    stateHandler.update(req.body, function(error, responses) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), responses);
    });
});


module.exports = router;