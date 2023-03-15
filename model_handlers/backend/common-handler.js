'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
const config = require('./../../config');
let async = require('async');
let _ = require('underscore');
let fs = require('fs');
const moment = require('moment');
const {
    generateString
} = require('./../../utils/random-string-generator');
const S3Handler = require('./../../utils/s3-handler');
const s3Handler = new S3Handler();

const uploadImage = (requestParam, bucket, done) => {
    let bucketName;
    if (bucket == 'user') {
        bucketName = config.aws.s3.userBucket;
    }
    if (bucket == 'customer') {
        bucketName = config.aws.s3.customerBucket;
    }
    if (bucket == 'driver') {
        bucketName = config.aws.s3.driverBucket;
    }
    if (bucket == 'vehicle') {
        bucketName = config.aws.s3.vehicleBucket;
    }
    let randomStr = generateString(8, true, false, false);
    let fileType = requestParam.name.split('.').pop();
    requestParam['file_name'] = moment().unix() + randomStr + '.' + fileType;
    s3Handler.upload(requestParam, bucketName, fileType, (error, imageData) => {
        if (error) {
            console.log(error)
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

module.exports = {
	uploadImage,
    removeMultipleImages
};