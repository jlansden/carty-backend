'use strict';

let _ = require('underscore');
const express = require('express');
const config = require('./../../config');
const responseCodes = require('./../../helpers/response-codes');
const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors-api');
const router = express.Router();
const tripHandler = require('./../../model_handlers/api/trip-handler');

/*
    Name : Book Trip
    Purpose : Book Trip
    Original Author : Gaurav Patel
    Created At : 1st Dec 2020
*/
router.post('/book', async(req, res) => {
    try {
        if (!req.body.code || !req.body.customer_id || !req.body.card_id || !req.body.vehicle_id || !req.body.start_address || !req.body.finish_address || !req.body.start_latitude || !req.body.start_longitude || !req.body.finish_latitude || !req.body.finish_longitude) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        if (!req.body.fare_info || !req.body.total_distance || !req.body.total_duration || !req.body.formatted_distance || !req.body.formatted_duration || !req.body.preferences || !req.body.total) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await tripHandler.book(req.body);
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
    Name : Ongoing Trip
    Purpose : Ongoing Trip
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
router.get('/ongoing', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.user_type || !req.query.user_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }
        let response = await tripHandler.ongoing(req.query);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
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
    Name : Trip Action
    Purpose : Trip Action
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
router.post('/action', async(req, res) => {
    try {
        if (!req.body.code || !req.body.driver_id || !req.body.action || !req.body.trip_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await tripHandler.action(req.body);
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
    Name : Cancel Trip
    Purpose : Cancel Trip
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
router.post('/cancel', async(req, res) => {
    try {
        if (!req.body.code || !req.body.customer_id || !req.body.trip_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await tripHandler.cancel(req.body);
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
    Name : receipt Trip
    Purpose : receipt Trip
    Original Author : Gaurav Patel
    Created At : 4nd Dec 2020
*/
router.get('/receipt', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.trip_id) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }
        req.query.time_zone = config.time_zone
        if(req.headers.time_zone){
            req.query.time_zone = req.headers.time_zone
        }
        let response = await tripHandler.receipt(req.query);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
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
    Name : Rating Trip
    Purpose : Rating Trip
    Original Author : Gaurav Patel
    Created At : 4nd Dec 2020
*/
router.post('/rating', async(req, res) => {
    try {
        if (!req.body.code || !req.body.user_type || !req.body.user_id || !req.body.trip_id || !req.body.rating) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await tripHandler.rating(req.body);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
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
    Name : history Trip
    Purpose : history Trip
    Original Author : Gaurav Patel
    Created At : 9th Dec 2020
*/
router.get('/history', async(req, res) => {
    try {
        if (_.isEmpty(req.query) || !req.query.code || !req.query.page || !req.query.user_type || !req.query.user_id || !req.query.status) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.query.code), null);
            return;
        }
        req.query.time_zone = config.time_zone
        if(req.headers.time_zone){
            req.query.time_zone = req.headers.time_zone
        }
        let response = await tripHandler.history(req.query);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
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
    Name : dispute Trip
    Purpose : dispute Trip
    Original Author : Gaurav Patel
    Created At : 9th Dec 2020
*/
router.post('/dispute', async(req, res) => {
    try {
        if (!req.body.code || !req.body.customer_id || !req.body.trip_id || !req.body.dispute_msg) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await tripHandler.dispute(req.body);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
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
    Name : Lost Item
    Purpose : Lost Item
    Original Author : Gaurav Patel
    Created At : 3rd Feb 2020
*/
router.post('/lost-item', async(req, res) => {
    try {
        if (!req.body.code || !req.body.customer_id || !req.body.trip_id || !req.body.msg) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await tripHandler.lostItem(req.body);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
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
    Name : Toll Charge
    Purpose : Toll Charge
    Original Author : Gaurav Patel
    Created At : 3rd Feb 2020
*/
router.post('/toll-charge', async(req, res) => {
    try {
        if (!req.body.code || !req.body.driver_id || !req.body.trip_id || !req.body.toll_charge) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await tripHandler.tollCharge(req.body);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
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
    Name : Cleaning Charge
    Purpose : Cleaning Charge
    Original Author : Gaurav Patel
    Created At : 15th Feb 2020
*/
router.post('/cleaning-charge', async(req, res) => {
    try {
        if (!req.body.code || !req.body.driver_id || !req.body.trip_id || !req.body.cleaning_charge) {
            jsonResponse(res, responseCodes.BadRequest, errors.missingParameters(true, req.body.code), null);
            return;
        }
        let response = await tripHandler.cleaningCharge(req.body);
        jsonResponse(res, responseCodes.OK, errors.noError(), response);
    } catch (error) {
        console.log(error)
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