'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const CMS = require('./../../models/cms');
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
            let cms = await query.selectWithAnd(dbConstants.dbSchema.cms, { type: requestParam.type }, { _id: 0, cms_id: 1, title: 1, code:1, link: 1, type:1, description:1 }, { created_at: 1 });
            cms = JSON.parse(JSON.stringify(cms));
            _.each(cms, (element, index, list) => {
                element['title'] = element.title[requestParam.code] || '';
                element['description'] = element.code == 'LEGAL' ? element.description[requestParam.code] : '';
                //element['link'] = config.cms.link_path + element.link[requestParam.code];
                element['link'] = config.aws.prefix + config.aws.s3.userBucket + '/' + element.link[requestParam.code];
            });

            resolve(cms)
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