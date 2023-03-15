'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
let async = require('async');
let _ = require('underscore');

/*
	 Name : List
    Purpose : List
    Original Author : Gaurav Patel
    Created At : 22nd APR 2021
*/
const list = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let match = {status:'active'};
            let years = await query.selectWithAnd(dbConstants.dbSchema.years, match, { _id: 0, year_id:1, title:1}, {created: -1});
            years = years.sort((a, b) => b.title - a.title)
            resolve(years)
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