'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Email_template = require('./../../models/email-template');



const get = function(req,done){
	let columnAndValue={}
	if(req.query.emailtemplate_id){
		columnAndValue.emailtemplate_id = req.query.emailtemplate_id;
        query.selectWithAndFilter(dbConstants.dbSchema.email_templates, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.email_templates);
                done(errors.internalServer(true), null);
                return;
            }
            let chart = {};
            response = response[0]
            response = JSON.parse(JSON.stringify(response));
            query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'}, {}, function(error, languages) {
                _.each(languages, (element, index, list) => {
                    response[element.code] = response.description[element.code];
                    chart[element.code] = response.description[element.code];
                    response["sub_" + element.code] = response.email_subject[element.code];
                });
                response.chart = chart;
                done(null,response)
            });
        });
	}
    else{
    	query.selectWithAndFilter(dbConstants.dbSchema.email_templates, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.email_templates);
                done(errors.internalServer(true), null);
                return;
            }
            done(null,response)
        });
    }
};

const create = function(requestParam,done){
	let description = new Object();
    let email_subject = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function(error, languages) {
        _.each(languages, (element, index, list) => {
            description[element.code] = requestParam[element.code];
            email_subject[element.code] = requestParam["sub_" +element.code];
        });
        requestParam.description = description;
        requestParam.email_subject = email_subject;
        query.insertSingle(dbConstants.dbSchema.email_templates, requestParam, function(error, EmailTemplate) {
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
	let description = new Object();
    let email_subject = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function(error, languages) {
        _.each(languages, (element, index, list) => {
            description[element.code] = requestParam[element.code];
            email_subject[element.code] = requestParam["sub_" +element.code];
        });
        requestParam.description = description;
        requestParam.email_subject = email_subject;
        query.updateSingle(dbConstants.dbSchema.email_templates, requestParam, {
            'emailtemplate_id': requestParam.emailtemplate_id
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
        query.removeMultiple(dbConstants.dbSchema.email_templates, {
            'emailtemplate_id': {
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
       query.updateMultiple(dbConstants.dbSchema.email_templates, columnsToUpdate, {
            'emailtemplate_id': {
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