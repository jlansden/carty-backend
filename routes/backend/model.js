'use strict';

const responseCodes =  require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const modelHandler = require('./../../model_handlers/backend/model-handler');

router.post('/create', function (req, res) {
	modelHandler.create(req.body,function (error, response) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), response);
	});
});

router.get('/get',function (req, res) {
	modelHandler.get(req,function (error, response) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), response);
	});
});

router.post('/action', function (req, res) {
  modelHandler.action(req.body,function (error, response) {
    if (error) {
      jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
      return;
    }
    jsonResponse(res, responseCodes.OK, errors.noError(), response);
  });
});

router.post('/update', function (req, res) {
	modelHandler.update(req.body,function (error, response) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), response);
	});
});


module.exports = router;