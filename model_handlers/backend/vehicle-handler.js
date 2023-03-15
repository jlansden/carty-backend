'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Vehicle = require('./../../models/vehicle');
const config = require('./../../config');
const commonHandler = require('./../../model_handlers/backend/common-handler');


const get = function(req, done) {
    let columnAndValue = {}
    if (req.query.vehicle_id || req.query.status) {
        if (req.query.vehicle_id) {
            columnAndValue.vehicle_id = req.query.vehicle_id;
        }
        if (req.query.status) {
            columnAndValue.status = req.query.status;
        }
        query.selectWithAndFilter(dbConstants.dbSchema.vehicles, columnAndValue, {
            _id: 0,
        }, {
            order_no: 1
        }, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.vehicles);
                done(errors.internalServer(true), null);
                return;
            }
            if (req.query.status) {
                done(null, response);
                return;
            }
            else{
                response = response[0]
                response = JSON.parse(JSON.stringify(response));
                if (response.select_icon != '') {
                    response.select_icon = config.aws.prefix + config.aws.s3.vehicleBucket + '/' + response.select_icon;
                }
                if (response.unselect_icon != '') {
                    response.unselect_icon = config.aws.prefix + config.aws.s3.vehicleBucket + '/' + response.unselect_icon;
                }
                query.selectWithAnd(dbConstants.dbSchema.languages, {
                    status: 'active'
                }, {}, function(error, languages) {
                    _.each(languages, (element, index, list) => {
                        response[element.code] = response.title[element.code];
                        response["desc_" + element.code] = response.description[element.code];
                    });
                    done(null, response);
                    return;
                });
            }
        });
    } else {
        query.selectWithAndFilter(dbConstants.dbSchema.vehicles, columnAndValue, {
            _id: 0,
        }, {
            created_at: -1
        }, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.vehicles);
                done(errors.internalServer(true), null);
                return;
            }
            _.each(response, (element, index, list) => {
                element.title = element.title.EN
            });
            done(null, response)
        });
    }
};

const create = function(requestParam, req, done) {
    let description = new Object();
    let title = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, {
        status: 'active'
    }, {}, async function(error, languages) {
        _.each(languages, (element, index, list) => {
            title[element.code] = requestParam[element.code];
            description[element.code] = requestParam["desc_" + element.code];
        });
        requestParam.description = description;
        requestParam.title = title;
        requestParam.select_icon = await new Promise((resolve, reject) => {
            commonHandler.uploadImage(req.files.select_icon, 'vehicle', (error, path) => {
                resolve(path)
            });
        });
        requestParam.unselect_icon = await new Promise((resolve, reject) => {
            commonHandler.uploadImage(req.files.unselect_icon, 'vehicle', (error, path) => {
                resolve(path)
            });
        });
        query.insertSingle(dbConstants.dbSchema.vehicles, requestParam, function(error, data) {
            if (error) {
                logger('Error: can not create push notification templates');
                done(error, null);
                return;
            }
            done(null, data);
        });
    });
};


const update = function(requestParam, req, done) {
    let description = new Object();
    let title = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages, {
        status: 'active'
    }, {}, function(error, languages) {
        _.each(languages, (element, index, list) => {
            title[element.code] = requestParam[element.code];
            description[element.code] = requestParam["desc_" + element.code];
        });
        requestParam.description = description;
        requestParam.title = title;
        if (requestParam.change_logo_select || requestParam.change_logo_unselect) {
            query.selectWithAndOne(dbConstants.dbSchema.vehicles, {
                vehicle_id: requestParam.vehicle_id
            }, {
                vehicle_id: 1,
                select_icon: 1,
                unselect_icon: 1,
            }, async(error, vehicle) => {
                let fileObjects = [];
                if (requestParam.change_logo_select) {
                    fileObjects.push({
                        Key: 'justherrideshare/vehicles/' + /[^/]*$/.exec(vehicle.select_icon)[0]
                    })
                }
                if (requestParam.change_logo_unselect) {
                    fileObjects.push({
                        Key: 'justherrideshare/vehicles/' + /[^/]*$/.exec(vehicle.unselect_icon)[0]
                    })
                }
                commonHandler.removeMultipleImages(fileObjects, async(error, path) => {
                    if (requestParam.change_logo_select) {
                        requestParam.select_icon = await new Promise((resolve, reject) => {
                            commonHandler.uploadImage(req.files.select_icon, 'vehicle', (error, path) => {
                                resolve(path)
                            });
                        });
                    } else {
                        delete requestParam.select_icon;
                    }
                    if (requestParam.change_logo_unselect) {
                        requestParam.unselect_icon = await new Promise((resolve, reject) => {
                            commonHandler.uploadImage(req.files.unselect_icon, 'vehicle', (error, path) => {
                                resolve(path)
                            });
                        });
                    } else {
                        delete requestParam.unselect_icon;
                    }
                    query.updateSingle(dbConstants.dbSchema.vehicles, requestParam, {
                        'vehicle_id': requestParam.vehicle_id
                    }, function(error, vehicle) {
                        if (error) {
                            logger('Error: can not update push Notification');
                            done(error, null);
                            return;
                        }
                        done(null, {});
                    });
                });
            });
        } else {
            delete requestParam.select_icon;
            delete requestParam.unselect_icon;
            query.updateSingle(dbConstants.dbSchema.vehicles, requestParam, {
                'vehicle_id': requestParam.vehicle_id
            }, function(error, vehicle) {
                if (error) {
                    logger('Error: can not update push Notification');
                    done(error, null);
                    return;
                }
                done(null, {});
            });
        }
    });
};


const action = (requestParam, done) => {
    if (requestParam['type'] == "delete") {
        query.selectWithAnd(dbConstants.dbSchema.vehicles, {
            vehicle_id: {
                $in: requestParam.ids
            }
        }, {
            _id: 0,
            vehicle_id: 1,
            select_icon: 1,
            unselect_icon: 1,
        }, (error, vehicle) => {
            let fileObjects = [];
            for (var i = 0; i < vehicle.length; i++) {
                fileObjects.push({
                    Key: 'justherrideshare/vehicles/' + /[^/]*$/.exec(vehicle[i].select_icon)[0]
                })
                fileObjects.push({
                    Key: 'justherrideshare/vehicles/' + /[^/]*$/.exec(vehicle[i].unselect_icon)[0]
                })
            }
            commonHandler.removeMultipleImages(fileObjects, (error, path) => {
                query.removeMultiple(dbConstants.dbSchema.vehicles, {
                    'vehicle_id': {
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
    } else {
        let columnsToUpdate = {
            status: requestParam['type']
        };
        query.updateMultiple(dbConstants.dbSchema.vehicles, columnsToUpdate, {
            'vehicle_id': {
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