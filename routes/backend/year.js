'use strict';

const responseCodes =  require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const yearHandler = require('./../../model_handlers/backend/year-handler');

router.post('/create', function (req, res) {
	yearHandler.create(req.body,function (error, language) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), language);
	});
});

router.get('/get',function (req, res) {
	yearHandler.get(req,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});

router.post('/action', function (req, res) {
  yearHandler.action(req.body,function (error, languages) {
    if (error) {
      jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
      return;
    }
    jsonResponse(res, responseCodes.OK, errors.noError(), languages);
  });
});

router.post('/update', function (req, res) {
	yearHandler.update(req.body,function (error, languages) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), languages);
	});
});


module.exports = router;