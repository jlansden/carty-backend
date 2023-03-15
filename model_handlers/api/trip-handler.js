'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const trip = require('./../../models/trip');
const Transaction = require('./../../models/transaction');
const Lost_item = require('./../../models/lost-item');
const moment = require('moment');
let asyncLoop = require('async');
let _ = require('underscore');
let LD = require('lodash');
const commonHandler = require('./../../model_handlers/api/common-handler');
const notificationHandler = require('./../../model_handlers/api/notification-handler');
const { sendSMS } = require('./../../utils/sms-manager');
const emailHandler = require('./../../model_handlers/api/email-handler');
const timeZone = require('moment-timezone');

/*
    Name : Book Trip
    Purpose : Book Trip
    Original Author : Gaurav Patel
    Created At : 1st Dec 2020
*/
const book = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1,name:1, email:1, default_card:1, stripe_profile_id:1, mobile_country_code:1, mobile:1 } );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let vehicle = await query.selectWithAndOne(dbConstants.dbSchema.vehicles, {vehicle_id: requestParam.vehicle_id}, { _id: 0, vehicle_id: 1 } );
            if(!vehicle){
                reject(errors.vehicleNotFound(true, requestParam.code));
                return;
            }
            let driverIds = await commonHandler.getRadiusDriver({start_latitude:requestParam.start_latitude, start_longitude:requestParam.start_longitude});
            let compairData = {
                $or: [{
                    status: 'pending'
                }, {
                    status: 'accepted',
                }, {
                    status: 'pickedup',
                }, {
                    status: 'started',
                }]
            }
            let allJobs = await query.selectWithAnd(dbConstants.dbSchema.trips, compairData, {_id:0, requested_ids:1}, {});
            let allIds=[];
            _.each(allJobs, (element) => {
                if(element.requested_ids.length>0){
                    allIds.push(element.requested_ids)
                }
            });
            allIds = _.flatten(allIds);
            driverIds = driverIds.filter((item) => !allIds.includes(item))
            let drivers = await query.selectWithAnd(dbConstants.dbSchema.drivers, { driver_id: {$in:driverIds}, vehicle_id: requestParam.vehicle_id, availability_status:'online'}, {_id:0, player_id:1 ,driver_id:1, vehicle_id:1}, {});
            if(drivers.length > 0){
                requestParam.requested_ids = _.pluck(drivers, 'driver_id');

                let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, is_payment_live: 1} );
                let stripe = require("stripe")(settings.is_payment_live ? config.stripeInfo.live_key : config.stripeInfo.test_key);

                let stripeRes = await (new Promise(async(resolve1, reject1) => {
                    let chargeAmount = Math.round(parseFloat(requestParam.total) * 100).toFixed(2);
                    stripe.charges.create({
                        amount: parseFloat(chargeAmount),
                        currency: "usd",
                        source: requestParam.card_id,
                        customer: response.stripe_profile_id,
                        description: response.email,
                        capture: false
                    }, async function(err, charge) {
                        if(err){
                            reject(errors.stripeError(true, err.message,requestParam.code));
                            return;
                        }
                        resolve1(charge)
                    })
                }));
                requestParam.charge_id = stripeRes.id

                requestParam.trip_otp = Math.floor(1000 + Math.random() * 9000);

                let trip = await query.insertSingle(dbConstants.dbSchema.trips, requestParam);
                assignDriverFirebase({trip_id:trip.trip_id, drivers:requestParam.requested_ids, status:trip.status});
                let template = await query.selectWithAndOne(dbConstants.dbSchema.push_templates, {code: 'ASSIGN_TRIP_DRIVER'}, {_id: 0,value: 1, caption_value:1}, {created_at: 1});
                if(template){
                    let msg  = template.value[requestParam.code];
                    notificationHandler.sendNotification({
                        message:msg,
                        type:'assign_trip',
                        trip_id: trip.trip_id, 
                        player_ids:_.pluck(drivers, 'player_id'),
                        user_type:'driver'
                    });
                    notificationHandler.setLogs({
                        user_id:_.pluck(drivers, 'driver_id'),
                        user_type:'driver',
                        message: template.caption_value[requestParam.code], 
                        description:msg
                    });
                }
                config.firebase.tripsRef.child(trip.trip_id).set({
                    status: trip.status,
                    driver_id:""
                });

                let sms_template = await query.selectWithAndOne(dbConstants.dbSchema.sms_templates, {code:'START_TRIP_OTP'}, { _id: 0, value: 1} );
                if(sms_template){
                    let msg = sms_template.value[requestParam.code]
                    msg = msg.replace('#NAME#', response.name)
                    msg = msg.replace('#OTP#', requestParam.trip_otp)
                    sendSMS({ message: msg, mobile_country_code: response.mobile_country_code, mobile: response.mobile });
                }

                resolve({trip_id: trip.trip_id});
                return;
            }
            else{
                reject(errors.driverNotAvailableForTrip(true, requestParam.code));
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
    Name : Update Firebase assign Driver
    Purpose : Update Firebase assign Driver
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
const assignDriverFirebase = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            asyncLoop.forEachSeries(requestParam.drivers, async function(singleRec, Callback_s1) {
                await config.firebase.assignTripsRef.child(singleRec).set({
                    trip_id: requestParam.trip_id,
                    status: requestParam.status,
                });
                Callback_s1()
            },function(){
                return false;
            });
        } catch (error) {
            return false;
        }
    })
};

