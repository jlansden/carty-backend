'use strict';

const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const dashboardHandler = require('./../../model_handlers/backend/dashboard-handler');

router.get('/statistics', function(req, res) {
    dashboardHandler.statistics(req, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

router.get('/earnings', function(req, res) {
    dashboardHandler.earnings(req, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

router.get('/sales', function(req, res) {
    dashboardHandler.sales(req, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

router.get('/users-by-os', function(req, res) {
    dashboardHandler.usersByOs(req, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

router.get('/earn-by-vehicle', function(req, res) {
    dashboardHandler.earnByVehicle(req, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});


module.exports = router;