'use strict';

const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const cityHandler = require('./../../model_handlers/backend/city-handler');


router.post('/create', function(req, res) {
    cityHandler.create(req.body, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});


router.get('/get', function(req, res) {
    cityHandler.get(req, function(error, responses) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), responses);
    });
});


router.post('/action', function(req, res) {
    cityHandler.action(req.body, function(error, responses) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), responses);
    });
});


router.post('/update', function(req, res) {
    cityHandler.update(req.body, function(error, responses) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), responses);
    });
});


module.exports = router;