/*
    Name : Ongoing Trip
    Purpose : Ongoing Trip
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
const ongoing = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(requestParam.user_type == 'customer'){
                let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, default_currency: 1 } );
                let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.user_id}, { _id: 0, customer_id: 1 } );
                if(!customer){
                    reject(errors.userNotFound(true, requestParam.code));
                    return;
                }
                let columnAndValue = {
                    $or: [{
                        status: 'pending'
                    }, {
                        status: 'accepted'
                    }, {
                        status: 'pickedup'
                    }, {
                        status: 'started'
                    }]
                };
                columnAndValue.customer_id = requestParam.user_id
                let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, columnAndValue, { 
                    _id: 0, 
                    trip_id: 1, 
                    customer_id: 1, 
                    vehicle_id: 1, 
                    status:1, 
                    driver_id:1, 
                    start_address:1, 
                    start_latitude:1, 
                    start_longitude:1,
                    finish_address:1, 
                    finish_latitude:1, 
                    finish_longitude:1,  
                    formatted_distance:1,  
                    formatted_duration:1,  
                    total:1,
                    fare_info:1  
                });
                if(!trip){
                    reject(errors.ongoingJobNotFound(true, requestParam.code));
                    return;
                }
                if(trip.status == 'pending'){
                    resolve({trip_id: trip.trip_id, status:trip.status});
                    return;
                }
                let joinArr = [{
                    $lookup: {
                        from: 'vehicles',
                        localField: 'vehicle_id',
                        foreignField: 'vehicle_id',
                        as: 'vehDetails'
                    }
                }, {
                    $unwind: "$vehDetails"
                }, {
                    $match: {
                        driver_id: trip.driver_id
                    }
                }, {
                    $project: {
                        _id: 0,
                        name: "$name",
                        mobile_country_code: "$mobile_country_code",
                        mobile: "$mobile",
                        profile_picture: "$profile_picture",
                        vehicles: "$vehicles",
                        vehicle_name: "$vehDetails.title."+requestParam.code,
                    }
                }];
                let driver = await query.joinWithAnd(dbConstants.dbSchema.drivers, joinArr);
                if(driver.length == 0 ){
                    reject(errors.userNotFound(true, requestParam.code));
                    return;
                }
                driver = driver[0]
                let vehicle = _.where(driver.vehicles, {vehicle_id: trip.vehicle_id})
                let make = ''
                let model = ''
                let year = ''
                let vehicle_number = ''
                if(vehicle.length > 0){
                    year = vehicle[0].year;
                    vehicle_number = vehicle[0].vehicle_number;
                    let makeTitle = await query.selectWithAndOne(dbConstants.dbSchema.makes, {make_id: vehicle[0].make}, { _id: 0, make_id: 1, title:1 } );
                    make = makeTitle ? makeTitle.title[requestParam.code] : ''
                    let modelTitle = await query.selectWithAndOne(dbConstants.dbSchema.models, {model_id: vehicle[0].model}, { _id: 0, model_id: 1, title:1 } );
                    model = modelTitle ? modelTitle.title[requestParam.code] : ''
                }
                let trips = await query.selectWithAnd(dbConstants.dbSchema.trips, {driver_id: trip.driver_id, status:'completed', customer_to_driver_rating:{$gt: 0}}, { _id: 0, trip_id:1, customer_to_driver_rating: 1 } );
                let rating = LD.sumBy(trips, 'customer_to_driver_rating');
                rating = rating > 0 ? parseFloat(rating / trips.length).toFixed(1) : 0;
                
                trip = JSON.parse(JSON.stringify(trip))
                trip.driver = {
                    name: driver.name,
                    mobile_country_code: driver.mobile_country_code,
                    mobile: driver.mobile,
                    profile_picture: driver.profile_picture!='' ? config.aws.prefix + config.aws.s3.driverBucket + '/' + driver.profile_picture : '',
                    vehicle_name: driver.vehicle_name,
                    vehicle_plate_number: vehicle_number,
                    vehicle_make: make,
                    vehicle_model: model,
                    vehicle_year: year,
                    rating: parseFloat(rating)
                }
                trip.default_currency = settings.default_currency
                resolve(trip);
                return;
            }
            else{
                let driver = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.user_id}, { _id: 0, driver_id: 1 } );
                if(!driver){
                    reject(errors.userNotFound(true, requestParam.code));
                    return;
                }
                let columnAndValue = {
                    $or: [{
                        status: 'accepted'
                    }, {
                        status: 'pending'
                    }, {
                        status: 'pickedup'
                    }, {
                        status: 'started'
                    }]
                };
                columnAndValue.requested_ids = {$in: [requestParam.user_id]}
                
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
                    $lookup: {
                        from: 'modes',
                        localField: 'preferences.mode_id',
                        foreignField: 'mode_id',
                        as: 'modDetails'
                    }
                }, {
                    "$unwind": {
                        "path": "$modDetails",
                        "preserveNullAndEmptyArrays": true
                    }
                }, {
                    $lookup: {
                        from: 'musics',
                        localField: 'preferences.music_id',
                        foreignField: 'music_id',
                        as: 'musicDetails'
                    }
                }, {
                    "$unwind": {
                        "path": "$musicDetails",
                        "preserveNullAndEmptyArrays": true
                    }
                }, {
                    $lookup: {
                        from: 'accessibles',
                        localField: 'preferences.accessible_id',
                        foreignField: 'accessible_id',
                        as: 'accessiblesDetails'
                    }
                }, {
                    "$unwind": {
                        "path": "$accessiblesDetails",
                        "preserveNullAndEmptyArrays": true
                    }
                }, {
                    $match: columnAndValue
                }, {
                    $project: {
                        _id: 0,
                        trip_id: "$trip_id",
                        customer_id: "$customer_id",
                        status: "$status",
                        start_address: "$start_address",
                        start_latitude: "$start_latitude",
                        start_longitude: "$start_longitude",
                        finish_address: "$finish_address",
                        finish_latitude: "$finish_latitude",
                        finish_longitude: "$finish_longitude",
                        preferences:{
                            mode: "$modDetails.title."+requestParam.code || '',
                            music: "$musicDetails.title."+requestParam.code || '',
                            accessible: "$accessiblesDetails.title."+requestParam.code || '',
                            temperature: "$preferences.temperature",
                        },
                        customer: {
                            name: "$cusDetails.name",
                            mobile_country_code: "$cusDetails.mobile_country_code",
                            mobile: "$cusDetails.mobile",
                            profile_picture: "$cusDetails.profile_picture",
                            rating: "",
                        }
                    }
                }];
                let trip = await query.joinWithAnd(dbConstants.dbSchema.trips, joinArr);
                if(trip.length == 0 ){
                    reject(errors.tripNotFound(true, requestParam.code));
                    return;
                }
                trip = trip[0]

                let trips = await query.selectWithAnd(dbConstants.dbSchema.trips, {customer_id: trip.customer_id, status:'completed', driver_to_customer_rating:{$gt: 0}}, { _id: 0, trip_id:1, driver_to_customer_rating: 1 } );
                let rating = LD.sumBy(trips, 'driver_to_customer_rating');
                rating = rating > 0 ? parseFloat(rating / trips.length).toFixed(1) : 0;

                trip.customer.rating = parseFloat(rating)
                trip.customer.profile_picture = trip.customer.profile_picture!='' ? config.aws.prefix + config.aws.s3.customerBucket + '/' + trip.customer.profile_picture : '',
                resolve(trip);
                return;
            }
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Trip Action
    Purpose : Trip Action
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
const action = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let driver = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.driver_id}, { _id: 0, driver_id: 1, name:1, mobile_country_code:1, mobile:1 } );
            if(!driver){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, { _id: 0, trip_id: 1 } );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }
            if(requestParam.action == 'accept'){
                resolve(accept(requestParam, driver));
                return;
            }
            else if(requestParam.action == 'reject'){
                let acceptOrnot = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, {_id:0, trip_id:1,requested_ids:1, rejected_ids:1});
                let rejected_ids = acceptOrnot.rejected_ids;
                rejected_ids.push(requestParam.driver_id);
                let update_ids = _.without(acceptOrnot.requested_ids, requestParam.driver_id);
                await query.updateSingle(dbConstants.dbSchema.trips, {requested_ids:update_ids, rejected_ids:rejected_ids }, { trip_id: requestParam.trip_id });
                await config.firebase.assignTripsRef.ref.child(requestParam.driver_id).remove();
                resolve({});
                return;
            }
            else if(requestParam.action == 'pickup'){
                resolve(pickup(requestParam));
                return;
            }
            else if(requestParam.action == 'start'){
                resolve(start(requestParam));
                return;
            }
            else if(requestParam.action == 'complete'){
                resolve(complete(requestParam));
                return;
            }
            else{
                resolve({});
                return;
            }
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Accept Trip
    Purpose : Accept Trip
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
const accept = async(requestParam, response) => {
    return new Promise(async(resolve, reject) => {
        try {
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id, status:'pending'}, { _id: 0, trip_id: 1, requested_ids:1, status:1, customer_id:1, trip_otp:1 } );
            if(!trip){
                reject(errors.tripAlreadyAccept(true, requestParam.code));
                return;
            }
            let rest_ids = _.without(trip.requested_ids, requestParam.driver_id);
            await query.updateSingle(dbConstants.dbSchema.trips, { status: 'accepted', driver_id: requestParam.driver_id, requested_ids:[requestParam.driver_id] }, { trip_id: requestParam.trip_id });
            config.firebase.tripsRef.child(requestParam.trip_id).update({
                status: 'accepted',
                driver_id:requestParam.driver_id
            });
            asyncLoop.forEachSeries(rest_ids, async function(singleRec, Callback_s1) {
                await config.firebase.assignTripsRef.ref.child(singleRec).remove();
                Callback_s1()
            },async function(){
            });
            await config.firebase.assignTripsRef.child(requestParam.driver_id).update({
                status: 'accepted',
                trip_id: requestParam.trip_id,
            });
            sendNotificationToCustomer({trip_id: requestParam.trip_id, customer_id: trip.customer_id, code: requestParam.code, push_code:'ACCEPT_TRIP_BY_DRIVER'});
            
            let sms_template = await query.selectWithAndOne(dbConstants.dbSchema.sms_templates, {code:'START_TRIP_DRIVER_OTP'}, { _id: 0, value: 1} );
            if(sms_template){
                let msg = sms_template.value[requestParam.code]
                msg = msg.replace('#NAME#', response.name)
                msg = msg.replace('#OTP#', trip.trip_otp)
                sendSMS({ message: msg, mobile_country_code: response.mobile_country_code, mobile: response.mobile });
            }

            resolve({});
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Pickup Trip
    Purpose : Pickup Trip
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
const pickup = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id, status:'accepted'}, { _id: 0, trip_id: 1, status:1, customer_id:1 } );
            if(!trip){
                reject(errors.tripAlreadyPickup(true, requestParam.code));
                return;
            }
            await query.updateSingle(dbConstants.dbSchema.trips, { status: 'pickedup', driver_id: requestParam.driver_id}, { trip_id: requestParam.trip_id });
            config.firebase.tripsRef.child(requestParam.trip_id).update({
                status: 'pickedup',
                driver_id:requestParam.driver_id
            });
            await config.firebase.assignTripsRef.child(requestParam.driver_id).update({
                status: 'pickedup',
                trip_id: requestParam.trip_id,
            });
            sendNotificationToCustomer({trip_id: requestParam.trip_id, customer_id: trip.customer_id, code: requestParam.code, push_code:'PICKUP_TRIP_BY_DRIVER'});
            resolve({});
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : STart Trip
    Purpose : STart Trip
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
const start = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id, status:'pickedup'}, { _id: 0, trip_id: 1, status:1, customer_id:1 } );
            if(!trip){
                reject(errors.tripAlreadyStart(true, requestParam.code));
                return;
            }
            await query.updateSingle(dbConstants.dbSchema.trips, { status: 'started', driver_id: requestParam.driver_id}, { trip_id: requestParam.trip_id });
            config.firebase.tripsRef.child(requestParam.trip_id).update({
                status: 'started',
                driver_id:requestParam.driver_id
            });
            await config.firebase.assignTripsRef.child(requestParam.driver_id).update({
                status: 'started',
                trip_id: requestParam.trip_id,
            });
            sendNotificationToCustomer({trip_id: requestParam.trip_id, customer_id: trip.customer_id, code: requestParam.code, push_code:'START_TRIP_BY_DRIVER'});
            resolve({});
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Complete Trip
    Purpose : Complete Trip
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
const complete = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id, status:'started'}, { _id: 0, trip_id: 1, status:1, customer_id:1, driver_id:1, requested_ids:1, charge_id:1, total:1 } );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }

            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, is_payment_live: 1, company_percentage:1} );
            let stripe = require("stripe")(settings.is_payment_live ? config.stripeInfo.live_key : config.stripeInfo.test_key);
            let stripeRes = await (new Promise(async(resolve1, reject1) => {
                stripe.charges.capture(trip.charge_id, (err, charge) => {
                    if(err){
                        reject(errors.stripeError(true, err.message,requestParam.code));
                        return;
                    }
                    resolve1(charge)
                });
            }));

            let insertTransaction = {
                payment_transaction_id: trip.charge_id,
                customer_id: trip.customer_id,
                driver_id: trip.driver_id,
                trip_id: requestParam.trip_id,
                payment_type: 'Success',
                charge: trip.total,
            }
            await query.insertSingle(dbConstants.dbSchema.transactions, insertTransaction);
            let finalTotal = trip.total;
            let updateColumn = { status: 'completed', requested_ids:[], transaction_id:stripeRes.id, company_percentage:settings.company_percentage}

            if(requestParam.toll_charge){
                finalTotal += parseFloat(requestParam.toll_charge);
                updateColumn.toll_charge = requestParam.toll_charge
            }
            if(requestParam.cleaning_charge){
                finalTotal += parseFloat(requestParam.cleaning_charge)
                updateColumn.cleaning_charge = requestParam.cleaning_charge
            }

            let company_earn = (finalTotal * settings.company_percentage) / 100;
            let driver_earn = finalTotal - company_earn ;

            updateColumn.company_earn = company_earn
            updateColumn.driver_earn = driver_earn
            updateColumn.total = finalTotal


            await query.updateSingle(dbConstants.dbSchema.trips, updateColumn, { trip_id: requestParam.trip_id });
            await query.updateSingle(dbConstants.dbSchema.drivers, { trip_id: requestParam.trip_id}, { driver_id: trip.driver_id });
            asyncLoop.forEachSeries(trip.requested_ids, async function(singleRec, Callback_s1) {
                await config.firebase.assignTripsRef.child(singleRec).update({
                    status: 'completed',
                    trip_id: requestParam.trip_id,
                });
                await config.firebase.assignTripsRef.ref.child(singleRec).remove();
                Callback_s1()
            },async function(){
            });
            config.firebase.tripsRef.child(requestParam.trip_id).update({
                status: 'completed',
                driver_id:trip.driver_id
            });
            await config.firebase.tripsRef.ref.child(requestParam.trip_id).remove();
            sendNotificationToCustomer({trip_id: requestParam.trip_id, customer_id: trip.customer_id, code: requestParam.code, push_code:'COMPLETE_TRIP_BY_DRIVER'});
            await query.removeMultiple(dbConstants.dbSchema.share_trips, {trip_id: requestParam.trip_id})
            resolve({});
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Send Notification to Customer
    Purpose : Send Notification to Customer
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
const sendNotificationToCustomer = async (requestParam) => {
    let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, name: 1, player_id:1, customer_id:1 } );
    let template = await query.selectWithAndOne(dbConstants.dbSchema.push_templates, {code: requestParam.push_code}, {_id: 0,value: 1, caption_value:1}, {created_at: 1});
    if(template){
        let msg  = template.value[requestParam.code];
        msg = msg.replace('#TRIP_ID#', requestParam.trip_id)
        msg = msg.replace('#NAME#', customer ? customer.name : '')
        notificationHandler.sendNotification({
            message:msg,
            type:'accept_trip',
            trip_id: requestParam.trip_id, 
            player_ids:customer ? [customer.player_id] : [],
            user_type:'customer'
        });
        notificationHandler.setLogs({
            user_id:customer ? [customer.customer_id] : [],
            user_type:'customer',
            message: template.caption_value[requestParam.code], 
            description:msg
        });
    }
};

/*
    Name : Cancel Trip By Customer
    Purpose : Cancel Trip By Customer
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
const cancel = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1 } );
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, { _id: 0, trip_id: 1, status:1, customer_id:1,requested_ids:1 } );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }
            if(trip.status == 'pending'){
                await query.updateSingle(dbConstants.dbSchema.trips, { status: 'canceled'}, { trip_id: requestParam.trip_id });
                asyncLoop.forEachSeries(trip.requested_ids, async function(singleRec, Callback_s1) {
                    await config.firebase.assignTripsRef.child(singleRec).update({
                        status: 'canceled',
                        trip_id: requestParam.trip_id,
                    });
                    await config.firebase.assignTripsRef.ref.child(singleRec).remove();
                    Callback_s1()
                },async function(){
                });
                config.firebase.tripsRef.child(requestParam.trip_id).update({
                    status: 'canceled',
                    driver_id:''
                });
                await config.firebase.tripsRef.ref.child(requestParam.trip_id).remove();
                resolve({});
                return;
            }
            else{
                reject(errors.canNotCancelTrip(true, requestParam.code));
                return;
            }
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : receipt Trip
    Purpose : receipt Trip
    Original Author : Gaurav Patel
    Created At : 4nd Dec 2020
*/
const receipt = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, default_currency: 1} );
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, { _id: 0, status:1,trip_id: 1, total:1, vehicle_id:1, total_distance:1, total_duration:1, formatted_distance:1, formatted_duration:1, fare_info:1, created_at:1, toll_charge:1, cleaning_charge:1 } );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }
            resolve({
                default_currency: settings.default_currency,
                total: trip.total,
                status: trip.status,
                trip_id: trip.trip_id,
                toll_charge: trip.toll_charge ? trip.toll_charge : 0,
                cleaning_charge: trip.cleaning_charge ? trip.cleaning_charge : 0,
                trip_date: timeZone(new Date(trip.created_at)).tz(requestParam.time_zone).format('ll'),
                base_fare: trip.fare_info ? trip.fare_info.base_fare : 0,
                formatted_distance:trip.formatted_distance,
                distance_fare: trip.fare_info ? trip.fare_info.distance_fare : 0,
                formatted_duration: trip.formatted_duration,
                duration_fare: trip.fare_info ? trip.fare_info.duration_fare : 0,
            });
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : rating Trip
    Purpose : rating Trip
    Original Author : Gaurav Patel
    Created At : 4nd Dec 2020
