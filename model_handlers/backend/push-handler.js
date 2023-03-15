'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Push_template = require('./../../models/push-template');



const get = function(req,done){
	let columnAndValue={}
	if(req.query.push_template_id){
		columnAndValue.push_template_id = req.query.push_template_id;
        query.selectWithAndFilter(dbConstants.dbSchema.push_templates, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.push_templates);
                done(errors.internalServer(true), null);
                return;
            }
            response = response[0]
            response = JSON.parse(JSON.stringify(response));
            query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'}, {}, function(error, languages) {
                _.each(languages, (element, index, list) => {
                    response[element.code] = response.value[element.code];
                    response["cap_" + element.code] = response.caption_value[element.code];
                });
                done(null,response)
            });
        });
	}
    else{
    	query.selectWithAndFilter(dbConstants.dbSchema.push_templates, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.push_templates);
                done(errors.internalServer(true), null);
                return;
            }
            done(null,response)
        });
    }
};

const create = function(requestParam,done){
	let value = new Object();
    let caption_value = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function(error, languages) {
        _.each(languages, (element, index, list) => {
            value[element.code] = requestParam[element.code];
            caption_value[element.code] = requestParam["cap_" +element.code];
        });
        requestParam.value = value;
        requestParam.caption_value = caption_value;
        query.insertSingle(dbConstants.dbSchema.push_templates, requestParam, function(error, EmailTemplate) {
            if (error) {
                logger('Error: can not create push notification templates');
                done(error, null);
                return;
            }
            done(null, EmailTemplate);
        });
    });
};


const update = function(requestParam,done){
	let value = new Object();
    let caption_value = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function(error, languages) {
        _.each(languages, (element, index, list) => {
            value[element.code] = requestParam[element.code];
            caption_value[element.code] = requestParam["cap_" +element.code];
        });
        requestParam.value = value;
        requestParam.caption_value = caption_value;
        query.updateSingle(dbConstants.dbSchema.push_templates, requestParam, {
            'push_template_id': requestParam.push_template_id
        }, function(error, email) {
            if (error) {
                logger('Error: can not update push Notification');
                done(error, null);
                return;
            }
            done(null, email);
        });
    });
};


const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.push_templates, {
            'push_template_id': {
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
       query.updateMultiple(dbConstants.dbSchema.push_templates, columnsToUpdate, {
            'push_template_id': {
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