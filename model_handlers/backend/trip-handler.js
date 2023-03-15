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
const timeZone = require('moment-timezone');

const get = function(req, done) {
    req.query.time_zone = config.time_zone
    if(req.headers.time_zone){
        req.query.time_zone = req.headers.time_zone
    }
    let columnAndValue = {
        status: req.query.status
    };
    if(req.query.customer_id){
        columnAndValue.customer_id = req.query.customer_id
    }
    if(req.query.driver_id){
        columnAndValue.driver_id = req.query.driver_id
    }
    if(req.query.type){
        if(req.query.type == 'dashboard'){
            let date = timeZone(new Date()).tz(req.query.time_zone).format('YYYY-MM-DD')
            columnAndValue.created_at = {
                $lte: new Date(date+'T23:59:59.000Z'),
                $gte: new Date(date+'T00:00:00.000Z')
            }
            delete columnAndValue.status
        }
    }
    if(req.query.status == 'settlement'){
        columnAndValue.status = 'completed';
        //columnAndValue.is_driver_paid = false;
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
            start_address: "$start_address",
            finish_address: "$finish_address",
            total: "$total",
            created_at: "$created_at",
            status: "$status",
            company_earn: "$company_earn",
            driver_earn: "$driver_earn",
            company_percentage: "$company_percentage",
            is_driver_paid: "$is_driver_paid",
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
            element.total = (element.total).toFixed(2)
            element.company_earn = (element.company_earn).toFixed(2)
            element.driver_earn = parseFloat((element.driver_earn).toFixed(2))
            element.created_at = timeZone(new Date(element.created_at)).tz(req.query.time_zone).format('lll')
        });
        done(null, response)
    });
};

const details = function(req, done) {
    req.query.time_zone = config.time_zone
    if(req.headers.time_zone){
        req.query.time_zone = req.headers.time_zone
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
        $match: {trip_id: req.query.trip_id}
    }, {
        $sort: {
            created_at: -1
        }
    }, {
        $project: {
            _id: 0,
            trip_id: "$trip_id",
            vehicle_id: "$vehicle_id",
            customer: "$cusDetails",
            customer_name: "$cusDetails.name",
            customer_email: "$cusDetails.email",
            customer_mobile_country_code: "$cusDetails.mobile_country_code",
            customer_mobile: "$cusDetails.mobile",
            created_at: "$created_at",
            driver: "$driDetails",
            driver_name: "$driDetails.name",
            driver_email: "$driDetails.email",
            driver_mobile_country_code: "$driDetails.mobile_country_code",
            driver_mobile: "$driDetails.mobile",
            vehicleDetails: "$driDetails.vehicles",
            vehicle_number: "",
            vehicle_model: "",
            vehicle:"$vehDetails",
            vehicle_name:"$vehDetails.title.EN",
            total: "$total",
            start_address: "$start_address",
            finish_address: "$finish_address",
            formatted_distance: "$formatted_distance",
            formatted_duration: "$formatted_duration",
        }
    }];
    query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, async (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        if(response.length == 0){
            done(null, {total:0})
        }
        else{
            response = response[0];
            response.created_at = timeZone(new Date(response.created_at)).tz(req.query.time_zone).format('lll')
            let vehicle = _.where(response.vehicleDetails, {vehicle_id: response.vehicle_id});
            response.vehicle_number = vehicle.length > 0 ? vehicle[0].vehicle_number : ''
            response.vehicle_model = vehicle.length > 0 ? vehicle[0].model : ''
            if(!response.customer){
                response.customer_name = ''
                response.customer_mobile = ''
                response.customer_mobile_country_code = ''
                response.customer_email = ''
            }
            if(!response.driver){
                response.driver_name = ''
                response.driver_mobile = ''
                response.driver_mobile_country_code = ''
                response.driver_email = ''
            }
            if(!response.vehicle){
                response.vehicle_name = ''
            }
            delete response.customer
            delete response.driver
            delete response.vehicle
            delete response.vehicleDetails
            done(null, response);
            return
        }
    });
};

const settlement = (requestParam, done) => {
    query.updateMultiple(dbConstants.dbSchema.trips, { is_driver_paid: true }, {
        'trip_id': {
            $in: requestParam.trips
        }
    }, function(error, data) {
        if (error) {
            logger('Error: can not update ');
            done(error, null);
            return;
        }
        done(null, data);
    });
}; 

const getDispute = (req, done) => {
    req.query.time_zone = config.time_zone
    if(req.headers.time_zone){
        req.query.time_zone = req.headers.time_zone
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
            as: 'driverDetails'
        }
    }, {
        "$unwind": {
            "path": "$driverDetails",
            "preserveNullAndEmptyArrays": true
        }
    }, {
        $match: {dispute_msg:{$ne:''}}
    }, {
        $sort: {
            created_at: -1
        }
    }, {
        $project: {
            _id: 0,
            trip_id: "$trip_id",
            customer: "$cusDetails",
            driver: "$driverDetails",
            dispute_msg: "$dispute_msg",
            dispute_status: "$dispute_status",
            created_at: "$created_at",
        }
    }];
    query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        _.each(response, (element) => {
            if(!element.dispute_status){
                element.dispute_status = 'pending'
            }
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
            element.created_at = timeZone(new Date(element.created_at)).tz(req.query.time_zone).format('lll');
        });
        done(null, response)
    });
};

const disputeAction = (requestParam, done) => {
    query.updateMultiple(dbConstants.dbSchema.trips, {dispute_status:'resolved'}, {
        'trip_id': {
            $in: requestParam['ids']
        }
    }, function(error, data) {
        if (error) {
            logger('Error: can not update ');
            done(error, null);
            return;
        }
        done(null, data);
    });
};

const lostItemAction = (requestParam, done) => {
    query.updateMultiple(dbConstants.dbSchema.lost_items, {status:'resolved'}, {
        'trip_id': {
            $in: requestParam['ids']
        }
    }, function(error, data) {
        if (error) {
            logger('Error: can not update ');
            done(error, null);
            return;
        }
        done(null, data);
    });
};

const getLostItem = (req, done) => {
    req.query.time_zone = config.time_zone
    if(req.headers.time_zone){
        req.query.time_zone = req.headers.time_zone
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
            as: 'driverDetails'
        }
    }, {
        "$unwind": {
            "path": "$driverDetails",
            "preserveNullAndEmptyArrays": true
        }
    }, {
        $match: {}
    }, {
        $sort: {
            created_at: -1
        }
    }, {
        $project: {
            _id: 0,
            trip_id: "$trip_id",
            customer: "$cusDetails",
            driver: "$driverDetails",
            msg: "$msg",
            status: "$status",
            created_at: "$created_at",
        }
    }];
    query.joinWithAnd(dbConstants.dbSchema.lost_items, joinArr, (error, response) => {
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
            element.created_at = timeZone(new Date(element.created_at)).tz(req.query.time_zone).format('lll');
        });
        done(null, response)
    });
};

module.exports = {
    get,
    details,
    settlement,
    getDispute,
    disputeAction,
    getLostItem,
    lostItemAction
};