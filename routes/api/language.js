'use strict';

const config = require('./../../config');
const responseCodes = require('./../../helpers/response-codes');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors-api');
const express = require('express');
const router = express.Router();
const languageHandler = require('./../../model_handlers/api/language-handler');

/*
	Name : List
	Purpose : List
	Original Author : Gaurav Patel
	Created At : 26th Nov 2020
*/
router.get('/list', async(req, res) => {
    try {
        let response = await languageHandler.list();
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        try {
            jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
            return;
        } catch (error) {
            jsonResponse(res, responseCodes.InternalServer, errors.internalServer(true, config.default_language), null);
            return;
        }
    }
});

module.exports = router;