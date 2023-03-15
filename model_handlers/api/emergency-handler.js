'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
let _ = require('underscore');
const commonHandler = require('./../../model_handlers/api/common-handler');

/*
    Name : List
    Purpose : List
    Original Author : Gaurav Patel
    Created At : 11th Dec 2020
*/
const list = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, { customer_id: requestParam.customer_id }, { _id: 0, customer_id: 1}, { created_at: -1 });
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let contacts = await query.selectWithAnd(dbConstants.dbSchema.emergency_contacts, { customer_id: requestParam.customer_id }, { _id: 0, contact_id:1, customer_id: 1, name: 1, profile_picture: 1, mobile_country_code:1, mobile:1 }, { created_at: -1 });
            _.each(contacts, (element) => {
                element.profile_picture = element.profile_picture!='' ? config.aws.prefix + config.aws.s3.customerBucket + '/' + element.profile_picture : ''
            });
            resolve(contacts)
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Add
    Purpose : Add
    Original Author : Gaurav Patel
    Created At : 11th Dec 2020
*/
const add = async(requestParam, req) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, { customer_id: requestParam.customer_id }, { _id: 0, customer_id: 1}, { created_at: -1 });
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            if(req.files){
                if(req.files.profile_picture){
                    requestParam.profile_picture = await new Promise((solve, reject) => {
                        commonHandler.uploadImage(req.files.profile_picture, 'customer', (error, path) => {
                            solve(path)
                        });
                    });
                }
            }
            await query.insertSingle(dbConstants.dbSchema.emergency_contacts, requestParam);
            resolve(list(requestParam))
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Add
    Purpose : Add
    Original Author : Gaurav Patel
    Created At : 11th Dec 2020
*/
const deleteContact = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, { customer_id: requestParam.customer_id }, { _id: 0, customer_id: 1}, { created_at: -1 });
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            await query.removeMultiple(dbConstants.dbSchema.emergency_contacts, {contact_id: requestParam.contact_id})
            resolve(list(requestParam))
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : edit
    Purpose : edit
    Original Author : Gaurav Patel
    Created At : 31st Mar 2021
*/
const edit = async(requestParam, req) => {
    return new Promise(async(resolve, reject) => {
        try {
            let customer = await query.selectWithAndOne(dbConstants.dbSchema.customers, { customer_id: requestParam.customer_id }, { _id: 0, customer_id: 1}, { created_at: -1 });
            if(!customer){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            if(req.files){
                if(req.files.profile_picture){
                    requestParam.profile_picture = await new Promise((solve, reject) => {
                        commonHandler.uploadImage(req.files.profile_picture, 'customer', (error, path) => {
                            solve(path)
                        });
                    });
                }
            }
            await query.updateSingle(dbConstants.dbSchema.emergency_contacts, requestParam, { contact_id: requestParam.contact_id });
            resolve(list(requestParam))
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

module.exports = {
    list,
    add,
    deleteContact,
    edit
};