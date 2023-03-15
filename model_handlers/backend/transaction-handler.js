'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');

const get = function(req, done) {
    let columnAndValue = {};
    let joinArr = [{
        $lookup: {
            from: 'customers',
            localField: 'customer_id',
            foreignField: 'customer_id',
            as: 'cusDetails'
        }
    }, {
        "$unwind": {
            "path": "$cusDetails",
            "preserveNullAndEmptyArrays": true
        }
    }, {
        $lookup: {
            from: 'drivers',
            localField: 'driver_id',
            foreignField: 'driver_id',
            as: 'driverDetails'
        }
    }, {
        "$unwind": {
            "path": "$driverDetails",
            "preserveNullAndEmptyArrays": true
        }
    }, {
        $match: columnAndValue
    }, {
        $sort: {
            created_at: -1
        }
    }, {
        $project: {
            _id: 0,
            transaction_id: "$transaction_id",
            payment_transaction_id: "$payment_transaction_id",
            trip_id: "$trip_id",
            customer: "$cusDetails.name",
            driver: "$driverDetails",
            charge: "$charge",
            payment_type: "$payment_type",
        }
    }];
    query.joinWithAnd(dbConstants.dbSchema.transactions, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        _.each(response, (element) => {
            if(element.driver){
                element.driver = element.driver.name
            }
            else{
                element.driver = ''
            }
        });
        done(null, response)
    });
};

const action = (requestParam, done) => {
    if (requestParam['type'] == "delete") {
        query.removeMultiple(dbConstants.dbSchema.transactions, {
            'transaction_id': {
                $in: requestParam['ids']
            }
        }, function(error, data) {
            if (error) {
                logger('Error: can not delete ');
                done(error, null);
                return;
            }
            done(null, data);
        });
    } else {
        done(null, data);
    }
};


module.exports = {
    get,
    action
};