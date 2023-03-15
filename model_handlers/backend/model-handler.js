'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const model = require('./../../models/model');

const get = function(req,done){
	let columnAndValue={}
    if(req.query.model_id){
    	columnAndValue.model_id = req.query.model_id
        query.selectWithAndFilter(dbConstants.dbSchema.models, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.models);
                done(errors.internalServer(true), null);
                return;
            }
            response = response[0]
            response = JSON.parse(JSON.stringify(response));
            query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'}, {}, function(error, languages) {
                _.each(languages, (element, index, list) => {
                    response[element.code] = response.title[element.code];
                });
                done(null,response)
            });
        });
    }
    else{
        let joinArr = [{
            $lookup: {
                from: 'makes',
                localField: 'make_id',
                foreignField: 'make_id',
                as: 'makeDetails'
            }
        },  {
            $unwind: "$makeDetails"
        },  { 
            $match : columnAndValue
        }, { 
            $sort : {created_at:-1}
        }, {
            $project: {
                _id: 0,
                model_id: "$model_id",
                make: "$makeDetails.title.EN",
                title: "$title.EN",
                status: "$status",
            }
        }];
        query.joinWithAnd(dbConstants.dbSchema.models, joinArr, (error, response) => {
            if (error) {
                logger('Error: can not get record.');
                done(errors.internalServer(true), null);
                return;
            }
            done(null, response)
        });
    }
};

const create = function(requestParam,done){
    let title = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function (error, languages) {
        _.each(languages, (element, index, list) => {
            title[element.code] = requestParam[element.code];
        });
        requestParam.title = title;
    	query.insertSingle(dbConstants.dbSchema.models,requestParam,function (error, response) {
    		if (error) {
    			logger('Error: can not create model');
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
    	query.updateSingle(dbConstants.dbSchema.models,requestParam, { 'model_id':requestParam.model_id},function (error, response) {
    		if (error) {
    			logger('Error: can not update model');
    			done(error, null);
    			return;
    		}
    		done(null, response);
    	});
    });
};

const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.models, {
            'model_id': {
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
       query.updateMultiple(dbConstants.dbSchema.models, columnsToUpdate, {
            'model_id': {
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