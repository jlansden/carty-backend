'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const moment = require('moment');
const timeZone = require('moment-timezone');
let asyncLoop = require('async');
let _ = require('underscore');
const idGenerator = require('./../../utils/id-generator');
const notificationHandler = require('./../../model_handlers/api/notification-handler');
const { sendSMS } = require('./../../utils/sms-manager');
const emailHandler = require('./../../model_handlers/api/email-handler');

/*
    Name : Manage Address
    Purpose : Manage Address
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const address = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, { customer_id: requestParam.customer_id }, { _id: 0, addresses: 1}, { created_at: 1 });
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            if(requestParam.action=='get'){
                resolve(customer.addresses)
                return;
            }
            else if(requestParam.action=='add'){
                let addresses = customer.addresses;
                let alreadyExists = 0;
                _.each(addresses, (element) => {
                    if(requestParam.address_type.toLowerCase() != 'other'){
                        if(element.type.toLowerCase() == requestParam.address_type.toLowerCase()){
                            alreadyExists++;
                            element.title = requestParam.title
                            element.address = requestParam.address
                            element.type = requestParam.address_type
                            element.latitude = parseFloat(requestParam.latitude)
                            element.longitude = parseFloat(requestParam.longitude)
                        }
                    }
                });
                // if(alreadyExists > 0){
                //     reject(errors.addressTypeAlreadyExists(true, requestParam.code));
                //     return;
                // }
                idGenerator.generateId('customers', 'address_id', 'ADD', async (err, ID) => {
                    if(alreadyExists == 0){
                        addresses.push({
                            address_id:ID,
                            title:requestParam.title,
                            type:requestParam.address_type,
                            address:requestParam.address,
                            latitude:parseFloat(requestParam.latitude),
                            longitude:parseFloat(requestParam.longitude)
                        })
                    }
                    await query.updateSingle(dbConstants.dbSchema.customers, { addresses: addresses }, { customer_id: requestParam.customer_id });
                    resolve(addresses)
                    return;
                });
            }
            else if(requestParam.action=='edit'){
                let addresses = customer.addresses;

                let alreadyExists = 0;
                _.each(addresses, (element) => {
                    if(element.type.toLowerCase() == requestParam.address_type.toLowerCase() && element.address_id != requestParam.address_id ){
                        alreadyExists++;
                    }
                });
                if(alreadyExists > 0){
                    reject(errors.addressTypeAlreadyExists(true, requestParam.code));
                    return;
                }

                _.each(addresses, (element) => {
                    if(element.address_id == requestParam.address_id){
                        element.address = requestParam.address
                        element.title = requestParam.title
                        element.type = requestParam.address_type
                        element.latitude = parseFloat(requestParam.latitude)
                        element.longitude = parseFloat(requestParam.longitude)
                    }
                });
                await query.updateSingle(dbConstants.dbSchema.customers, { addresses: addresses }, { customer_id: requestParam.customer_id });
                resolve(addresses)
                return;
            }
            else if(requestParam.action=='delete'){
                let addresses = [];
                _.each(customer.addresses, (element) => {
                    if(element.address_id != requestParam.address_id){
                        addresses.push(element)
                    }
                });
                await query.updateSingle(dbConstants.dbSchema.customers, { addresses: addresses }, { customer_id: requestParam.customer_id });
                resolve(addresses)
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
    Name : rate Trip
    Purpose : rate Trip
    Original Author : Gaurav Patel
    Created At : 10th Dec 2020
*/
const rateTheTrip = async(requestParam) => {
    let limit = 50;
    let page = requestParam.page - 1;
    let skip = page * limit;
    return new Promise(async(resolve, reject) => {
        try {
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, default_currency: 1 } );
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1 } );
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let columnAndValue = {
                customer_id: requestParam.customer_id,
                status:'completed',
                customer_to_driver_rating: {$eq: 0}
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
                    customer_to_driver_rating: "$customer_to_driver_rating",
                    default_currency: "",
                }
            }];
            let trips = await query.joinWithAnd(dbConstants.dbSchema.trips, joinArr);
            _.each(trips, (element) => {
                element.default_currency = settings.default_currency
                element.created_at = timeZone(new Date(element.created_at)).tz(requestParam.time_zone).format('lll')
                element.profile_picture = element.profile_picture!='' ? config.aws.prefix + config.aws.s3.driverBucket + '/' + element.profile_picture : ''
            })
            resolve(trips);
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : cancel trip
    Purpose : cancel trip
    Original Author : Gaurav Patel
    Created At : 13th Jan 2021
