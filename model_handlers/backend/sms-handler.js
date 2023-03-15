'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Sms_template = require('./../../models/sms-template');



const get = function(req,done){
	let columnAndValue={}
	if(req.query.sms_template_id){
		columnAndValue.sms_template_id = req.query.sms_template_id;
        query.selectWithAndFilter(dbConstants.dbSchema.sms_templates, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.sms_templates);
                done(errors.internalServer(true), null);
                return;
            }
            response = response[0]
            response = JSON.parse(JSON.stringify(response));
            query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'}, {}, function(error, languages) {
                _.each(languages, (element, index, list) => {
                    response[element.code] = response.value[element.code];
                });
                done(null,response)
            });
        });
	}
    else{
    	query.selectWithAndFilter(dbConstants.dbSchema.sms_templates, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.sms_templates);
                done(errors.internalServer(true), null);
                return;
            }
            done(null,response)
        });
    }
};

const create = function(requestParam,done){
	let value = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function(error, languages) {
        _.each(languages, (element, index, list) => {
            value[element.code] = requestParam[element.code];
        });
        requestParam.value = value;
        query.insertSingle(dbConstants.dbSchema.sms_templates, requestParam, function(error, EmailTemplate) {
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
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function(error, languages) {
        _.each(languages, (element, index, list) => {
            value[element.code] = requestParam[element.code];
        });
        requestParam.value = value;
        query.updateSingle(dbConstants.dbSchema.sms_templates, requestParam, {
            'sms_template_id': requestParam.sms_template_id
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
        query.removeMultiple(dbConstants.dbSchema.sms_templates, {
            'sms_template_id': {
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
       query.updateMultiple(dbConstants.dbSchema.sms_templates, columnsToUpdate, {
            'sms_template_id': {
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