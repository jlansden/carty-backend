'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const passwordHandler = require('./../../utils/password');
let async = require('async');
let _ = require('underscore');
const commonHandler = require('./../../model_handlers/api/common-handler');
const emailHandler = require('./../../model_handlers/api/email-handler');
const { sendSMS } = require('./../../utils/sms-manager');
const Verify_mobile = require('./../../models/verify-mobile');
const Sms_template = require('./../../models/sms-template');
const Customer = require('./../../models/customer');
const Driver = require('./../../models/driver');
const Emergency_contact = require('./../../models/emergency-contact');
const Share_trip = require('./../../models/share-trip');
const State = require('./../../models/state');
const City = require('./../../models/city');


/*
    Name : Sign In customer
    Purpose : Sign In customer
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const signInCustomer = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let columnAndValues = {}
            if(requestParam.email){
                columnAndValues.email = requestParam.email
            }
            else{
                columnAndValues.mobile = requestParam.mobile;
                columnAndValues.mobile_country_code = requestParam.mobile_country_code;
            }
            
            let response = await query.selectWithAndOne(dbConstants.dbSchema.customers, columnAndValues, { _id: 0, customer_id: 1, name: 1, status: 1 } );
            if(!response){
                if(requestParam.email){
                    reject(errors.emailNotFound(true, requestParam.code));
                    return;
                }
                else{
                    reject(errors.mobileNotFound(true, requestParam.code));
                    return;
                }
            }

            if(response.status == 'inactive'){
                reject(errors.notActivate(true, requestParam.code));
                return;   
            }
            let otp = Math.floor(1000 + Math.random() * 9000);
            let template = await query.selectWithAndOne(dbConstants.dbSchema.sms_templates, {code:'OTP'}, { _id: 0, value: 1} );
            if(template){
                let msg = template.value[requestParam.code]
                msg = msg.replace('#NAME#', response.name)
                msg = msg.replace('#OTP#', otp)
                sendSMS({ message: msg, mobile_country_code: requestParam.mobile_country_code, mobile: requestParam.mobile });
            }
            let obj = {
                otp: otp
            }
            if(requestParam.player_id){
                obj.player_id =  requestParam.player_id
            }
            if(requestParam.device_name){
                obj.device_name =  requestParam.device_name
            }
            if(requestParam.device_type){
                obj.device_type =  requestParam.device_type
            }
            await query.updateSingle(dbConstants.dbSchema.customers, obj, columnAndValues);
            resolve({otp:otp, customer_id: response.customer_id});
            return;
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

/*
    Name : Sign In driver
    Purpose : Sign In driver
    Original Author : Gaurav Patel
    Created At : 29th Sep 2020
*/
const signInDriver = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let columnAndValues = {}
            if(requestParam.email){
                columnAndValues.email = requestParam.email
            }
            else{
                columnAndValues.mobile = requestParam.mobile;
                columnAndValues.mobile_country_code = requestParam.mobile_country_code;
            }
            
            let response = await query.selectWithAndOne(dbConstants.dbSchema.drivers, columnAndValues, { _id: 0, driver_id: 1, name: 1, status: 1 } );
            if(!response){
                if(requestParam.email){
                    reject(errors.emailNotFound(true, requestParam.code));
                    return;
                }
                else{
                    reject(errors.mobileNotFound(true, requestParam.code));
                    return;
                }
            }

            if(response.status == 'inactive'){
                reject(errors.notActivate(true, requestParam.code));
                return;   
            }
            let otp = Math.floor(1000 + Math.random() * 9000);
            let template = await query.selectWithAndOne(dbConstants.dbSchema.sms_templates, {code:'OTP'}, { _id: 0, value: 1} );
            if(template){
                let msg = template.value[requestParam.code]
                msg = msg.replace('#NAME#', response.name)
                msg = msg.replace('#OTP#', otp)
                sendSMS({ message: msg, mobile_country_code: requestParam.mobile_country_code, mobile: requestParam.mobile });
            }
            let obj = {
                otp: otp
            }
            if(requestParam.player_id){
                obj.player_id =  requestParam.player_id
            }
            if(requestParam.device_name){
                obj.device_name =  requestParam.device_name
            }
            if(requestParam.device_type){
                obj.device_type =  requestParam.device_type
            }
            await query.updateSingle(dbConstants.dbSchema.drivers, obj, columnAndValues);
            resolve({otp:otp, driver_id: response.driver_id});
            return;
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

