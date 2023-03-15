'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
const queryApi = require('./../../utils/query-creator-api');
const config = require('./../../config');
let async = require('async');
let moment = require('moment');
let _ = require('underscore');
const LD = require('lodash');
const timeZone = require('moment-timezone');


const earn = function(req, done) {
    req.query.time_zone = config.time_zone
    if(req.headers.time_zone){
        req.query.time_zone = req.headers.time_zone
    }
    let columnAndValue = {
        status: 'completed'
    };
    if(req.query.start_date && req.query.end_date){
        req.query.start_date = moment(new Date(req.query.start_date)).format('YYYY-MM-DD')
        req.query.end_date = moment(new Date(req.query.end_date)).format('YYYY-MM-DD')
        columnAndValue.created_at = {
            $lte: new Date(req.query.end_date+'T23:59:59.000Z'),
            $gte: new Date(req.query.start_date+'T00:00:00.000Z')
        }
    }
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
            as: 'driDetails'
        }
    }, {
        "$unwind": {
            "path": "$driDetails",
            "preserveNullAndEmptyArrays": true
        }
    }, {
        $lookup: {
            from: 'vehicles',
            localField: 'vehicle_id',
            foreignField: 'vehicle_id',
            as: 'vehDetails'
        }
    }, {
        "$unwind": {
            "path": "$vehDetails",
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
            trip_id: "$trip_id",
            customer: "$cusDetails",
            driver: "$driDetails",
            vehicle: "$vehDetails",
            company_earn: "$company_earn",
            created_at: "$created_at",
            status: "$status",
        }
    }];
    query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        _.each(response, (element) => {
            if(element.customer){
                element.customer = element.customer.name
            }
            else{
                element.customer = ''
            }
            if(element.driver){
                element.driver = element.driver.name
            }
            else{
                element.driver = ''
            }
            if(element.vehicle){
                element.vehicle = element.vehicle.title['EN']
            }
            else{
                element.vehicle = ''
            }
            element.company_earn = element.company_earn ? (element.company_earn).toFixed(2) : 0;
            element.company_earn = parseFloat(element.company_earn)
            element.created_at = timeZone(new Date(element.created_at)).tz(req.query.time_zone).format('lll')
        });
        let total_earn = LD.sumBy(response, 'company_earn');
        total_earn = parseFloat(parseFloat(total_earn).toFixed(2))
        done(null, {trips:response, total_earn:total_earn})
    });
};


module.exports = {
    earn
};