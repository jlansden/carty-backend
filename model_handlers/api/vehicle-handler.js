'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const { generateRandom } = require('./../../utils/id-generator');
const label = require('./../../models/language-label');
const moment = require('moment');
let async = require('async');
let _ = require('underscore');
const distance = require('google-distance');
distance.apiKey = config.google_key;

/*
	Name : List
	Purpose : List
	Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const list = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, {_id:0, default_currency:1},{});
            let response = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            distance.get(
            {
                index: 1,
                origin: ''+requestParam.start_latitude+','+requestParam.start_longitude+'',
                destination: ''+requestParam.finish_latitude+','+requestParam.finish_longitude+''
            },
            async function(err, data) {
                if (err){
                    reject(errors.googleDistanceNotFound(true, requestParam.code));
                    return;
                }
                let joinArr = [{
                    $lookup: {
                        from: 'prices',
                        localField: 'vehicle_id',
                        foreignField: 'vehicle_id',
                        as: 'priceDetails'
                    }
                }, {
                    $unwind: "$priceDetails"
                }, {
                    $match: {status: 'active'}
                }, {
                    $sort: {
                        order_no: 1
                    }
                }, {
                    $project: {
                        _id: 0,
                        vehicle_id: "$vehicle_id",
                        title: "$title."+requestParam.code,
                        description: "$description."+requestParam.code,
                        capacity: "$capacity",
                        select_icon: "$select_icon",
                        unselect_icon: "$unselect_icon",
                        price_id: "$priceDetails.price_id",
                        base_fare: "$priceDetails.base_fare",
                        cancellation_fare: "$priceDetails.cancellation_fare",
                        booking_fare: "$priceDetails.booking_fare",
                        per_mile_fare: "$priceDetails.per_mile_fare",
                        per_min_fare: "$priceDetails.per_min_fare",
                        max_fare: "$priceDetails.max_fare",
                        min_fare: "$priceDetails.min_fare",
                        total_distance: "",
                        total_duration: "",
                        formatted_distance: "",
                        formatted_duration: "",
                        total_fare: "",
                        default_currency: "",
                    }
                }];
                let total_mile = (data.distanceValue/1000) / 1.6
                let vehicles = await query.joinWithAnd(dbConstants.dbSchema.vehicles, joinArr);
                let newArr = []
                _.each(vehicles, (elem) => {
                    if(elem.select_icon!=''){
                        elem.select_icon = config.aws.prefix + config.aws.s3.vehicleBucket + '/' + elem.select_icon;
                    }
                    if(elem.unselect_icon!=''){
                        elem.unselect_icon = config.aws.prefix + config.aws.s3.vehicleBucket + '/' + elem.unselect_icon;
                    }
                    elem.total_fare = parseFloat(elem.base_fare + elem.booking_fare + (total_mile * elem.per_mile_fare) + ((data.durationValue/60) * elem.per_min_fare)).toFixed(2)
                    if(parseFloat(elem.total_fare) < parseFloat(elem.min_fare)){
                        elem.total_fare = elem.min_fare
                    }
                    else if(parseFloat(elem.total_fare) > parseFloat(elem.max_fare)){
                        elem.total_fare = elem.max_fare
                    }
                    else{
                        elem.total_fare = parseFloat(elem.total_fare)
                    }
                    newArr.push({
                        vehicle_id: elem.vehicle_id,
                        title: elem.title,
                        description: elem.description,
                        capacity: elem.capacity,
                        select_icon: elem.select_icon,
                        unselect_icon: elem.unselect_icon,
                        total_distance: data.distanceValue,
                        total_duration: data.durationValue,
                        formatted_distance: ((data.distanceValue/1000) / 1.6).toFixed(2)+' mi',
                        formatted_duration: data.duration,
                        total_fare:elem.total_fare,
                        default_currency: settings.default_currency,
                        fare_info:{
                            base_fare: elem.base_fare,
                            cancellation_fare: elem.cancellation_fare,
                            distance_fare: total_mile * elem.per_mile_fare,
                            duration_fare: (data.durationValue/60) * elem.per_min_fare
                        }
                    })
                })
                resolve(newArr) 
                return;
            });
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : List
    Purpose : List
    Original Author : Gaurav Patel
    Created At : 27th Nov 2020
*/
const listDriver = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndSort(dbConstants.dbSchema.vehicles, {status:'active'}, { _id: 0, vehicle_id: 1, title:1}, {order_no: 1} );
            _.each(response, (elem) => {
                elem.title = elem.title[requestParam.code]
            });
            resolve(response);
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

module.exports = {
    list,
    listDriver
};