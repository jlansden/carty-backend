'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Language = require('./../../models/language');

/*
 * Used to get languages
 * @param {Function} done - Callback function with error, data params
 */
const get = function(req,done){
	let columnAndValue={}
	if(req.query.language_id){
		columnAndValue.language_id = req.query.language_id
	}
    if(req.query.status){
        columnAndValue.status = req.query.status
    }
	query.selectWithAndFilter(dbConstants.dbSchema.languages, columnAndValue, {
        _id: 0,
        language_id: 1,
        title: 1,
        code: 1,
        status: 1,
    }, {created_at:-1}, {}, (error, languages) => {
    	if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.languages);
            done(errors.internalServer(true), null);
            return;
        }
        done(null,languages)
    });
};

/*
 * Used to create language 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const create = function(requestParam,done){
	query.insertSingle(dbConstants.dbSchema.languages,requestParam,function (error, language) {
		if (error) {
			logger('Error: can not create language');
			done(error, null);
			return;
		}
		done(null, language);
	});
};


/*
 * Used to update language by id 
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
const update = function(requestParam,done){
	query.updateSingle(dbConstants.dbSchema.languages,requestParam, { 'language_id':requestParam.language_id},function (error, language) {
		if (error) {
			logger('Error: can not update language');
			done(error, null);
			return;
		}
		done(null, language);
	});
};

/*
 * Used to action update by id
 * @param {requestParam} - Object
 * @param {Function} done - Callback function with error, data params
 */
const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.languages, {
            'language_id': {
                $in: requestParam['ids']
            }
        }, function(error, data) {
            if (error) {
                logger('Error: can not delete ');
                done(error, null);
                return;
            }
            done(null, data);
        });        
    }
    else
    {
        let columnsToUpdate = {
            status: requestParam['type']
        };
       query.updateMultiple(dbConstants.dbSchema.languages, columnsToUpdate, {
            'language_id': {
                $in: requestParam['ids']
            }
        }, function(error, data) {
            if (error) {
                logger('Error: can not update ');
                done(error, null);
                return;
            }
            done(null, data);
        });  
    }
};


module.exports = {
	get,
	create,
	action,
	update,
};