'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const config = require('./../../config');
const query = require('./../../utils/query-creator');
const queryAPI = require('./../../utils/query-creator-api');
let asyncLoop = require('async');
let _ = require('underscore');
const commonHandler = require('./../../model_handlers/backend/common-handler');
const emailHandler = require('./../../model_handlers/api/email-handler');
const driver = require('./../../models/driver');
const notificationHandler = require('./../../model_handlers/api/notification-handler');
let LD = require('lodash');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.driver_id || req.query.status){
        if(req.query.driver_id){
            columnAndValue.driver_id = req.query.driver_id;
        }
        if(req.query.status){
            columnAndValue.status = req.query.status;
        }
        query.selectWithAndFilter(dbConstants.dbSchema.drivers, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.drivers);
                done(errors.internalServer(true), null);
                return;
            }
            if(req.query.status){
                done(null,response)
            }
            else{
                if(response.length == 0){
                    done(errors.resourceNotFound(true), null);
                    return;
                }
                response = response[0]
                if(response.profile_picture!=''){
                    response.profile_picture = config.aws.prefix + config.aws.s3.driverBucket + '/' + response.profile_picture;
                }
                response.driving_licence = response.driving_licence=='' ? req.protocol + '://' + req.get('host')+'/img/not_upload.png' : config.aws.prefix + config.aws.s3.driverBucket + '/' + response.driving_licence;
                response.vehicle_insurance = response.vehicle_insurance=='' ? req.protocol + '://' + req.get('host')+'/img/not_upload.png' : config.aws.prefix + config.aws.s3.driverBucket + '/' + response.vehicle_insurance;
                response.vehicle_registration = response.vehicle_registration=='' ? req.protocol + '://' + req.get('host')+'/img/not_upload.png' : config.aws.prefix + config.aws.s3.driverBucket + '/' + response.vehicle_registration;
                response.certificate_of_completion = response.certificate_of_completion=='' ? req.protocol + '://' + req.get('host')+'/img/not_upload.png' : config.aws.prefix + config.aws.s3.driverBucket + '/' + response.certificate_of_completion;
                done(null,response)
            }
        });
	}
    else{
    	query.selectWithAndFilter(dbConstants.dbSchema.drivers, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.drivers);
                done(errors.internalServer(true), null);
                return;
            }
            done(null,response)
        });
    }
};

const create = async function(requestParam, req, done){
    requestParam.email = requestParam.email.trim();
    let regexEmail = new RegExp(['^', requestParam.email, '$'].join(''), 'i');
    let compareColumnAndValues = {
        $or: [{
            email: regexEmail
        }, {
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
        }]
    };
    query.selectWithAndOne(dbConstants.dbSchema.drivers, compareColumnAndValues, {
        driver_id: 1
    }, async(error, exists) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if (exists) {
            done(errors.duplicateUser(true), null);
            return;
        }
    	requestParam.profile_picture = await new Promise((resolve, reject) => {
            commonHandler.uploadImage(req.files.profile_picture, 'driver', (error, path) => {
                resolve(path)
            });
        });
        query.insertSingle(dbConstants.dbSchema.drivers, requestParam, function(error, user) {
            if (error) {
                logger('Error: can not create user');
                done(error, null);
                return;
            }
            requestParam.template_code = 'DRI_SIGN_UP';
            requestParam.code = 'EN';
            emailHandler.sendEmail(requestParam);
            done(null, user);
        });
    });
};

