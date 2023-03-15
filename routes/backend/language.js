'use strict';

const responseCodes =  require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const languageHandler = require('./../../model_handlers/backend/language-handler');

/*
    Name : create-language
    Purpose : Create Language from database
    Original Author : Gaurav Patel
    Created At : 7th Sep 2020
*/
router.post('/create', function (req, res) {
	if (!_.has(req.body, 'title') || !_.has(req.body, 'code')) {
		logger('Parameter Missing : can not create language');
		jsonResponse(res, responseCodes.BadRequest, errors.missingParameter(true), null);
		return;
	}
	languageHandler.create(req.body,function (error, language) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), language);
	});
});


/*
    Name : get-language
    Purpose : Gat Language from database
    Original Author : Gaurav Patel
    Created At : 7th Sep 2020
*/
router.get('/get',function (req, res) {
	languageHandler.get(req,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


/*
    Name : change language's status and delete
    Purpose : Update all the languages (change status like active, inactive and delete record from database)
    Original Author : Gaurav Patel
    Created At : 7th Sep 2020
*/
router.post('/action', function (req, res) {
  languageHandler.action(req.body,function (error, languages) {
    if (error) {
      jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
      return;
    }
    jsonResponse(res, responseCodes.OK, errors.noError(), languages);
  });
});


/*
    Name : update-language
    Purpose : Update Language in database
    Original Author : Gaurav Patel
    Created At : 7th Sep 2020
*/
router.post('/update', function (req, res) {
	languageHandler.update(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


module.exports = router;