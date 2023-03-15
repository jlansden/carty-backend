'use strict';

const responseCodes =  require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const labelHandler = require('./../../model_handlers/backend/language-label-handler');

/*
    Name : create-language-label
    Purpose : Create Language from database
    Original Author : Gaurav Patel
    Created At : 7th sep 2020
*/
router.post('/create', function (req, res) {
	labelHandler.create(req.body,function (error, label) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), label);
	});
});


/*
    Name : get-language-label
    Purpose : Gat language-label from database
    Original Author : Gaurav Patel
    Created At : 7th sep 2020
*/
router.get('/get', function (req, res) {
	labelHandler.get(req,function (error, labels) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), labels);
	});
});


/*
    Name : action
    Purpose : action
    Original Author : Gaurav Patel
    Created At : 7th sep 2020
*/
router.post('/action', function (req, res) {
  	labelHandler.action(req.body,function (error, labels) {
	    if (error) {
	      jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
	      return;
	    }
	    jsonResponse(res, responseCodes.OK, errors.noError(), labels);
  	});
});


/*
    Name : update-language-label
    Purpose : Update Language in database
    Original Author : Gaurav Patel
    Created At : 7th sep 2020
*/
router.post('/update', function (req, res) {
	labelHandler.update(req.body,function (error, labels) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), labels);
	});
});

router.post('/import', function (req, res) {
	labelHandler.importLbl(req,function (error, labels) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), labels);
	});
});

module.exports = router;