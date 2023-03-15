'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Help_Category = require('./../../models/help-category');



const get = function(req,done){
	let columnAndValue={}
    if(req.query.help_category_id || req.query.status){
    	if(req.query.help_category_id){
    		columnAndValue.help_category_id = req.query.help_category_id
    	}
        if(req.query.status){
            columnAndValue.status = req.query.status
        }
    	query.selectWithAndFilter(dbConstants.dbSchema.help_categories, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.help_categories);
                done(errors.internalServer(true), null);
                return;
            }
            if(req.query.status){
                done(null,response)
            }
            else{
                response = response[0]
                response = JSON.parse(JSON.stringify(response));
                query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'}, {}, function(error, languages) {
                    _.each(languages, (element, index, list) => {
                        response[element.code] = response.title[element.code];
                    });
                    done(null,response)
                });
            }
        });
    }
    else{
        query.selectWithAndFilter(dbConstants.dbSchema.help_categories, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.help_categories);
                done(errors.internalServer(true), null);
                return;
            }
            _.each(response, (elem) => {
                elem.title = elem.title.EN
            })
            done(null,response)
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
        query.insertSingle(dbConstants.dbSchema.help_categories,requestParam,function (error, category) {
            if (error) {
                logger('Error: can not create category');
                done(error, null);
                return;
            }
            done(null, category);
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
        query.updateSingle(dbConstants.dbSchema.help_categories,requestParam, { 'help_category_id':requestParam.help_category_id},function (error, category) {
            if (error) {
                logger('Error: can not update category');
                done(error, null);
                return;
            }
            done(null, category);
        });
    });
};


const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.help_categories, {
            'help_category_id': {
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
        query.updateMultiple(dbConstants.dbSchema.help_categories, columnsToUpdate, {
            'help_category_id': {
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