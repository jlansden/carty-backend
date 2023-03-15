'use strict';

const config = require('./../../config');
const logger = require('./../../utils/logger');
const errors = require('./../../utils/dz-errors-api');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator-api');
const label = require('./../../models/language-label');
const moment = require('moment');
let async = require('async');
let _ = require('underscore');
const S3Handler = require('./../../utils/s3-handler');
const s3Handler = new S3Handler();
const {
    generateString
} = require('./../../utils/random-string-generator');

/*
    Name : Upload Image
    Purpose : Upload Image
    Original Author : Gaurav Patel
    Created At : 28th Sep 2020
*/
const uploadImage = (requestParam, bucket, done) => {
    let bucketName;
    if (bucket == 'customer') {
        bucketName = config.aws.s3.customerBucket;
    }
    if (bucket == 'driver') {
        bucketName = config.aws.s3.driverBucket;
    }
    let randomStr = generateString(8, true, false, false);
    let fileType = requestParam.name.split('.').pop();
    requestParam['file_name'] = moment().unix() + randomStr + '.' + fileType;
    s3Handler.upload(requestParam, bucketName, fileType, (error, imageData) => {
        if (error) {
            logger('Error: can not upload image on aws server', '');
            done(errors.internalServer(true), null);
            return;
        }
        console.log(imageData.Location)
        done(null, requestParam.file_name);
    });
};

const removeMultipleImages = (objects, done) => {
    s3Handler.deleteMultipleFiles(objects, config.aws.bucketName, (error, res) => {
        if (error) {
            done(errors.internalServer(true), null);
            return;
        } else {
            done(null, res);
        }
    });
};

/*
    Name : Get Radius Driver
    Purpose : Get Radius Driver
    Original Author : Gaurav Patel
    Created At : 1st Dec 2020
*/
const getRadiusDriver = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let settings = await query.selectWithAndOne(dbConstants.dbSchema.settings, {}, {_id:0}, {});
            settings.near_by_radius = settings.near_by_radius * 1.6;
            var geoQuery = config.firebase.geoDriverRef.query({
                center: [parseFloat(requestParam.start_latitude), parseFloat(requestParam.start_longitude)],
                radius: settings.near_by_radius
            });
            let driverIDs = []
            geoQuery.on("key_entered", (key, location, distance) => {
                driverIDs.push(key)
            });
            geoQuery.on("ready", (key, location, distance) => {
                console.log(driverIDs)
                resolve(driverIDs);
                return;
            });
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Maker List
    Purpose : Maker List
    Original Author : Gaurav Patel
    Created At : 31th Dec 2020
*/
const makerList = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let makes = await query.selectWithAnd(dbConstants.dbSchema.makes, { status:'active' }, { _id: 0, make_id: 1, title: 1, status: 1}, { created_at: -1 });
            _.each(makes, (element) => {
                element.title = element.title[requestParam.code]
            });
            resolve(makes)
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

/*
    Name : Model List
    Purpose : Model List
    Original Author : Gaurav Patel
    Created At : 31th Dec 2020
*/
const modelList = async(requestParam) => {
    return new Promise(async(resolve, reject) => {
        try {
            let models = await query.selectWithAnd(dbConstants.dbSchema.models, { status:'active', make_id: requestParam.make_id }, { _id: 0, model_id: 1, title: 1, status: 1}, { created_at: -1 });
            _.each(models, (element) => {
                element.title = element.title[requestParam.code]
            });
            resolve(models)
            return;
        } catch (error) {
            reject(error)
            return
        }
    })
};

module.exports = {
    uploadImage,
    removeMultipleImages,
    getRadiusDriver,
    makerList,
    modelList
};