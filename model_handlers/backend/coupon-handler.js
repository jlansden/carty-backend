'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
let moment = require('moment');
const Coupon = require('./../../models/coupon');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.coupon_id || req.query.status){
		if(req.query.coupon_id){
            columnAndValue.coupon_id = req.query.coupon_id
        }
        if(req.query.status){
            columnAndValue.status = req.query.status
        }
        query.selectWithAndFilter(dbConstants.dbSchema.coupons, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.coupons);
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
    	query.selectWithAndFilter(dbConstants.dbSchema.coupons, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.coupons);
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
    requestParam.start_date = moment(new Date(requestParam.start_date)).format('YYYY-MM-DD')
    requestParam.end_date = moment(new Date(requestParam.end_date)).format('YYYY-MM-DD')
	let title = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function(error, languages) {
        _.each(languages, (element, index, list) => {
            title[element.code] = requestParam[element.code];
        });
        requestParam.title = title;
        query.insertSingle(dbConstants.dbSchema.coupons, requestParam, function(error, EmailTemplate) {
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
    requestParam.start_date = moment(new Date(requestParam.start_date)).format('YYYY-MM-DD')
    requestParam.end_date = moment(new Date(requestParam.end_date)).format('YYYY-MM-DD')
	let title = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function(error, languages) {
        _.each(languages, (element, index, list) => {
            title[element.code] = requestParam[element.code];
        });
        requestParam.title = title;
        query.updateSingle(dbConstants.dbSchema.coupons, requestParam, {
            'coupon_id': requestParam.coupon_id
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
        query.removeMultiple(dbConstants.dbSchema.coupons, {
            'coupon_id': {
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
       query.updateMultiple(dbConstants.dbSchema.coupons, columnsToUpdate, {
            'coupon_id': {
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