/*
    Name : Sign up customer
    Purpose : Sign up customer
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const signUpCustomer = async(requestParam, req) => {
    return new Promise(async(resolve, reject) => {
        try {
            requestParam.email = requestParam.email.trim();
            requestParam.email = requestParam.email.toLowerCase();
            let columnAndValues = {}, insertColumnAndValues = { state_id: requestParam.state_id, city_id: requestParam.city_id, name: requestParam.name, email: requestParam.email, mobile_country_code: requestParam.mobile_country_code, mobile: requestParam.mobile, gender: requestParam.gender};
            columnAndValues = {
                $or: [{
                    email: (new RegExp(['^', requestParam.email.trim(), '$'].join(''), 'i'))
                }, {
                    mobile: requestParam.mobile,
                    mobile_country_code: requestParam.mobile_country_code
                }]
            }

            let response = await query.selectWithAndOne(dbConstants.dbSchema.customers, columnAndValues, { customer_id: 1, social_id: 1, register_type: 1, name: 1, email: 1, mobile_country_code: 1, mobile: 1 } );
            if(response){
                if(requestParam.email && requestParam.email!=''){
                    if(response.email == requestParam.email){
                        reject(errors.emailAlreadyExist(true, requestParam.code));
                        return;
                    }
                }
                if(requestParam.mobile_country_code && requestParam.mobile){
                    if(response.mobile_country_code == requestParam.mobile_country_code && response.mobile == requestParam.mobile){
                        reject(errors.mobileAlreadyExist(true, requestParam.code));
                        return;
                    }
                }
            }
            if(req.files){
                if(req.files.profile_picture){
                    insertColumnAndValues.profile_picture = await new Promise((solve, reject) => {
                        commonHandler.uploadImage(req.files.profile_picture, 'customer', (error, path) => {
                            solve(path)
                        });
                    });
                }
            }
            insertColumnAndValues.player_id = requestParam.player_id ? requestParam.player_id : '';
            insertColumnAndValues.device_type = requestParam.device_type ? requestParam.device_type : '';
            insertColumnAndValues.device_name = requestParam.device_name ? requestParam.device_name : '';
            let accessibles = await query.selectWithAndOne(dbConstants.dbSchema.accessibles, {'title.EN':'Toddler Car Seat', status:'active'}, { accessible_id: 1, title: 1});
            if(accessibles){
                insertColumnAndValues.preferences = {
                    mode_id:'',
                    music_id:'',
                    accessible_id:accessibles.accessible_id,
                    temperature:'',
                }
            }
            let userInfo = await query.insertSingle(dbConstants.dbSchema.customers, insertColumnAndValues);
            requestParam.template_code = 'CUS_SIGN_UP';
            emailHandler.sendEmail(requestParam);
            resolve(profileCustomer({ customer_id: userInfo.customer_id }, requestParam.code));
            return;
        } catch (error) {
            console.log(error);
            reject(error)
            return
        }
    })
};

/*
    Name : Sign up driver
    Purpose : Sign up driver
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const signUpDriver = async(requestParam, req) => {
    return new Promise(async(resolve, reject) => {
        try {
            if(!requestParam.password){
                requestParam.password = ''
            }
            requestParam.email = requestParam.email.trim();
            requestParam.email = requestParam.email.toLowerCase();
            let columnAndValues = {}, insertColumnAndValues = { state_id: requestParam.state_id, city_id: requestParam.city_id, name: requestParam.name, email: requestParam.email, mobile_country_code: requestParam.mobile_country_code, mobile: requestParam.mobile, city: requestParam.city, gender:requestParam.gender};
            columnAndValues = {
                $or: [{
                    email: (new RegExp(['^', requestParam.email.trim(), '$'].join(''), 'i'))
                }, {
                    mobile: requestParam.mobile,
                    mobile_country_code: requestParam.mobile_country_code
                }]
            }

            let response = await query.selectWithAndOne(dbConstants.dbSchema.drivers, columnAndValues, { driver_id: 1, social_id: 1, register_type: 1, name: 1, email: 1, mobile_country_code: 1, mobile: 1 } );
            if(response){
                if(requestParam.email && requestParam.email!=''){
                    if(response.email == requestParam.email){
                        reject(errors.emailAlreadyExist(true, requestParam.code));
                        return;
                    }
                }
                if(requestParam.mobile_country_code && requestParam.mobile){
                    if(response.mobile_country_code == requestParam.mobile_country_code && response.mobile == requestParam.mobile){
                        reject(errors.mobileAlreadyExist(true, requestParam.code));
                        return;
                    }
                }
            }
            if(req.files){
                if(req.files.profile_picture){
                    insertColumnAndValues.profile_picture = await new Promise((solve, reject) => {
                        commonHandler.uploadImage(req.files.profile_picture, 'driver', (error, path) => {
                            solve(path)
                        });
                    });
                    insertColumnAndValues.is_profile_picture = true
                }
            }
            insertColumnAndValues.player_id = requestParam.player_id ? requestParam.player_id : '';
            insertColumnAndValues.device_type = requestParam.device_type ? requestParam.device_type : '';
            insertColumnAndValues.device_name = requestParam.device_name ? requestParam.device_name : '';
            let userInfo = await query.insertSingle(dbConstants.dbSchema.drivers, insertColumnAndValues);
            requestParam.template_code = 'DRI_SIGN_UP';
            emailHandler.sendEmail(requestParam);
            resolve(profileDriver({ driver_id: userInfo.driver_id }, requestParam.code));
            return;
        } catch (error) {
            console.log(error);
            reject(error)
            return
        }
    })
};

/*
    Name : Check Email Mobile customer
    Purpose : Check Email Mobile customer
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const checkEmailMobileExists = async(requestParam, done) => {
    return new Promise(async(resolve, reject) => {
        try {
            let columnAndValues;
            if(requestParam.email){
                columnAndValues = {
                    $or: [{
                        email: (new RegExp(['^', requestParam.email.trim(), '$'].join(''), 'i'))
                    }, {
                        mobile: requestParam.mobile,
                        mobile_country_code: requestParam.mobile_country_code
                    }]
                }
            }
            else{
                columnAndValues = {
                    mobile: requestParam.mobile,
                    mobile_country_code: requestParam.mobile_country_code
                }
            }
            let db = requestParam.user_type == 'customer' ? dbConstants.dbSchema.customers : dbConstants.dbSchema.drivers;
            let response = await query.selectWithAndOne(db, columnAndValues, { name: 1, email: 1, mobile_country_code: 1, mobile: 1 } );
            if(response){
                if(requestParam.email && requestParam.email!=''){
                    if(response.email == requestParam.email){
                        reject(errors.emailAlreadyExist(true, requestParam.code));
                        return;
                    }
                }
                if(requestParam.mobile_country_code && requestParam.mobile){
                    if(response.mobile_country_code == requestParam.mobile_country_code && response.mobile == requestParam.mobile){
                        reject(errors.mobileAlreadyExist(true, requestParam.code));
                        return;
                    }
                }
            }
            else{
                let otp = Math.floor(1000 + Math.random() * 9000);
                let template = await query.selectWithAndOne(dbConstants.dbSchema.sms_templates, {code:'OTP'}, { _id: 0, value: 1} );
                if(template){
                    let msg = template.value[requestParam.code]
                    msg = msg.replace('#NAME#', requestParam.name)
                    msg = msg.replace('#OTP#', otp)
                    sendSMS({ message: msg, mobile_country_code: requestParam.mobile_country_code, mobile: requestParam.mobile });
                }
                requestParam.otp = otp;
                let verify = await query.insertSingle(dbConstants.dbSchema.verify_mobiles, requestParam);
                resolve({verify_mobile_id: verify.verify_mobile_id, otp:otp});
                return
            }
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

/*
    Name : Verify Mobile
    Purpose : Verify Mobile
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const verifyMobile = async(requestParam, done) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.verify_mobiles, {verify_mobile_id:requestParam.verify_mobile_id}, { verify_mobile_id: 1, otp: 1 } );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            else{
                if(response.otp == requestParam.otp){
                    await query.removeMultiple(dbConstants.dbSchema.verify_mobiles, {verify_mobile_id: requestParam.verify_mobile_id})
                    resolve({})
                    return;
                }
                else{
                    reject(errors.invalidOTP(true, requestParam.code));
                    return;
                }
            }
        } catch (error) {
            console.log(error)
            reject(error)
            return
        }
    })
};

/*
    Name : Resend OTP
    Purpose : Resend OTP
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const resendOtpUsingMobileVerify = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.verify_mobiles, {verify_mobile_id: requestParam.verify_mobile_id}, { _id: 0, mobile_country_code:1, mobile:1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let otp = Math.floor(1000 + Math.random() * 9000);
            let template = await query.selectWithAndOne(dbConstants.dbSchema.sms_templates, {code:'OTP'}, { _id: 0, value: 1} );
            if(template){
                let msg = template.value[requestParam.code]
                msg = msg.replace('#NAME#', requestParam.name)
                msg = msg.replace('#OTP#', otp)
                sendSMS({ message: msg, mobile_country_code: response.mobile_country_code, mobile: response.mobile });
            }
            await query.updateSingle(dbConstants.dbSchema.verify_mobiles, {otp:otp}, { verify_mobile_id: requestParam.verify_mobile_id });
            resolve({otp:otp});
            return
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Get profile customer
    Purpose : Get profile customer
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const profileCustomer = async(columnAndValues, code) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.customers, columnAndValues, { _id: 0, customer_id: 1, name: 1, email: 1, mobile_country_code: 1, mobile: 1, status: 1, profile_picture:1, gender:1, preferences:1, is_push:1, is_email:1, state_id:1, city_id:1} );
            if(!response){
                reject(errors.userNotFound(true, code));
                return;
            }

            if(response.status == 'inactive'){
                reject(errors.notActivate(true, code));
                return;
            }
            if(response.profile_picture!=''){
                response.profile_picture = config.aws.prefix + config.aws.s3.customerBucket + '/' + response.profile_picture
            }

            let state = await query.selectWithAndOne(dbConstants.dbSchema.states, {state_id: response.state_id}, { _id: 0, state_id:1, title:1} );
            let city = await query.selectWithAndOne(dbConstants.dbSchema.cities, {city_id: response.city_id}, { _id: 0, city_id:1, title:1} );
            response = JSON.parse(JSON.stringify(response));
            response.state_name = state ? state.title : ''
            response.city_name = city ? city.title : ''
            
            resolve(response)
            return
        } catch (error) {
            console.log(error);
            reject(error)
            return
        }
    })
};

/*
    Name : Get profile driver
    Purpose : Get profile driver
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const profileDriver = async(columnAndValues, code) => {
    return new Promise(async(resolve, reject) => {
        try {
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, { _id: 0, default_currency:1 } );
            let response = await query.selectWithAndOne(dbConstants.dbSchema.drivers, columnAndValues, { 
                _id: 0, 
                driver_id: 1, 
                name: 1, 
                email: 1, 
                mobile_country_code: 1, 
                mobile: 1, 
                status: 1, 
                profile_picture:1, 
                driving_licence:1, 
                vehicle_insurance:1, 
                vehicle_registration:1, 
                certificate_of_completion:1, 
                availability_status:1, 
                city:1,
                is_profile_picture:1,
                is_driving_licence:1,
                is_vehicle_insurance:1,
                is_vehicle_registration:1,
                is_certificate_of_completion:1,
                is_legal_aggrement:1,
                is_verified:1,
                gender:1,
                is_push:1, 
                is_email:1,
                state_id:1,
                city_id:1,
            } );
            if(!response){
                reject(errors.userNotFound(true, code));
                return;
            }

            if(response.status == 'inactive'){
                reject(errors.notActivate(true, code));
                return;
            }
            if(response.profile_picture!=''){
                response.profile_picture = config.aws.prefix + config.aws.s3.driverBucket + '/' + response.profile_picture
            }
            if(response.driving_licence!=''){
                response.driving_licence = config.aws.prefix + config.aws.s3.driverBucket + '/' + response.driving_licence
            }
            if(response.vehicle_insurance!=''){
                response.vehicle_insurance = config.aws.prefix + config.aws.s3.driverBucket + '/' + response.vehicle_insurance
            }
            if(response.vehicle_registration!=''){
                response.vehicle_registration = config.aws.prefix + config.aws.s3.driverBucket + '/' + response.vehicle_registration
            }
            if(response.certificate_of_completion!=''){
                response.certificate_of_completion = config.aws.prefix + config.aws.s3.driverBucket + '/' + response.certificate_of_completion
            }
            response = JSON.parse(JSON.stringify(response))

            let state = await query.selectWithAndOne(dbConstants.dbSchema.states, {state_id: response.state_id}, { _id: 0, state_id:1, title:1} );
            let city = await query.selectWithAndOne(dbConstants.dbSchema.cities, {city_id: response.city_id}, { _id: 0, city_id:1, title:1} );
            response.state_name = state ? state.title : ''
            response.city_name = city ? city.title : ''

            response.default_currency = settings.default_currency;
            resolve(response)
            return
        } catch (error) {
            console.log(error);
            reject(error)
            return
        }
    })
};

/*
    Name : Update profile
    Purpose : Update profile
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const updateProfileCustomer = async(requestParam, req) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.customers, {customer_id: requestParam.customer_id}, { _id: 0, customer_id: 1, email:1, profile_picture:1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            if(requestParam.email){
                requestParam.email = requestParam.email.trim();
                let regexEmail = new RegExp(['^', requestParam.email, '$'].join(''), 'i');
                let compareColumnAndValues = {
                    $and: [{
                        $or: [{
                            email: regexEmail
                        }]
                    }, {
                        customer_id: {
                            $ne: requestParam.customer_id
                        }
                    }]

                };
                let exists = await query.selectWithAndOne(dbConstants.dbSchema.customers, compareColumnAndValues, { _id: 0, customer_id: 1, email:1, profile_picture:1} );
                if(exists){
                    reject(errors.emailAlreadyExist(true, requestParam.code));
                    return;
                }
            }
            if(req.files){
                if(req.files.profile_picture){
                    let fileObjects = [{
                        Key: 'justherrideshare/customers/' + /[^/]*$/.exec(response.profile_picture)[0]
                    }];
                    requestParam.profile_picture = await new Promise((solve, reject) => {
                        commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                            commonHandler.uploadImage(req.files.profile_picture, 'customer', (error, path) => {
                                solve(path)
                            });
                        });
                    });
                }
            }
            if(requestParam.mode_id || requestParam.music_id || requestParam.accessible_id || requestParam.temperature){
                requestParam.preferences = {
                    mode_id: requestParam.mode_id || '',
                    music_id: requestParam.music_id || '',
                    accessible_id: requestParam.accessible_id || '',
                    temperature: requestParam.temperature || '',
                }
            }
            await query.updateSingle(dbConstants.dbSchema.customers, requestParam, { customer_id: requestParam.customer_id });
            resolve(profileCustomer({ customer_id: requestParam.customer_id }, requestParam.code));
            return
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Update profile
    Purpose : Update profile
    Original Author : Gaurav Patel
    Created At : 29th Sep 2020
*/
const updateProfileDriver = async(requestParam, req) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.driver_id}, { _id: 0, driver_id: 1, email:1, profile_picture:1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            if(requestParam.email){
                requestParam.email = requestParam.email.trim();
                let regexEmail = new RegExp(['^', requestParam.email, '$'].join(''), 'i');
                let compareColumnAndValues = {
                    $and: [{
                        $or: [{
                            email: regexEmail
                        }]
                    }, {
                        driver_id: {
                            $ne: requestParam.driver_id
                        }
                    }]

                };
                let exists = await query.selectWithAndOne(dbConstants.dbSchema.drivers, compareColumnAndValues, { _id: 0, driver_id: 1, email:1, profile_picture:1} );
                if(exists){
                    reject(errors.emailAlreadyExist(true, requestParam.code));
                    return;
                }
            }
            if(req.files){
                if(req.files.profile_picture){
                    let fileObjects = [{
                        Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(response.profile_picture)[0]
                    }];
                    requestParam.profile_picture = await new Promise((solve, reject) => {
                        commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                            commonHandler.uploadImage(req.files.profile_picture, 'driver', (error, path) => {
                                solve(path)
                            });
                        });
                    });
                    requestParam.is_profile_picture = true
                }
            }
            await query.updateSingle(dbConstants.dbSchema.drivers, requestParam, { driver_id: requestParam.driver_id });
            resolve(profileDriver({ driver_id: requestParam.driver_id }, requestParam.code));
            return
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Account Setup
    Purpose : Account Setup
    Original Author : Gaurav Patel
    Created At : 27th Nov 2020
