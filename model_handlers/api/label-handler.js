'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const { generateRandom } = require('./../../utils/id-generator');
const label = require('./../../models/language-label');
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
            let labels = await query.selectWithAnd(dbConstants.dbSchema.language_labels, { status: 'active', type: requestParam.type }, { _id: 0, label_id: 1, code: 1, value: 1 }, { created_at: 1 });
            labels = JSON.parse(JSON.stringify(labels));
            _.each(labels, (element, index, list) => {
                labels[index]['value'] = element.value[requestParam.code] || '';
            });

            resolve(labels)
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