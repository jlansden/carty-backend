'use strict';

const responseCodes =  require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const express = require('express');
const router = express.Router();
const _ = require('underscore');
const makeHandler = require('./../../model_handlers/backend/make-handler');

router.post('/create', function (req, res) {
	makeHandler.create(req.body,function (error, response) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), response);
	});
});

router.get('/get',function (req, res) {
	makeHandler.get(req,function (error, response) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), response);
	});
});

router.post('/action', function (req, res) {
  makeHandler.action(req.body,function (error, response) {
    if (error) {
      jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
      return;
    }
    jsonResponse(res, responseCodes.OK, errors.noError(), response);
  });
});

router.post('/update', function (req, res) {
	makeHandler.update(req.body,function (error, response) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), response);
	});
});

router.post('/import', function (req, res) {
	makeHandler.importFile(req,function (error, response) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), response);
	});
});

router.get('/export', function (req, res) {
	makeHandler.exportFile(req,function (error, response) {
		if (error) {
			jsonResponse(res, error.code, errors.formatErrorForWire(error), null);
			return;
		}
		jsonResponse(res, responseCodes.OK, errors.noError(), response);
	});
});


module.exports = router;