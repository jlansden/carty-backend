'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const languages = require('./../../models/language');
let async = require('async');
let _ = require('underscore');
const language = require('./../../models/language');

/*
	Name : List
	Purpose : List
	Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const list = async() => {
    return new Promise(async(resolve, reject) => {
        try {
            let languages = await query.selectWithAnd(dbConstants.dbSchema.languages, { status: 'active' }, { _id: 0, language_id: 1, title: 1, code: 1 }, { created_at: 1 });
            resolve(languages)
            return;
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

module.exports = {
    list,
};