*/
const rating = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, { _id: 0, trip_id: 1} );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }
            if(requestParam.user_type == 'customer'){
                let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.user_id}, { _id: 0, customer_id: 1 } );
                if(!customer){
                    reject(errors.userNotFound(true, requestParam.code));
                    return;
                }
                await query.updateSingle(dbConstants.dbSchema.trips, {customer_to_driver_rating:requestParam.rating, customer_to_driver_comment:requestParam.comment || '' }, { trip_id: requestParam.trip_id });
            }
            else{
                let driver = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.user_id}, { _id: 0, driver_id: 1 } );
                if(!driver){
                    reject(errors.userNotFound(true, requestParam.code));
                    return;
                }
                await query.updateSingle(dbConstants.dbSchema.trips, {driver_to_customer_rating:requestParam.rating, driver_to_customer_comment:requestParam.comment || '' }, { trip_id: requestParam.trip_id });
            }
            resolve({});
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : dispute Trip
    Purpose : dispute Trip
    Original Author : Gaurav Patel
    Created At : 9th Dec 2020
*/
const dispute = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1 } );
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, { _id: 0, trip_id: 1} );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }
            await query.updateSingle(dbConstants.dbSchema.trips, {dispute_msg:requestParam.dispute_msg || '' }, { trip_id: requestParam.trip_id });
            resolve({});
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : history Trip
    Purpose : history Trip
    Original Author : Gaurav Patel
    Created At : 9th Dec 2020
