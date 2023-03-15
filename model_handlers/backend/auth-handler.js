'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const config = require('./../../config');
const passwordHandler = require('./../../utils/password');
const User = require('./../../models/user');
const AWS = require('aws-sdk');
AWS.config.update({
    accessKeyId: config.aws.keyId,
    secretAccessKey: config.aws.key,
    region: config.aws.sesRegion
});
const ses = new AWS.SES({apiVersion: '2010-12-01'});

const setupEmail = async(requestParam) => {
    const params = {
        Destination: {
            ToAddresses: requestParam.to_email
        },
        Message: {
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: requestParam.description
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: requestParam.subject
            }
        },
        ReturnPath: requestParam.from_email,
        Source: requestParam.from_email,
    };

    ses.sendEmail(params, (err, data) => {
        if (err) {
            return console.log(err, err.stack);
        } else {
            console.log("Email sent.", data);
        }
    });
};

const login = function(requestParam, done){
	query.selectWithAndOne(dbConstants.dbSchema.users, {email: requestParam.email}, {
        user_id: 1,
        password:1,
        name:1,
        mobile_country_code:1,
        mobile:1,
        profile_picture:1,
        status:1
    }, async (error, response) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if (!response) {
            done(errors.resourceNotFound(true), null);
            return;
        }
        if (response.status == 'inactive') {
            done(errors.duplicateUser(true), null);
            return;
        }
        let encryptPassword = await passwordHandler.encrypt(requestParam.password.toString());
        if(encryptPassword != response.password){
            done(errors.invalidPassword(true), null);
            return;
        }
        if(response.profile_picture!=''){
            response.profile_picture = config.aws.prefix + config.aws.s3.userBucket + '/' + response.profile_picture
        }
        done(null, response);
        return;
    });
};

const forgot = function(requestParam, done){
    query.selectWithAndOne(dbConstants.dbSchema.users, {email: requestParam.email}, {
        user_id: 1,
        name:1,
        status:1
    }, async (error, response) => {
        if (error) {
            done(errors.internalServer(true));
            return;
        }
        if (!response) {
            done(errors.resourceNotFound(true), null);
            return;
        }
        if (response.status == 'inactive') {
            done(errors.duplicateUser(true), null);
            return;
        }
        query.selectWithAndOne(dbConstants.dbSchema.settings, {}, {}, async (error, settings) => {
            const code = 'USE'+Math.round((Math.pow(36, 6 + 1) - Math.random() * Math.pow(36, 6))).toString(36).slice(1);
            query.selectWithAndOne(dbConstants.dbSchema.email_templates, {
                code: 'ADMIN_FPWD',
            }, {}, (error, template) => {
                if (error) {
                    done(errors.internalServer(true), null);
                    return;
                }

                if (!template) {
                    done(errors.resourceNotFound(true), null);
                    return;
                }
                let emailTemplate = (template.description['EN']);
                emailTemplate = emailTemplate.replace("#NAME#", response.name);
                emailTemplate = emailTemplate.replace("#LINK#", requestParam.link+'/#/reset?code='+code);

                emailTemplate = emailTemplate.replace('#FACEBOOK#', settings ? settings.fb_url : '')
                emailTemplate = emailTemplate.replace('#TWITTER#', settings ? settings.twitter_url : '')
                emailTemplate = emailTemplate.replace('#INSTAGRAM#', settings ? settings.instagram_url : '')
                emailTemplate = emailTemplate.replace('#LINKEDIN#', settings ? settings.linkedin_url : '')
                emailTemplate = emailTemplate.replace('#YOUTUBE#', settings ? settings.youtube_url : '')
                emailTemplate = emailTemplate.replace('#SUPPORT_EMAIL#', settings ? settings.support_email : '')
                emailTemplate = emailTemplate.replace('#ADDRESS#', settings ? settings.company_address : '')
                setupEmail({
                    to_email: [requestParam.email],
                    from_email: template.from_name + ' <' + template.from_email + '>',
                    subject: template.email_subject['EN'],
                    description: emailTemplate
                });
                query.updateSingle(dbConstants.dbSchema.users, {reset_code:code}, {
                    user_id: response.user_id
                }, (error) => {
                    done(null, response);
                    return;
                });
            })
        });
    });
};

const reset = async function(requestParam, done) {
    let subId = requestParam.code.substring(0, 3);
    let encryptPassword = await passwordHandler.encrypt(requestParam.password.toString());
    let columnAndValuesUpdate = {
        reset_code: '',
        password: encryptPassword
    }
    query.selectWithAndOne(dbConstants.dbSchema.users, {
        reset_code: requestParam.code
    }, {
        user_id: 1,
        _id: 0
    }, function(error, user) {
        if (!user) {
            done(errors.resourceNotFound(true), null);
            return;
        } else {
            query.updateSingle(dbConstants.dbSchema.users, columnAndValuesUpdate, {
                user_id: user.user_id
            }, function(error, updateConsumer) {
                if (error) {
                    done(errors.resourceNotFound(true), null);
                    return;
                } else {
                    done(null, {});
                }
            });
        }
    }); 
};

module.exports = {
	login,
    forgot,
    reset
};