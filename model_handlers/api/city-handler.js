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
    Created At : 1st march 2021
*/
const list = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let match = {status:'active'};
            if(requestParam.state_id){
                match.state_id = requestParam.state_id
            }
            let city = await query.selectWithAnd(dbConstants.dbSchema.cities, match, { _id: 0, city_id:1, title:1}, {});
            resolve(city)
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