*/
const history = async(requestParam) => {
    let limit = 50;
    let page = requestParam.page - 1;
    let skip = page * limit;
    return new Promise(async(resolve, reject) => {
        try {
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, default_currency: 1 } );
            if(requestParam.user_type == 'customer'){
                let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.user_id}, { _id: 0, customer_id: 1 } );
                if(!customer){
                    reject(errors.userNotFound(true, requestParam.code));
                    return;
                }
                let columnAndValue = {
                    customer_id: requestParam.user_id,
                    status: requestParam.status
                };
                let joinArr = [{
                    $lookup: {
                        from: 'drivers',
                        localField: 'driver_id',
                        foreignField: 'driver_id',
                        as: 'driDetails'
                    }
                }, {
                    $unwind: "$driDetails"
                }, {
                    $match: columnAndValue
                }, {
                    $sort: {created_at: -1}
                }, {
                    $skip: skip
                }, {
                    $limit: limit
                }, {
                    $project: {
                        _id: 0,
                        name: "$driDetails.name",
                        profile_picture: "$driDetails.profile_picture",
                        trip_id: "$trip_id",
                        start_address: "$start_address",
                        finish_address: "$finish_address",
                        total: "$total",
                        created_at: "$created_at",
                        default_currency: "",
                    }
                }];
                if(requestParam.status == 'canceled'){
                    joinArr = [{
                        $match: columnAndValue
                    }, {
                        $sort: {created_at: -1}
                    }, {
                        $skip: skip
                    }, {
                        $limit: limit
                    }, {
                        $project: {
                            _id: 0,
                            name: "",
                            profile_picture: "",
                            trip_id: "$trip_id",
                            start_address: "$start_address",
                            finish_address: "$finish_address",
                            total: "$total",
                            created_at: "$created_at",
                            default_currency: "",
                        }
                    }];
                }
                let trips = await query.joinWithAnd(dbConstants.dbSchema.trips, joinArr);
                _.each(trips, (element) => {
                    element.default_currency = settings.default_currency
                    element.created_at = timeZone(new Date(element.created_at)).tz(requestParam.time_zone).format('lll')
                    element.profile_picture = element.profile_picture!='' ? config.aws.prefix + config.aws.s3.driverBucket + '/' + element.profile_picture : ''
                })
                resolve(trips);
                return;
            }
            else{
                let driver = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.user_id}, { _id: 0, driver_id: 1 } );
                if(!driver){
                    reject(errors.userNotFound(true, requestParam.code));
                    return;
                }
                let columnAndValue = {
                    driver_id: requestParam.user_id,
                    status: requestParam.status
                };
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
                    $match: columnAndValue
                }, {
                    $sort: {created_at: -1}
                }, {
                    $skip: skip
                }, {
                    $limit: limit
                }, {
                    $project: {
                        _id: 0,
                        name: "$cusDetails.name",
                        profile_picture: "$cusDetails.profile_picture",
                        trip_id: "$trip_id",
                        start_address: "$start_address",
                        finish_address: "$finish_address",
                        total: "$total",
                        created_at: "$created_at",
                        default_currency: "",
                    }
                }];
                let trips = await query.joinWithAnd(dbConstants.dbSchema.trips, joinArr);
                _.each(trips, (element) => {
                    element.default_currency = settings.default_currency
                    element.created_at = timeZone(new Date(element.created_at)).tz(requestParam.time_zone).format('lll')
                    element.profile_picture = element.profile_picture!='' ? config.aws.prefix + config.aws.s3.customerBucket + '/' + element.profile_picture : ''
                })
                resolve(trips);
                return;
            }
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Lost Item
    Purpose : Lost Item
    Original Author : Gaurav Patel
    Created At : 3rd Feb 2020
