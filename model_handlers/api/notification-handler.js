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
const Notification_log = require('./../../models/notification-log');
const OneSignal = require('onesignal-node');    

/*
	Name : Assign Notification
	Purpose : Assign Notification
	Original Author : Gaurav Patel
	Created At : 20th Aug 2020
*/
const sendNotification = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            const notification = {
                contents: {
                    'en': requestParam.message,
                },
                data: {
                    type:requestParam.type,
                    trip_id:requestParam.trip_id
                },
                include_player_ids: requestParam.player_ids,
            };
            try {
                let app_id = config.onesignal_customer.app_id;
                let api_key = config.onesignal_customer.api_key;
                if(requestParam.user_type == 'driver'){
                    app_id = config.onesignal_driver.app_id;
                    api_key = config.onesignal_driver.api_key;
                }
                const client = new OneSignal.Client(app_id, api_key);
                const response = await client.createNotification(notification);
                console.log("success")
                console.log(response.body);
                return false;
            } catch (e) {
                if (e instanceof OneSignal.HTTPError) {
                    console.log("err")
                    console.log(e.statusCode);
                    console.log(e.body);
                    return false;
                }
            }
        } catch (error) {
            console.log(error)
            return false;
        }
    })
};

/*
    Name : Assign Notification
    Purpose : Assign Notification
    Original Author : Gaurav Patel
    Created At : 2nd Dec 2020
*/
const setLogs = async(requestParam) => {
    console.log("setLogs")
    console.log(requestParam)
    return new Promise(async(resolve, reject) => {
        try {
            asyncLoop.forEachSeries(requestParam.user_id, async function(rec, Callback_s1) {
                let obj = {
                    user_type: requestParam.user_type,
                    user_id: rec,
                    message: requestParam.message,
                    description: requestParam.description
                };
                await query.insertSingle(dbConstants.dbSchema.notification_logs, obj);
                Callback_s1();
            },function(){
                return false;
            });
        } catch (error) {
            console.log(error)
            return false;
        }
    })
};

/*
    Name : List
    Purpose : List
    Original Author : Gaurav Patel
    Created At : 4th Dec 2020
*/
const list = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let noti = await query.selectWithAnd(dbConstants.dbSchema.notification_logs, { user_id: requestParam.user_id }, { _id: 0, user_id: 1, message: 1, description:1, created_at: 1}, { created_at: 1 });
            noti = JSON.parse(JSON.stringify(noti));
            _.each(noti, (element, index, list) => {
                element['created_at'] = timeZone(new Date(element.created_at)).tz(requestParam.time_zone).format('ll');
            });

            resolve(noti)
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Delete
    Purpose : Delete
    Original Author : Gaurav Patel
    Created At : 4th Dec 2020
*/
const deleteNoti = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            await query.removeMultiple(dbConstants.dbSchema.notification_logs, {user_id: {$in:[requestParam.user_id]}})
            resolve({})
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

module.exports = {
    sendNotification,
    setLogs,
    list,
    deleteNoti
};