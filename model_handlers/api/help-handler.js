'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const help = require('./../../models/help');
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
            let category = await query.selectWithAndOne(dbConstants.dbSchema.help_categories, { help_category_id: requestParam.help_category_id }, { _id: 0, help_category_id: 1, title: 1, type: 1 }, { created_at: 1 });
            if(!category){
                reject(errors.helpCategoryNotFound(true, requestParam.code));
                return;
            }
            let help = await query.selectWithAnd(dbConstants.dbSchema.helps, { help_category_id: requestParam.help_category_id, status:'active' }, { _id: 0, help_id: 1, question:1, link:1 }, { created_at: 1 });
            help = JSON.parse(JSON.stringify(help));
            _.each(help, (element, index, list) => {
                element['question'] = element.question[requestParam.code] || '';
                element['link'] = config.aws.prefix + config.aws.s3.helpBucket + '/' + element.link[requestParam.code];
            });
            resolve(help)
            return;
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

module.exports = {
    list
};