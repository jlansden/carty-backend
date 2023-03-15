'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const year = require('./../../models/year');

/*
 * Used to get years
 * @param {Function} done - Callback function with error, data params
 */
const get = function(req,done){
	let columnAndValue={}
	if(req.query.year_id){
		columnAndValue.year_id = req.query.year_id
	}
    if(req.query.status){
        columnAndValue.status = req.query.status
    }
	query.selectWithAndFilter(dbConstants.dbSchema.years, columnAndValue, {
        _id: 0,
    }, {created_at:-1}, {}, (error, years) => {
    	if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.years);
            done(errors.internalServer(true), null);
            return;
        }
        done(null,years)
    });
};

/*
 * Used to create language 
 * @param {requestParam} - request parameters from body
 * @param {Function} done - Callback function with error, data params
 */
const create = function(requestParam,done){
	query.insertSingle(dbConstants.dbSchema.years,requestParam,function (error, language) {
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
	query.updateSingle(dbConstants.dbSchema.years,requestParam, { 'year_id':requestParam.year_id},function (error, language) {
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
        query.removeMultiple(dbConstants.dbSchema.years, {
            'year_id': {
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
       query.updateMultiple(dbConstants.dbSchema.years, columnsToUpdate, {
            'year_id': {
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