*/
const accountSetup = async(requestParam, req) => {
    return new Promise(async(resolve, reject) => {
        try {
            let response = await query.selectWithAndOne(dbConstants.dbSchema.drivers, {driver_id: requestParam.driver_id}, { _id: 0, driver_id: 1, email:1, profile_picture:1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            if(req.files){
                if(req.files.profile_picture){
                    let fileObjects = [{
                        Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(response.profile_picture)[0]
                    }];
                    requestParam.profile_picture = await new Promise((solve, reject) => {
                        commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                            commonHandler.uploadImage(req.files.profile_picture, 'driver', (error, path) => {
                                solve(path)
                            });
                        });
                    });
                    requestParam.is_profile_picture = true
                }
                if(req.files.driving_licence){
                    let fileObjects = [{
                        Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(response.driving_licence)[0]
                    }];
                    requestParam.driving_licence = await new Promise((solve, reject) => {
                        commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                            commonHandler.uploadImage(req.files.driving_licence, 'driver', (error, path) => {
                                solve(path)
                            });
                        });
                    });
                    requestParam.is_driving_licence = true
                }
                if(req.files.vehicle_insurance){
                    let fileObjects = [{
                        Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(response.vehicle_insurance)[0]
                    }];
                    requestParam.vehicle_insurance = await new Promise((solve, reject) => {
                        commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                            commonHandler.uploadImage(req.files.vehicle_insurance, 'driver', (error, path) => {
                                solve(path)
                            });
                        });
                    });
                    requestParam.is_vehicle_insurance = true
                }
                if(req.files.vehicle_registration){
                    let fileObjects = [{
                        Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(response.vehicle_registration)[0]
                    }];
                    requestParam.vehicle_registration = await new Promise((solve, reject) => {
                        commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                            commonHandler.uploadImage(req.files.vehicle_registration, 'driver', (error, path) => {
                                solve(path)
                            });
                        });
                    });
                    requestParam.is_vehicle_registration = true
                }
                if(req.files.certificate_of_completion){
                    let fileObjects = [{
                        Key: 'justherrideshare/drivers/' + /[^/]*$/.exec(response.certificate_of_completion)[0]
                    }];
                    requestParam.certificate_of_completion = await new Promise((solve, reject) => {
                        commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                            commonHandler.uploadImage(req.files.certificate_of_completion, 'driver', (error, path) => {
                                solve(path)
                            });
                        });
                    });
                    requestParam.is_certificate_of_completion = true
                }
            }
            await query.updateSingle(dbConstants.dbSchema.drivers, requestParam, { driver_id: requestParam.driver_id });
            resolve(profileDriver({ driver_id: requestParam.driver_id }, requestParam.code));
            return
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Logout Delete Account
    Purpose : Logout Delete Account
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const logoutDeleteAccount = async(requestParam,) => {
    return new Promise(async(resolve, reject) => {
        try {
            let db = dbConstants.dbSchema.customers;
            let getColumn = {
                customer_id: requestParam.user_id
            }
            let removeColumn = {
                customer_id: {$in:[requestParam.user_id]}
            }
            if(requestParam.user_type == 'driver'){
                db = dbConstants.dbSchema.drivers;
                getColumn = {
                    driver_id: requestParam.user_id
                }
                removeColumn = {
                    driver_id: {$in:[requestParam.user_id]}
                }
            }
            // let response = await query.selectWithAndOne(db, getColumn, { _id: 0, name: 1} );
            // if(!response){
            //     reject(errors.userNotFound(true, requestParam.code));
            //     return;
            // }
            if(requestParam.action == 'logout'){
                await query.updateSingle(db, {player_id:''}, getColumn);
                resolve({});
                return
            }
            else{
                await query.removeMultiple(db, removeColumn);
                resolve({});
                return
            }
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Verify OTP
    Purpose : Verify OTP
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const verifyOTP = async(requestParam,) => {
    return new Promise(async(resolve, reject) => {
        try {
            let db = dbConstants.dbSchema.customers;
            let getColumn = {
                customer_id: requestParam.user_id
            }
            if(requestParam.user_type == 'driver'){
                db = dbConstants.dbSchema.drivers;
                getColumn = {
                    driver_id: requestParam.user_id
                }
            }
            let response = await query.selectWithAndOne(db, getColumn, { _id: 0, name: 1, otp:1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            if(response.otp == requestParam.otp){
                await query.updateSingle(db, { otp:0 }, getColumn);
                if(requestParam.user_type == 'driver'){
                    resolve(profileDriver(getColumn, requestParam.code));
                    return;
                }
                else{
                    resolve(profileCustomer(getColumn, requestParam.code));
                    return;
                }
            }
            else{
                reject(errors.invalidOTP(true, requestParam.code));
                return;
            }
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Resend OTP
    Purpose : Resend OTP
    Original Author : Gaurav Patel
    Created At : 26th Nov 2020
*/
const resendOTP = async(requestParam,) => {
    return new Promise(async(resolve, reject) => {
        try {
            let db = dbConstants.dbSchema.customers;
            let getColumn = {
                customer_id: requestParam.user_id
            }
            if(requestParam.user_type == 'driver'){
                db = dbConstants.dbSchema.drivers;
                getColumn = {
                    driver_id: requestParam.user_id
                }
            }
            let response = await query.selectWithAndOne(db, getColumn, { _id: 0, name: 1, otp:1, mobile_country_code:1, mobile:1} );
            if(!response){
                reject(errors.userNotFound(true, requestParam.code));
                return;
            }
            let otp = Math.floor(1000 + Math.random() * 9000);
            let template = await query.selectWithAndOne(dbConstants.dbSchema.sms_templates, {code:'OTP'}, { _id: 0, value: 1} );
            if(template){
                let msg = template.value[requestParam.code]
                msg = msg.replace('#NAME#', response.name)
                msg = msg.replace('#OTP#', otp)
                sendSMS({ message: msg, mobile_country_code: response.mobile_country_code, mobile: response.mobile });
            }
            await query.updateSingle(db, {otp:otp}, getColumn);
            resolve({otp:otp});
            return
        } catch (error) {
            reject(error)
            return
        }
    })
};


/*
    Name : Update Player ID
    Purpose : Update Player ID
    Original Author : Gaurav Patel
    Created At : 17th Dec 2020
*/
const updatePlayerId = async(requestParam,) => {
    return new Promise(async(resolve, reject) => {
        try {
            let db = dbConstants.dbSchema.customers;
            let getColumn = {
                customer_id: requestParam.user_id
            }
            if(requestParam.user_type == 'driver'){
                db = dbConstants.dbSchema.drivers;
                getColumn = {
                    driver_id: requestParam.user_id
                }
            }
            await query.updateSingle(db, {player_id:requestParam.player_id}, getColumn);
            resolve({});
            return
        } catch (error) {
            reject(error)
            return
        }
    })
};

module.exports = {
    profileCustomer,
    signInCustomer,
    signUpCustomer,
    checkEmailMobileExists,
    verifyMobile,
    resendOtpUsingMobileVerify,
    logoutDeleteAccount,
    updateProfileCustomer,
    signInDriver,
    profileDriver,
    signUpDriver,
    updateProfileDriver,
    verifyOTP,
    resendOTP,
    accountSetup,
    updatePlayerId
};