*/
const lostItem = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1, name:1, mobile_country_code:1, mobile:1 } );
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, { _id: 0, trip_id: 1, driver_id:1} );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }
            // FOR SMS
            let response = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: trip.driver_id}, { _id: 0, driver_id: 1, name:1, mobile_country_code:1, mobile:1, player_id:1 } );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let sms_template = await query.selectWithAndOne(dbConstants.dbSchema.sms_templates, {code:'LOST_ITEM'}, { _id: 0, value: 1} );
            if(sms_template){
                let msg = sms_template.value[requestParam.code]
                msg = msg.replace('#NAME#', response.name)
                msg = msg.replace('#CUS_NAME#', customer.name)
                msg = msg.replace('#MOBILE#', customer.mobile_country_code+' '+customer.mobile)
                sendSMS({ message: msg, mobile_country_code: response.mobile_country_code, mobile: response.mobile });
            }
            let template = await query.selectWithAndOne(dbConstants.dbSchema.push_templates, {code: 'LOST_ITEM'}, {_id: 0,value: 1, caption_value:1}, {created_at: 1});
            if(template){
                let msg  = template.value[requestParam.code];
                msg = msg.replace('#NAME#', response.name)
                msg = msg.replace('#CUS_NAME#', customer.name)
                msg = msg.replace('#MOBILE#', customer.mobile_country_code+' '+customer.mobile)
                notificationHandler.sendNotification({
                    message:msg,
                    type:'lost_item',
                    trip_id: requestParam.trip_id, 
                    player_ids:[response.player_id],
                    user_type:'driver'
                });
                notificationHandler.setLogs({
                    user_id:[response.driver_id],
                    user_type:'driver',
                    message: template.caption_value[requestParam.code], 
                    description:msg
                });
            }
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, {} );
            emailHandler.sendEmail({
                template_code:'LOST_ITEM',
                code: requestParam.code,
                trip_id: requestParam.trip_id,
                name: customer.name,
                mobile: customer.mobile_country_code+' '+customer.mobile,
                email: settings.support_email,
            });

            requestParam.driver_id = trip.driver_id
            await query.insertSingle(dbConstants.dbSchema.lost_items, requestParam);
            resolve({});
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Toll Charge
    Purpose : Toll Charge
    Original Author : Gaurav Patel
    Created At : 3rd Feb 2020
*/
const tollCharge = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let driver = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.driver_id}, { _id: 0, driver_id: 1 } );
            if(!driver){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, { _id: 0, trip_id: 1, total:1} );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }
            let total = trip.total + parseFloat(requestParam.toll_charge)
            await query.updateSingle(dbConstants.dbSchema.trips, {toll_charge:requestParam.toll_charge, total:total }, { trip_id: requestParam.trip_id });
            resolve({});
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Cleaning Charge
    Purpose : Cleaning Charge
    Original Author : Gaurav Patel
    Created At : 15th Feb 2020
*/
const cleaningCharge = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let driver = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.driver_id}, { _id: 0, driver_id: 1 } );
            if(!driver){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, { _id: 0, trip_id: 1, total:1} );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }
            let total = trip.total + parseFloat(requestParam.cleaning_charge)
            await query.updateSingle(dbConstants.dbSchema.trips, {cleaning_charge:requestParam.cleaning_charge, total:total }, { trip_id: requestParam.trip_id });
            resolve({});
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

module.exports = {
    book,
    assignDriverFirebase,
    ongoing,
    action,
    cancel,
    receipt,
    rating,
    history,
    dispute,
    lostItem,
    tollCharge,
    cleaningCharge
};