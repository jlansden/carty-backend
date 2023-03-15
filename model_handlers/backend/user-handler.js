'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const config = require('./../../config');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const User = require('./../../models/user');
const commonHandler = require('./../../model_handlers/backend/common-handler');
const passwordHandler = require('./../../utils/password');

const get = function(req,done){
	let columnAndValue={}
	if(req.query.user_id){
        columnAndValue.user_id = req.query.user_id;
        query.selectWithAndFilter(dbConstants.dbSchema.users, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.users);
                done(errors.internalServer(true), null);
                return;
            }
            if(req.query.status){
                done(null,response)
            }
            else{
                response = response[0]
                if(response.profile_picture!=''){
                    response.profile_picture = config.aws.prefix + config.aws.s3.userBucket + '/' + response.profile_picture;
                }
                done(null,response)
            }
        });
	}
    else{
    	query.selectWithAndFilter(dbConstants.dbSchema.users, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.users);
                done(errors.internalServer(true), null);
                return;
            }
            done(null,response)
        });
    }
};

const create = async function(requestParam, req, done){
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
    query.selectWithAndOne(dbConstants.dbSchema.users, compareColumnAndValues, {
        user_id: 1
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
            commonHandler.uploadImage(req.files.profile_picture, 'user', (error, path) => {
                resolve(path)
            });
        });
        let encryptPassword = await passwordHandler.encrypt(requestParam.password.toString());
        requestParam.password = encryptPassword;
        query.insertSingle(dbConstants.dbSchema.users, requestParam, function(error, user) {
            if (error) {
                logger('Error: can not create user');
                done(error, null);
                return;
            }
            done(null, user);
        });
    });
};

const update = function(requestParam, req, done){
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
            user_id: {
                $ne: requestParam.user_id
            }
        }]

    };
    query.selectWithAndOne(dbConstants.dbSchema.users, compareColumnAndValues, {
        user_id: 1,
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
            query.selectWithAndOne(dbConstants.dbSchema.users, {
                user_id: requestParam.user_id
            }, {
                user_id: 1,
                profile_picture: 1,
            }, async(error, user) => {
                let fileObjects = [];
                if(requestParam.change_logo){
                    fileObjects.push({
                        Key: 'justherrideshare/users/' + /[^/]*$/.exec(user.profile_picture)[0]
                    })
                }
                commonHandler.removeMultipleImages(fileObjects, async(error, path) => {
                    requestParam.profile_picture = await new Promise((resolve, reject) => {
                        commonHandler.uploadImage(req.files.profile_picture, 'user', (error, path) => {
                            resolve(path)
                        });
                    });
                    query.updateSingle(dbConstants.dbSchema.users, requestParam, {
                        'user_id': requestParam.user_id
                    }, function(error, user) {
                        if (error) {
                            logger('Error: can not update push Notification');
                            done(error, null);
                            return;
                        }
                        updatedGetUser(requestParam.user_id, done)
                        //done(null, user);
                    });
                });
            });
        }
        else{
            delete requestParam.profile_picture
            query.updateSingle(dbConstants.dbSchema.users, requestParam, {
                'user_id': requestParam.user_id
            }, function(error, user) {
                if (error) {
                    logger('Error: can not update push Notification');
                    done(error, null);
                    return;
                }
                updatedGetUser(requestParam.user_id, done)
                //done(null, user);
            });
        }
    });
};

const updatedGetUser = (user_id, done) => {
    query.selectWithAndOne(dbConstants.dbSchema.users, {user_id: user_id}, {
        user_id: 1,
        name:1,
        email:1,
        profile_picture:1,
    }, async (error, response) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if(response.profile_picture!=''){
            response.profile_picture = config.aws.prefix + config.aws.s3.userBucket + '/' + response.profile_picture
        }
        done(null, response);
        return;
    });
};


const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.selectWithAnd(dbConstants.dbSchema.users, {
            user_id: {
                $in: requestParam.ids
            }
        }, {
            _id: 0,
            user_id: 1,
            profile_picture: 1,
        }, (error, user) => {
            let fileObjects = [];
            for (var i = 0; i < user.length; i++) {
                fileObjects.push({
                    Key: 'justherrideshare/users/' + /[^/]*$/.exec(user[i].profile_picture)[0]
                })
            }
            commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                query.removeMultiple(dbConstants.dbSchema.users, {
                    'user_id': {
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
       query.updateMultiple(dbConstants.dbSchema.users, columnsToUpdate, {
            'user_id': {
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