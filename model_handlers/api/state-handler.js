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
            let states = await query.selectWithAnd(dbConstants.dbSchema.states, {status:'active'}, { _id: 0, state_id:1, title:1}, {});
            resolve(states)
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