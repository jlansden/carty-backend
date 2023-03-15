'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
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

/*
	Name : Send Email
	Purpose : Send Email
	Original Author : Pratik Balochiya
	Created At : 3rd Sept 2019
*/
const sendEmail = async(requestParams, done) => {
    return new Promise(async(resolve, reject) => {
        try {
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, {} );
            let template = await query.selectWithAndOne(dbConstants.dbSchema.email_templates, {code: requestParams.template_code}, {
                from_name: 1,
                from_email: 1,
                email_subject: 1,
                description: 1,
            });
            if (template) {
                let emailTemplate = template['description'][requestParams.code];

                emailTemplate = emailTemplate.replace('#FACEBOOK#', settings.fb_url);
                emailTemplate = emailTemplate.replace('#TWITTER#', settings.twitter_url);
                emailTemplate = emailTemplate.replace('#INSTAGRAM#', settings.instagram_url);
                emailTemplate = emailTemplate.replace('#LINKEDIN#', settings.linkedin_url);
                emailTemplate = emailTemplate.replace('#YOUTUBE#', settings.youtube_url);
                emailTemplate = emailTemplate.replace('#SUPPORT_EMAIL#', settings.support_email);
                emailTemplate = emailTemplate.replace('#ADDRESS#', settings.company_address);

                if (requestParams.template_code == 'CUS_SIGN_UP' || requestParams.template_code == 'DRI_SIGN_UP') {
                    emailTemplate = emailTemplate.replace('#NAME#', requestParams.name);
                    emailTemplate = emailTemplate.replace('#EMAIL#', requestParams.email);
                    emailTemplate = emailTemplate.replace('#MOBILE#', requestParams.mobile_country_code+' '+requestParams.mobile);
                }

                if (requestParams.template_code == 'DRI_ACC_VERIFIED') {
                    emailTemplate = emailTemplate.replace('#NAME#', requestParams.name);
                }

                if (requestParams.template_code == 'CUS_SHARE_TRIP') {
                    emailTemplate = emailTemplate.replace('#NAME#', requestParams.name);
                    emailTemplate = emailTemplate.replace('#SHARE_NAME#', requestParams.share_name);
                    emailTemplate = emailTemplate.replace('#TRIP_ID#', requestParams.trip_id);
                }

                if (requestParams.template_code == 'DRI_VEH_APPROVED') {
                    emailTemplate = emailTemplate.replace('#NAME#', requestParams.name);
                    emailTemplate = emailTemplate.replace('#VEHICLE_NAME#', requestParams.vehicle_name);
                    emailTemplate = emailTemplate.replace('#VEHICLE_MODEL#', requestParams.model);
                }

                if (requestParams.template_code == 'LOST_ITEM') {
                    emailTemplate = emailTemplate.replace('#NAME#', requestParams.name);
                    emailTemplate = emailTemplate.replace('#TRIP_ID#', requestParams.trip_id);
                    emailTemplate = emailTemplate.replace('#MOBILE#', requestParams.mobile);
                }

                let emailSubject = template.email_subject[requestParams.code];
                setupEmail({
                    to_email: [requestParams.email],
                    from_email: template.from_name + ' <' + template.from_email + '>',
                    subject: emailSubject,
                    description: emailTemplate
                });

                return false;
            } else {
                return false;
            }
        } catch (error) {
            console.log(error);
            return false;
        }
    });
};

module.exports = {
    sendEmail,
    setupEmail
};