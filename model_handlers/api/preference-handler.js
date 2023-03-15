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
            let modes = await query.selectWithAnd(dbConstants.dbSchema.modes, { status: 'active'}, { _id: 0, mode_id: 1, title: 1 }, { created_at: 1 });
            modes = JSON.parse(JSON.stringify(modes));
            _.each(modes, (element, index, list) => {
                modes[index]['title'] = element.title[requestParam.code] || '';
            });

            let musics = await query.selectWithAnd(dbConstants.dbSchema.musics, { status: 'active'}, { _id: 0, music_id: 1, title: 1 }, { created_at: 1 });
            musics = JSON.parse(JSON.stringify(musics));
            _.each(musics, (element, index, list) => {
                musics[index]['title'] = element.title[requestParam.code] || '';
            });
            
            let accessibles = await query.selectWithAnd(dbConstants.dbSchema.accessibles, { status: 'active'}, { _id: 0, accessible_id: 1, title: 1 }, { created_at: 1 });
            accessibles = JSON.parse(JSON.stringify(accessibles));
            _.each(accessibles, (element, index, list) => {
                accessibles[index]['title'] = element.title[requestParam.code] || '';
            });

            resolve({modes, musics, accessibles})
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