*/
const cancelTrip = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1, card_id:1, stripe_profile_id:1, email:1 } );
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, { _id: 0, trip_id: 1, status:1, card_id:1, fare_info:1, driver_id:1 } );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }
            if(trip.status == 'accepted' || trip.status == 'pickedup'){
                let stripeRes = await (new Promise(async(resolve1, reject1) => {
                    let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, is_payment_live: 1} );
                    let stripe = require("stripe")(settings.is_payment_live ? config.stripeInfo.live_key : config.stripeInfo.test_key);
                    if(!trip.fare_info.cancellation_fare){
                        trip.fare_info.cancellation_fare = 0
                    }
                    let chargeAmount = Math.round(parseFloat(trip.fare_info.cancellation_fare) * 100).toFixed(2);
                    stripe.charges.create({
                        amount: parseFloat(chargeAmount),
                        currency: "usd",
                        source: trip.card_id,
                        customer: customer.stripe_profile_id,
                        description: customer.email,
                    }, async function(err, charge) {
                        if(err){
                            reject(errors.stripeError(true, err.message,requestParam.code));
                            return;
                        }
                        resolve1(charge)
                    })
                }));
                await query.updateSingle(dbConstants.dbSchema.trips, { status:'canceled', cancel_charge_id: stripeRes.id}, { trip_id: requestParam.trip_id });
            }
            else{
                await query.updateSingle(dbConstants.dbSchema.trips, { status:'canceled' }, { trip_id: requestParam.trip_id });
            }
            await config.firebase.tripsRef.child(requestParam.trip_id).update({
                status: 'cancel_customer',
                driver_id:trip.driver_id
            });
            await config.firebase.assignTripsRef.child(trip.driver_id).update({
                status: 'cancel_customer',
                trip_id: requestParam.trip_id,
            });
            resolve({});
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Sync Contact
    Purpose : Sync Contact
    Original Author : Gaurav Patel
    Created At : 28th Jan 2021
*/
const syncContact = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1 } );
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let users = await query.selectWithAnd(dbConstants.dbSchema.customers, {mobile: {$in:requestParam.contacts.split(',')}}, { _id: 0, customer_id: 1, name:1, email:1, profile_picture:1, mobile:1, mobile_country_code:1 } );
            _.each(users, (element) => {
                element.profile_picture = element.profile_picture!='' ? config.aws.prefix + config.aws.s3.customerBucket + '/' + element.profile_picture : ''
            })
            resolve(users);
            return;
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

/*
    Name : Share Trip
    Purpose : Share Trip
    Original Author : Gaurav Patel
    Created At : 28th Jan 2021
*/
const shareTrip = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let ids = requestParam.share_ids.split(',');
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1, name:1 } );
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let trip = await query.selectWithAndOne(dbConstants.dbSchema.trips, {trip_id: requestParam.trip_id}, { _id: 0, trip_id: 1 } );
            if(!trip){
                reject(errors.tripNotFound(true, requestParam.code));
                return;
            }
            requestParam.share_ids = requestParam.share_ids.split(',');
            let share_trip = await query.selectWithAndOne(dbConstants.dbSchema.share_trips, {trip_id: requestParam.trip_id}, { _id: 0, trip_id: 1, share_ids:1 } );
            if(!share_trip){
                await query.insertSingle(dbConstants.dbSchema.share_trips, requestParam);
            }
            else{
                let share_ids = share_trip.share_ids;
                share_ids.push(requestParam.share_ids);
                share_ids = _.uniq(_.flatten(share_ids));
                await query.updateSingle(dbConstants.dbSchema.share_trips, { share_ids: share_ids}, { trip_id: requestParam.trip_id });
            }
            let customers = await query.selectWithAnd(dbConstants.dbSchema.customers, {customer_id: {$in:ids}}, { _id: 0, customer_id: 1, player_id:1 } );
            let template = await query.selectWithAndOne(dbConstants.dbSchema.push_templates, {code: 'CUS_SHARE_TRIP'}, {_id: 0,value: 1, caption_value:1}, {created_at: 1});
            if(template){
                let msg  = template.value[requestParam.code];
                msg = msg.replace('#NAME#', customer.name)
                msg = msg.replace('#TRIP_ID#', requestParam.trip_id)
                notificationHandler.sendNotification({
                    message:msg,
                    type:'share_trip',
                    trip_id: requestParam.trip_id, 
                    player_ids:_.pluck(customers, 'player_id'),
                    user_type:'customer'
                });
                notificationHandler.setLogs({
                    user_id:_.pluck(customers, 'customer_id'),
                    user_type:'customer',
                    message: template.caption_value[requestParam.code], 
                    description:msg
                });
            }
            sendShareSMS({ids: ids, name:customer.name, trip_id:requestParam.trip_id, code:requestParam.code});
            resolve({});
            return;
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

