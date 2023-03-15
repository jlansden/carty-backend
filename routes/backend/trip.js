'use strict';

const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const tripHandler = require('./../../model_handlers/backend/trip-handler');

router.get('/get', function(req, res) {
    tripHandler.get(req, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

router.get('/get-dispute', function(req, res) {
    tripHandler.getDispute(req, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

router.get('/get-lost-item', function(req, res) {
    tripHandler.getLostItem(req, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

router.get('/details', function(req, res) {
    tripHandler.details(req, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

router.post('/settlement', function(req, res) {
    tripHandler.settlement(req.body, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

router.post('/dispute-action', function(req, res) {
    tripHandler.disputeAction(req.body, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

router.post('/lost-item-action', function(req, res) {
    tripHandler.lostItemAction(req.body, function(error, response) {
        if (error) {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        }
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    });
});

module.exports = router;