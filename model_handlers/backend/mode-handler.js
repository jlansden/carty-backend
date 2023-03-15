'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const mode = require('./../../models/mode');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.mode_id){
		columnAndValue.mode_id = req.query.mode_id
	}
    query.selectWithAndFilter(dbConstants.dbSchema.modes, columnAndValue, {
        _id: 0,
    }, {created_at:-1}, {}, (error, response) => {
        if (error) {
            logger('Error: can not get ', dbConstants.dbSchema.modes);
            done(errors.internalServer(true), null);
            return;
        }
        if(req.query.mode_id){
            response = response[0]
            response = JSON.parse(JSON.stringify(response));
            query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'}, {}, function(error, languages) {
                _.each(languages, (element, index, list) => {
                    response[element.code] = response.title[element.code];
                });
                done(null,response)
            });
        }
        else{
            _.each(response, (elem) => {
                elem.title = elem.title.EN
            })
            done(null, response)
        }
    });
};

const create = function(requestParam,done){
    let title = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function (error, languages) {
        _.each(languages, (element, index, list) => {
            title[element.code] = requestParam[element.code];
        });
        requestParam.title = title;
    	query.insertSingle(dbConstants.dbSchema.modes,requestParam,function (error, response) {
    		if (error) {
    			logger('Error: can not create mode');
    			done(error, null);
    			return;
    		}
    		done(null, response);
    	});
    });
};


const update = function(requestParam,done){
    let title = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function (error, languages) {
        _.each(languages, (element, index, list) => {
            title[element.code] = requestParam[element.code];
        });
        requestParam.title = title;
    	query.updateSingle(dbConstants.dbSchema.modes,requestParam, { 'mode_id':requestParam.mode_id},function (error, response) {
    		if (error) {
    			logger('Error: can not update mode');
    			done(error, null);
    			return;
    		}
    		done(null, response);
    	});
    });
};

const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.modes, {
            'mode_id': {
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
       query.updateMultiple(dbConstants.dbSchema.modes, columnsToUpdate, {
            'mode_id': {
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
	update
};