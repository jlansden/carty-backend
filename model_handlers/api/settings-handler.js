'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const setting = require('./../../models/settings');
let async = require('async');
let _ = require('underscore');

/*
	 Name : List
    Purpose : List
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const list = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, __v:0, settings_id:0}, {});
            resolve(settings)
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

module.exports = {
    list,
};