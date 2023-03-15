'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const config = require('./../../config');
const query = require('./../../utils/query-creator');
const customer = require('./../../models/customer');
let async = require('async');
let _ = require('underscore');
let moment = require('moment');
const commonHandler = require('./../../model_handlers/backend/common-handler');
const emailHandler = require('./../../model_handlers/api/email-handler');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.customer_id){
        columnAndValue.customer_id = req.query.customer_id;
        query.selectWithAndFilter(dbConstants.dbSchema.customers, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.customers);
                done(errors.internalServer(true), null);
                return;
            }
            if(req.query.status){
                done(null,response)
            }
            else{
                response = response[0]
                if(response.profile_picture!=''){
                    response.profile_picture = config.aws.prefix + config.aws.s3.customerBucket + '/' + response.profile_picture;
                }
                done(null,response)
            }
        });
	}
    else{
    	query.selectWithAndFilter(dbConstants.dbSchema.customers, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.customers);
                done(errors.internalServer(true), null);
                return;
            }
            done(null,response)
        });
    }
};

const create = async function(requestParam, req, done){
    requestParam.dob = moment(new Date(requestParam.dob)).format('YYYY-MM-DD')
    requestParam.email = requestParam.email.trim();
    let regexEmail = new RegExp(['^', requestParam.email, '$'].join(''), 'i');
    let compareColumnAndValues = {
        $or: [{
            email: regexEmail
        }, {
            mobile: requestParam.mobile,
            mobile_country_code: requestParam.mobile_country_code,
        }]
    };
    query.selectWithAndOne(dbConstants.dbSchema.customers, compareColumnAndValues, {
        customer_id: 1
    }, async(error, exists) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if (exists) {
            done(errors.duplicateUser(true), null);
            return;
        }
    	requestParam.profile_picture = await new Promise((resolve, reject) => {
            commonHandler.uploadImage(req.files.profile_picture, 'customer', (error, path) => {
                resolve(path)
            });
        });
        query.insertSingle(dbConstants.dbSchema.customers, requestParam, function(error, user) {
            if (error) {
                logger('Error: can not create user');
                done(error, null);
                return;
            }
            requestParam.template_code = 'CUS_SIGN_UP';
            requestParam.code = 'EN';
            emailHandler.sendEmail(requestParam);
            done(null, user);
        });
    });
};

const update = function(requestParam, req, done){
    requestParam.dob = moment(new Date(requestParam.dob)).format('YYYY-MM-DD');
    requestParam.email = requestParam.email.trim();
    let regexEmail = new RegExp(['^', requestParam.email, '$'].join(''), 'i');
    let compareColumnAndValues = {
        $and: [{
            $or: [{
                email: regexEmail
            }, {
                mobile: requestParam.mobile,
                mobile_country_code: requestParam.mobile_country_code,
            }]
        }, {
            customer_id: {
                $ne: requestParam.customer_id
            }
        }]

    };
    query.selectWithAndOne(dbConstants.dbSchema.customers, compareColumnAndValues, {
        customer_id: 1,
    }, async(error, exists) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if (exists) {
            done(errors.duplicateUser(true), null);
            return;
        }
    	if (requestParam.change_logo) {
            query.selectWithAndOne(dbConstants.dbSchema.customers, {
                customer_id: requestParam.customer_id
            }, {
                customer_id: 1,
                profile_picture: 1,
            }, async(error, user) => {
                let fileObjects = [];
                if(requestParam.change_logo){
                    fileObjects.push({
                        Key: 'justherrideshare/customers/' + /[^/]*$/.exec(user.profile_picture)[0]
                    })
                }
                commonHandler.removeMultipleImages(fileObjects, async(error, path) => {
                    requestParam.profile_picture = await new Promise((resolve, reject) => {
                        commonHandler.uploadImage(req.files.profile_picture, 'customer', (error, path) => {
                            resolve(path)
                        });
                    });
                    query.updateSingle(dbConstants.dbSchema.customers, requestParam, {
                        'customer_id': requestParam.customer_id
                    }, function(error, user) {
                        if (error) {
                            logger('Error: can not update push Notification');
                            done(error, null);
                            return;
                        }
                        done(null, user);
                    });
                });
            });
        }
        else{
            delete requestParam.profile_picture
            query.updateSingle(dbConstants.dbSchema.customers, requestParam, {
                'customer_id': requestParam.customer_id
            }, function(error, user) {
                if (error) {
                    logger('Error: can not update push Notification');
                    done(error, null);
                    return;
                }
                done(null, user);
            });
        }
    });
};

const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.selectWithAnd(dbConstants.dbSchema.customers, {
            customer_id: {
                $in: requestParam.ids
            }
        }, {
            _id: 0,
            customer_id: 1,
            profile_picture: 1,
        }, (error, user) => {
            let fileObjects = [];
            for (var i = 0; i < user.length; i++) {
                fileObjects.push({
                    Key: 'justherrideshare/customers/' + /[^/]*$/.exec(user[i].profile_picture)[0]
                })
            }
            commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                query.removeMultiple(dbConstants.dbSchema.customers, {
                    'customer_id': {
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
            });
        });        
    }
    else
    {
        let columnsToUpdate = {
            status: requestParam['type']
        };
       query.updateMultiple(dbConstants.dbSchema.customers, columnsToUpdate, {
            'customer_id': {
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

const profile = (req, done) => {
    query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: req.query.customer_id}, {
        _id: 0,
        customer_id: 1,
        name: 1,
        email: 1,
        mobile_country_code: 1,
        mobile: 1,
        player_id: 1,
        profile_picture:1,
        gender:1,
        addresses:1,
    }, async(error, response) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if (!response) {
            done(errors.resourceNotFound(true), null);
            return;
        }
        if(response.profile_picture!=''){
            response.profile_picture = config.aws.prefix + config.aws.s3.customerBucket + '/' + response.profile_picture;
        }
        done(null, response)
    });
};

module.exports = {
	get,
	create,
	action,
	update,
    profile
};