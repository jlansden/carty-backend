'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const moment = require('moment');
const timeZone = require('moment-timezone');
let async = require('async');
let _ = require('underscore');
let LD = require('lodash');
const commonHandler = require('./../../model_handlers/api/common-handler');
const { forEach } = require('p-iteration');

/*
    Name : Vehicle Management
    Purpose : Vehicle Management
    Original Author : Gaurav Patel
    Created At : 27th Nov 2020
*/
const vehicleManagement = async(requestParam, req) => {
    return new Promise(async(resolve, reject) => {
        try {
            let driver = await query.selectWithAndOne(dbConstants.dbSchema.drivers, { driver_id: requestParam.driver_id }, { _id: 0, vehicles: 1, vehicle_id:1}, { created_at: 1 });
            if(!driver){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            if(requestParam.action=='get'){
                resolve(vehicleFormat(driver.vehicles, driver.vehicle_id, requestParam.code))
                return;
            }
            else if(requestParam.action=='add'){
                let vehicles = driver.vehicles;
                let alreadyExists = 0;
                _.each(vehicles, (element) => {
                    if(element.vehicle_id == requestParam.vehicle_id){
                        alreadyExists++;
                    }
                });
                if(alreadyExists > 0){
                    reject(errors.vehicleAlreadyExists(true, requestParam.code));
                    return;
                }
                if(req.files){
                    // if(req.files.road_tax){
                    //     requestParam.road_tax = await new Promise((solve, reject) => {
                    //         commonHandler.uploadImage(req.files.road_tax, 'driver', (error, path) => {
                    //             solve(path)
                    //         });
                    //     });
                    // }
                    // if(req.files.insurance_covernote){
                    //     requestParam.insurance_covernote = await new Promise((solve, reject) => {
                    //         commonHandler.uploadImage(req.files.insurance_covernote, 'driver', (error, path) => {
                    //             solve(path)
                    //         });
                    //     });
                    // }
                    if(req.files.front_photo){
                        requestParam.front_photo = await new Promise((solve, reject) => {
                            commonHandler.uploadImage(req.files.front_photo, 'driver', (error, path) => {
                                solve(path)
                            });
                        });
                    }
                    if(req.files.rear_photo){
                        requestParam.rear_photo = await new Promise((solve, reject) => {
                            commonHandler.uploadImage(req.files.rear_photo, 'driver', (error, path) => {
                                solve(path)
                            });
                        });
                    }
                    if(req.files.left_photo){
                        requestParam.left_photo = await new Promise((solve, reject) => {
                            commonHandler.uploadImage(req.files.left_photo, 'driver', (error, path) => {
                                solve(path)
                            });
                        });
                    }
                    if(req.files.right_photo){
                        requestParam.right_photo = await new Promise((solve, reject) => {
                            commonHandler.uploadImage(req.files.right_photo, 'driver', (error, path) => {
                                solve(path)
                            });
                        });
                    }
                }
                vehicles.push({
                    vehicle_id:requestParam.vehicle_id,
                    vehicle_number:requestParam.vehicle_number ? requestParam.vehicle_number : '',
                    model:requestParam.model_id,
                    make:requestParam.make_id,
                    year:requestParam.year,
                    //road_tax:requestParam.road_tax,
                    //insurance_covernote:requestParam.insurance_covernote,
                    front_photo:requestParam.front_photo,
                    rear_photo:requestParam.rear_photo,
                    left_photo:requestParam.left_photo,
                    right_photo:requestParam.right_photo,
                    is_verified:false,
                })
                let default_vehicle_id = driver.vehicle_id
                if(vehicles.length == 1){
                    default_vehicle_id = requestParam.vehicle_id
                }
                await query.updateSingle(dbConstants.dbSchema.drivers, { vehicles: vehicles, vehicle_id:default_vehicle_id }, { driver_id: requestParam.driver_id });
                resolve(vehicleFormat(vehicles, default_vehicle_id, requestParam.code))
                return;
            }
            else if(requestParam.action=='delete'){
                let vehicles = [];
                let deleteImg = [];
                _.each(driver.vehicles, (element) => {
                    if(element.vehicle_id != requestParam.vehicle_id){
                        vehicles.push(element)
                    }
                    else{
                        deleteImg = [{
                            Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(element.front_photo)[0]
                        }, {
                            Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(element.rear_photo)[0]
                        }, {
                            Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(element.left_photo)[0]
                        }, {
                            Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(element.right_photo)[0]
                        }];
                    }
                });
                let default_vehicle_id = driver.vehicle_id;
                if(vehicles.length == 0){
                    default_vehicle_id = ''
                }
                commonHandler.removeMultipleImages(deleteImg, async (error, path) => {
                    await query.updateSingle(dbConstants.dbSchema.drivers, { vehicles: vehicles, vehicle_id:default_vehicle_id }, { driver_id: requestParam.driver_id });
                    resolve(vehicleFormat(vehicles, default_vehicle_id, requestParam.code))
                    return;
                })
            }
            else if(requestParam.action=='set_default'){
                let default_vehicle_id = requestParam.vehicle_id
                await query.updateSingle(dbConstants.dbSchema.drivers, { vehicle_id:default_vehicle_id }, { driver_id: requestParam.driver_id });
                resolve(vehicleFormat(driver.vehicles, default_vehicle_id, requestParam.code))
                return;
            }
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

/*
    Name : Vehilce List Format
    Purpose : Vehilce List Format
    Original Author : Gaurav Patel
    Created At : 27th Nov 2020
*/
const vehicleFormat = async(columnAndValues, vehicle_id, code) => {
    return new Promise(async(resolve, reject) => {
        try {
            columnAndValues = JSON.parse(JSON.stringify(columnAndValues))
            await forEach(columnAndValues, async(element) => {
                let make = await query.selectWithAndOne(dbConstants.dbSchema.makes, {make_id: element.make}, { _id: 0, make_id: 1, title:1 } );
                let model = await query.selectWithAndOne(dbConstants.dbSchema.models, {model_id: element.model}, { _id: 0, model_id: 1, title:1 } );
                let vehicle = await query.selectWithAndOne(dbConstants.dbSchema.vehicles, { vehicle_id: element.vehicle_id }, { _id: 0, title: 1, vehicle_id:1}, {});
                element.vehicle_name = vehicle ? vehicle.title[code] : ''
                element.make_name = make ? make.title[code] : ''
                element.model_name = model ? model.title[code] : ''
                //element.road_tax = config.aws.prefix + config.aws.s3.driverBucket + '/' + element.road_tax
                //element.insurance_covernote = config.aws.prefix + config.aws.s3.driverBucket + '/' + element.insurance_covernote
                element.front_photo = config.aws.prefix + config.aws.s3.driverBucket + '/' + element.front_photo
                element.rear_photo = config.aws.prefix + config.aws.s3.driverBucket + '/' + element.rear_photo
                element.left_photo = config.aws.prefix + config.aws.s3.driverBucket + '/' + element.left_photo
                element.right_photo = config.aws.prefix + config.aws.s3.driverBucket + '/' + element.right_photo
                element.is_default = (element.vehicle_id == vehicle_id ? true : false)
                element.is_verified = element.is_verified ? element.is_verified : false
            });
            resolve(columnAndValues)
            return
        } catch (error) {
            console.log(error);
            reject(error)
            return
        }
    })
};

/*
    Name : Driver Details
    Purpose : Driver Details
    Original Author : Gaurav Patel
    Created At : 9th Dec 2020
*/
const details = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let today = timeZone(new Date()).tz(requestParam.time_zone);
            let driver = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.driver_id}, { _id: 0, driver_id: 1, profile_picture:1, name:1, vehicles:1, vehicle_id:1, created_at:1} );
            if(!driver){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let vehicle = _.where(driver.vehicles, {vehicle_id: driver.vehicle_id})
            let vehicleName = await query.selectWithAndOne(dbConstants.dbSchema.vehicles, {vehicle_id: driver.vehicle_id}, { _id: 0, vehicle_id: 1, title:1} );
            let joinArr = [{
                $lookup: {
                    from: 'customers',
                    localField: 'customer_id',
                    foreignField: 'customer_id',
                    as: 'cusDetails'
                }
            }, {
                $unwind: "$cusDetails"
            }, {
                $match: {
                    status:'completed',
                    driver_id: requestParam.driver_id
                }
            }, {
                $project: {
                    _id: 0,
                    trip_id: "$trip_id",
                    name: "$cusDetails.name",
                    profile_picture: "$cusDetails.profile_picture",
                    rating: "$customer_to_driver_rating",
                    comment: "$customer_to_driver_comment",
                }
            }];
            let trips = await query.joinWithAnd(dbConstants.dbSchema.trips, joinArr);
            var driverRatings = _.filter(trips, function(num){ return num.rating > 0; });
            let rating = LD.sumBy(driverRatings, 'rating');
            rating = rating > 0 ? parseFloat(rating / driverRatings.length).toFixed(1) : 0;
            _.each(driverRatings, (rec) => {
                rec.profile_picture = rec.profile_picture!='' ? config.aws.prefix + config.aws.s3.customerBucket + '/' + rec.profile_picture : ''
            })
            driver.created_at = timeZone(new Date(driver.created_at)).tz(requestParam.time_zone)
            resolve({
                name: driver.name,
                profile_picture: driver.profile_picture!='' ? (config.aws.prefix + config.aws.s3.driverBucket + '/' + driver.profile_picture) : '',
                vehicle_name: vehicleName ? vehicleName.title[requestParam.code] : '',
                vehicle_plate_number: vehicle[0].vehicle_number,
                vehicle_model: vehicle[0].model,
                rating: parseFloat(rating),
                total_trips: trips.length,
                experience: today.diff(driver.created_at, 'years'),
                comments: driverRatings,
            })
            return
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Finance Details
    Purpose : Finance Details
    Original Author : Gaurav Patel
    Created At : 10th Dec 2020
*/
const finance = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, default_currency: 1} );
            let driver = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.driver_id}, { _id: 0, driver_id: 1, trip_id:1, created_at:1} );
            if(!driver){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            
            // FOR TOTAL EARN
            let columnsAndValue = {
                driver_id: requestParam.driver_id,
                status:'completed'
            }
            let total_trips = await query.selectWithAnd(dbConstants.dbSchema.trips, columnsAndValue, { _id: 0, driver_earn: 1, trip_id:1, created_at:1} );

            // FOR WEEK EARN
            columnsAndValue = {
                driver_id: requestParam.driver_id,
                status:'completed'
            }
            columnsAndValue.created_at = {
                $lte: new Date(requestParam.end_date+'T23:59:59.000Z'),
                $gte: new Date(requestParam.start_date+'T00:00:00.000Z')
            }
            let week_trips = await query.selectWithAnd(dbConstants.dbSchema.trips, columnsAndValue, { _id: 0, driver_earn: 1, trip_id:1, created_at:1, total_distance:1} );

            resolve({
                default_currency: settings.default_currency,
                total_earn: parseFloat((LD.sumBy(total_trips, 'driver_earn')).toFixed(2)),
                week_earn: parseFloat((LD.sumBy(week_trips, 'driver_earn')).toFixed(2)),
                week_trips: week_trips.length,
                week_distance: parseFloat(((LD.sumBy(week_trips, 'total_distance')) / 3600).toFixed(2)),
            })
            return
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

/*
    Name : Online Offline
    Purpose : Online Offline
    Original Author : Gaurav Patel
    Created At : 18th Dec 2020
*/
const onlineOffline = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let driver = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.driver_id}, { _id: 0, driver_id: 1, vehicles:1, created_at:1} );
            if(!driver){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let is_verified = true;
            let is_vehicle_added = true;
            let availability_status = 'offline';
            if(requestParam.action == 'offline'){
                await query.updateSingle(dbConstants.dbSchema.drivers, { availability_status:'offline' }, { driver_id: requestParam.driver_id });
            }
            else{
                if(driver.vehicles.length == 0){
                    is_vehicle_added = false
                }
                if(driver.vehicles.length > 0){
                    if(!driver.vehicles[0].is_verified || driver.vehicles[0].is_verified == false){
                        is_verified = false
                    }
                }
                if(is_verified && is_vehicle_added){
                    await query.updateSingle(dbConstants.dbSchema.drivers, { availability_status:'online' }, { driver_id: requestParam.driver_id });
                    availability_status = 'online';
                }
            }
            resolve({
                is_verified: is_verified,
                is_vehicle_added: is_vehicle_added,
                availability_status: availability_status
            });
            return
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

module.exports = {
    vehicleManagement,
    vehicleFormat,
    details,
    finance,
    onlineOffline
};