/*
    Name : send SMS while share trip
    Purpose : send SMS while share trip
    Original Author : Gaurav Patel
    Created At : 29th Jan 2021
*/
const sendShareSMS = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customers = await query.selectWithAnd(dbConstants.dbSchema.customers, {customer_id: {$in:requestParam.ids}}, { _id: 0, name: 1, email:1, mobile:1, mobile_country_code:1 } );
            let sms_template = await query.selectWithAndOne(dbConstants.dbSchema.sms_templates, {code: 'CUS_SHARE_TRIP'}, {_id: 0,value: 1}, {created_at: 1});
            if(sms_template){
                let msg  = sms_template.value[requestParam.code];
                msg = msg.replace('#NAME#', requestParam.name);
                msg = msg.replace('#TRIP_ID#', requestParam.trip_id);
                asyncLoop.forEachSeries(customers, async function(singleRec, Callback_s1) {
                    sendSMS({ message: msg, mobile_country_code: singleRec.mobile_country_code, mobile: singleRec.mobile });
                    emailHandler.sendEmail({
                        template_code: 'CUS_SHARE_TRIP',
                        name: singleRec.name,
                        share_name: requestParam.name,
                        trip_id: requestParam.trip_id,
                        code: requestParam.code,
                        email: singleRec.email
                    })
                    Callback_s1()
                },function(){
                    return false;
                });
            }
            else{
                asyncLoop.forEachSeries(customers, async function(singleRec, Callback_s1) {
                    emailHandler.sendEmail({
                        template_code: 'CUS_SHARE_TRIP',
                        name: singleRec.name,
                        share_name: requestParam.name,
                        trip_id: requestParam.trip_id,
                        code: requestParam.code,
                        email: singleRec.email
                    })
                    Callback_s1()
                },function(){
                    return false;
                });
            }
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

/*
    Name : get Share Trip
    Purpose : get Share Trip
    Original Author : Gaurav Patel
    Created At : 28th Jan 2021
*/
const getSharedTrip = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1 } );
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let joinArr = [{
                $lookup: {
                    from: 'trips',
                    localField: 'trip_id',
                    foreignField: 'trip_id',
                    as: 'tripDetails'
                }
            }, {
                $unwind: "$tripDetails"
            }, {
                $lookup: {
                    from: 'customers',
                    localField: 'customer_id',
                    foreignField: 'customer_id',
                    as: 'cusDetails'
                }
            }, {
                $unwind: "$cusDetails"
            }, {
                $match: {share_ids: {$in:[requestParam.customer_id]}}
            }, {
                $sort: {created_at: -1}
            }, {
                $project: {
                    _id: 0,
                    trip_id: "$trip_id",
                    customer_id: "$customer_id",
                    name: "$cusDetails.name",
                    mobile: "$cusDetails.mobile",
                    mobile_country_code: "$cusDetails.mobile_country_code",
                    profile_picture: "$cusDetails.profile_picture",
                    start_address: "$tripDetails.start_address",
                    start_latitude: "$tripDetails.start_latitude",
                    start_longitude: "$tripDetails.start_longitude",
                    finish_address: "$tripDetails.finish_address",
                    finish_latitude: "$tripDetails.finish_latitude",
                    finish_longitude: "$tripDetails.finish_longitude",
                }
            }];
            let trips = await query.joinWithAnd(dbConstants.dbSchema.share_trips, joinArr);
            _.each(trips, (element) => {
                element.profile_picture = element.profile_picture!='' ? config.aws.prefix + config.aws.s3.customerBucket + '/' + element.profile_picture : ''
            })
            resolve(trips);
            return;
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

module.exports = {
    address,
    rateTheTrip,
    cancelTrip,
    syncContact,
    shareTrip,
    getSharedTrip
};