const update = function(requestParam, req, done){
    requestParam.email = requestParam.email.trim();
    let regexEmail = new RegExp(['^', requestParam.email, '$'].join(''), 'i');
    let compareColumnAndValues = {
        $and: [{
            $or: [{
                email: regexEmail
            }, {
                mobile: requestParam.mobile,
                mobile_country_code: requestParam.mobile_country_code,
            }]
        }, {
            driver_id: {
                $ne: requestParam.driver_id
            }
        }]

    };
    query.selectWithAndOne(dbConstants.dbSchema.drivers, compareColumnAndValues, {
        driver_id: 1,
    }, async(error, exists) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if (exists) {
            done(errors.duplicateUser(true), null);
            return;
        }
        delete requestParam.driving_licence
        delete requestParam.vehicle_insurance
        delete requestParam.vehicle_registration
        delete requestParam.certificate_of_completion
    	if (requestParam.change_logo) {
            query.selectWithAndOne(dbConstants.dbSchema.drivers, {
                driver_id: requestParam.driver_id
            }, {
                driver_id: 1,
                profile_picture: 1,
            }, async(error, user) => {
                let fileObjects = [];
                if(requestParam.change_logo){
                    fileObjects.push({
                        Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(user.profile_picture)[0]
                    })
                }
                commonHandler.removeMultipleImages(fileObjects, async(error, path) => {
                    requestParam.profile_picture = await new Promise((resolve, reject) => {
                        commonHandler.uploadImage(req.files.profile_picture, 'driver', (error, path) => {
                            resolve(path)
                        });
                    });
                    query.updateSingle(dbConstants.dbSchema.drivers, requestParam, {
                        'driver_id': requestParam.driver_id
                    }, function(error, user) {
                        if (error) {
                            logger('Error: can not update push Notification');
                            done(error, null);
                            return;
                        }
                        done(null, user);
                    });
                });
            });
        }
        else{
            delete requestParam.profile_picture
            query.updateSingle(dbConstants.dbSchema.drivers, requestParam, {
                'driver_id': requestParam.driver_id
            }, function(error, user) {
                if (error) {
                    logger('Error: can not update push Notification');
                    done(error, null);
                    return;
                }
                done(null, user);
            });
        }
    });
};

const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.selectWithAnd(dbConstants.dbSchema.drivers, {
            driver_id: {
                $in: requestParam.ids
            }
        }, {
            _id: 0,
            driver_id: 1,
            profile_picture: 1,
        }, (error, user) => {
            let fileObjects = [];
            for (var i = 0; i < user.length; i++) {
                fileObjects.push({
                    Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(user[i].profile_picture)[0]
                })
            }
            commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                query.removeMultiple(dbConstants.dbSchema.drivers, {
                    'driver_id': {
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
            });
        });        
    }
    else
    {
        let columnsToUpdate = {
            status: requestParam['type']
        };
        if(requestParam.type == 'verified'){
            columnsToUpdate = {
                is_verified: true
            };
            requestParam.template_code = 'DRI_ACC_VERIFIED'
            sendNotificationAndEmail(requestParam)
        }
        query.updateMultiple(dbConstants.dbSchema.drivers, columnsToUpdate, {
            'driver_id': {
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
    }
};

const profile = (req, done) => {
    query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: req.query.driver_id}, {
        _id: 0,
        driver_id: 1,
        name: 1,
        email: 1,
        mobile_country_code: 1,
        mobile: 1,
        player_id: 1,
        city: 1,
        profile_picture:1,
    }, async(error, response) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if (!response) {
            done(errors.resourceNotFound(true), null);
            return;
        }
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
                driver_id: req.query.driver_id
            }
        }, {
            $project: {
                _id: 0,
                trip_id: "$trip_id",
                rating: "$customer_to_driver_rating",
            }
        }];
        let trips = await queryAPI.joinWithAnd(dbConstants.dbSchema.trips, joinArr);
        var driverRatings = _.filter(trips, function(num){ return num.rating > 0; });
        let rating = LD.sumBy(driverRatings, 'rating');
        rating = rating > 0 ? parseFloat(rating / driverRatings.length).toFixed(1) : 0;

        if(response.profile_picture!=''){
            response.profile_picture = config.aws.prefix + config.aws.s3.driverBucket + '/' + response.profile_picture;
        }
        response = JSON.parse(JSON.stringify(response))
        response.rating = rating;
        done(null, response)
    });
};

const vehicle = (req, done) => {
    query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: req.query.driver_id}, {
        _id: 0,
        driver_id: 1,
        vehicles:1,
    }, async(error, response) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if (!response) {
            done(errors.resourceNotFound(true), null);
            return;
        }
        if(response.vehicles.length > 0){
            query.selectWithAndOne(dbConstants.dbSchema.vehicles, {vehicle_id: response.vehicles[0].vehicle_id}, {
                _id: 0,
                vehicle_id: 1,
                title:1,
            }, async(error, vehicle) => {
                let obj = {
                    vehicle_id : response.vehicles[0].vehicle_id,
                    vehicle_name : vehicle ? vehicle.title.EN : '',
                    vehicle_number : response.vehicles[0].vehicle_number,
                    model : response.vehicles[0].model,
                    is_verified : response.vehicles[0].is_verified,
                    //insurance_covernote : config.aws.prefix + config.aws.s3.driverBucket + '/' + response.vehicles[0].insurance_covernote,
                    front_photo : config.aws.prefix + config.aws.s3.driverBucket + '/' + response.vehicles[0].front_photo,
                    rear_photo : config.aws.prefix + config.aws.s3.driverBucket + '/' + response.vehicles[0].rear_photo,
                    left_photo : config.aws.prefix + config.aws.s3.driverBucket + '/' + response.vehicles[0].left_photo,
                    right_photo : config.aws.prefix + config.aws.s3.driverBucket + '/' + response.vehicles[0].right_photo,
                }
                done(null, obj)
            });
        }
        else{
            done(errors.duplicateUser(true), null);
            return;
        }
    });
};

