'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const help_category = require('./../../models/help-category');
const moment = require('moment');
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
            let categories = await query.selectWithAnd(dbConstants.dbSchema.help_categories, { status: 'active', type: requestParam.type }, { _id: 0, help_category_id: 1, title: 1, type: 1 }, { created_at: 1 });
            categories = JSON.parse(JSON.stringify(categories));
            _.each(categories, (element, index, list) => {
                element['title'] = element.title[requestParam.code] || '';
            });

            resolve(categories)
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

module.exports = {
    list
};