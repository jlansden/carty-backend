'use strict';

const config = require('./../../config');
const responseCodes = require('./../../helpers/response-codes');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors-api');
const labels = require('./../../utils/labels.json');
const express = require('express');
const router = express.Router();
const cardHandler = require('./../../model_handlers/api/card-handler');
const _ = require('underscore');


/*
	Name : List
	Purpose : List
	Original Author : Gaurav Patel
	Created At : 26th Nov 2020
*/
router.get('/list', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.customer_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }

        let response = await cardHandler.list(req.query);
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
    Created At : 26th Nov 2020
*/
router.post('/add', async(req, res) => {
    try {
        if (!req.body.code || !req.body.customer_id || !req.body.card_name || !req.body.card_number || !req.body.exp_month || !req.body.exp_year || !req.body.cvc) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }

        let response = await cardHandler.add(req.body);
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
    Name : Remove
    Purpose : Remove
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.post('/remove', async(req, res) => {
    try {
        if (!req.body.code || !req.body.customer_id || !req.body.card_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }

        let response = await cardHandler.remove(req.body);
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
    Name : Set default
    Purpose : Set default
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
router.post('/set-default', async(req, res) => {
    try {
        if (!req.body.code || !req.body.customer_id || !req.body.card_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }

        let response = await cardHandler.setDefault(req.body);
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