const approvedVehicle = (req, done) => {
    query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: req.query.driver_id}, {
        _id: 0,
        driver_id: 1,
        vehicles:1,
    }, async(error, response) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if (!response) {
            done(errors.resourceNotFound(true), null);
            return;
        }
        let vehicle = response.vehicles[0];
        vehicle.is_verified = true;
        query.updateSingle(dbConstants.dbSchema.drivers, {vehicles:[vehicle]}, {
            'driver_id': req.query.driver_id
        }, function(error, user) {
            if (error) {
                logger('Error: can not update vehicle info');
                done(error, null);
                return;
            }
            req.query.template_code = 'DRI_VEH_APPROVED'
            req.query.ids = [req.query.driver_id]
            sendNotificationAndEmail(req.query)
            done(null, {});
        });
    });
};

const sendNotificationAndEmail = (requestParam, done) => {
    query.selectWithAnd(dbConstants.dbSchema.drivers, {driver_id: {$in: requestParam['ids']}}, {
        _id: 0,
        driver_id: 1,
        player_id: 1,
    }, async(error, drivers) => {
        let template = await queryAPI.selectWithAndOne(dbConstants.dbSchema.push_templates, {code: requestParam.template_code}, {_id: 0,value: 1, caption_value:1}, {created_at: 1});
        if(template){
            let msg  = template.value['EN'];
            msg = msg.replace('#NAME#', requestParam.vehicle_name || '')
            msg = msg.replace('#MODEL#', requestParam.model || '')
            notificationHandler.sendNotification({
                message:msg,
                type:'account_verified',
                player_ids:_.pluck(drivers, 'player_id'),
                user_type:'driver'
            });
            notificationHandler.setLogs({
                user_id:_.pluck(drivers, 'driver_id'),
                user_type:'driver',
                message: template.caption_value['EN'], 
                description:msg
            });
        }
        asyncLoop.forEachSeries(requestParam.ids, function(rec, Callback_s1) {
            query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: rec}, {
                _id: 0,
                name: 1,
                email: 1,
            }, async(error, driver) => {
                requestParam.name = driver.name;
                requestParam.email = driver.email;
                requestParam.vehicle_name = requestParam.vehicle_name || '';
                requestParam.model = requestParam.model || '';
                requestParam.code = 'EN';
                emailHandler.sendEmail(requestParam);
                Callback_s1();
            });
        }, function(){
            return false
        });
    });
};

const ratings = (requestParam, done) => {
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
        $match: {status:'completed', driver_id:requestParam.driver_id, customer_to_driver_rating:{$ne: 0}}
    }, {
        $sort: {
            created_at: -1
        }
    }, {
        $project: {
            _id: 0,
            trip_id: "$trip_id",
            customer: "$cusDetails",
            vehicle:"$vehDetails",
            customer_to_driver_rating: "$customer_to_driver_rating",
            customer_to_driver_comment: "$customer_to_driver_comment",
            created_at: "$created_at",
        }
    }];
    query.joinWithAnd(dbConstants.dbSchema.trips, joinArr, async (error, response) => {
        if (error) {
            logger('Error: can not get record.');
            done(errors.internalServer(true), null);
            return;
        }
        _.each(response, (elem) => {
            if(!elem.customer){
                elem.customer = ''
            }
            else{
                elem.customer = elem.customer.name
            }
            if(!elem.vehicle){
                elem.vehicle = ''
            }
            else{
                elem.vehicle = elem.vehicle.title.EN
            }
            elem.created_at = timeZone(new Date(elem.created_at)).tz(requestParam.time_zone).format('lll')
        });
        done(null, response);
        return
    });
};

module.exports = {
	get,
	create,
	action,
	update,
    profile,
    vehicle,
    approvedVehicle,
    ratings
};