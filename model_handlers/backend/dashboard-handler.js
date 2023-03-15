'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let moment = require('moment');
let _ = require('underscore');
const LD = require('lodash');
const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const statistics = function(req, done) {
    query.selectWithAnd(dbConstants.dbSchema.customers, {}, {
        customer_id: 1
    }, (error, customer) => {
        query.selectWithAnd(dbConstants.dbSchema.trips, {}, {
            trip_id: 1
        }, (error, trip) => {
            query.selectWithAnd(dbConstants.dbSchema.drivers, {}, {
                driver_id: 1
            }, (error, driver) => {
                query.selectWithAnd(dbConstants.dbSchema.vehicles, {}, {
                    vehicle_id: 1
                }, (error, vehicle) => {
                    query.selectWithAnd(dbConstants.dbSchema.musics, {}, {
                        music_id: 1
                    }, (error, music) => {
                        query.selectWithAnd(dbConstants.dbSchema.modes, {}, {
                            mode_id: 1
                        }, (error, mode) => {
                            query.selectWithAnd(dbConstants.dbSchema.accessibles, {}, {
                                accessible_id: 1
                            }, (error, accessible) => {
                                query.selectWithAnd(dbConstants.dbSchema.help_categories, {}, {
                                    help_category_id: 1
                                }, (error, help_category) => {
                                    done(null, {
                                        customer: customer.length,
                                        driver: driver.length,
                                        vehicle: vehicle.length,
                                        preferences: music.length + mode.length + accessible.length,
                                        trip: trip.length,
                                        help_category: help_category.length,
                                    })
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

const usersByOs = function(req, done) {
    query.selectWithAnd(dbConstants.dbSchema.customers, {}, {
        customer_id: 1,
        device_type: 1,
    }, (error, customer) => {
        query.selectWithAnd(dbConstants.dbSchema.drivers, {}, {
            driver_id: 1,
            device_type: 1,
        }, (error, driver) => {
            let android_customer = (_.where(customer, {device_type:'android'})).length
            let ios_customer = (_.where(customer, {device_type:'ios'})).length
            let android_driver = (_.where(driver, {device_type:'android'})).length
            let ios_driver = (_.where(driver, {device_type:'ios'})).length
            done(null, [android_customer, ios_customer, android_driver, ios_driver])
        });
    });
};

const earnings = async(req, done) => {
    let columnAndValues = {};
    let promise = [];
    let year = new Date().getFullYear()
    if(req.query.year){
        year = parseFloat(req.query.year)
    }
    for (let x in monthName) {
        promise.push(await overallEarningSalesCountByMonth(monthName[x], x, columnAndValues, 'company_earn', year))
    }
    Promise.all(promise)
        .then(async result => {
            done(null, result)
        });
};

const sales = async(req, done) => {
    let columnAndValues = {};
    let promise = [];
    let year = new Date().getFullYear()
    if(req.query.year){
        year = parseFloat(req.query.year)
    }
    for (let x in monthName) {
        promise.push(await overallEarningSalesCountByMonth(monthName[x], x, columnAndValues, 'total', year))
    }
    Promise.all(promise)
        .then(async result => {
            done(null, result)
        });
};

const overallEarningSalesCountByMonth = (month, index, columnAndValues, column, year) => {
    return new Promise(async(resolve, reject) => {
        var date = new Date(),
            y = year,
            m = parseInt(index);
        var firstDay = new Date(y, m, 1);
        firstDay.setHours(0, 0, 0, 0);
        var lastDay = new Date(y, m + 1, 0);
        lastDay.setHours(23, 59, 59, 999);
        let compairData = {
            status: 'completed',
            created_at: {
                $gte: firstDay,
                $lt: lastDay
            }
        }
        query.selectWithAnd(dbConstants.dbSchema.trips, compairData, {
            trip_id: 1,
            company_earn: 1,
            total: 1,
        }, (error, trips) => {
            let monthEarning = LD.sumBy(trips, column);
            monthEarning = parseFloat(monthEarning).toFixed(2)
            resolve(parseFloat(monthEarning));
            return;
        });
    })
};

const earnByVehicle = async(req, done) => {
    let promise = [];
    query.selectWithAnd(dbConstants.dbSchema.vehicles, {status:'active'}, {
        vehicle_id: 1,
        title: 1,
    }, async (error, vehicles) => {
        for (let x in vehicles) {
            promise.push(await earnByParticularVehicle(vehicles[x]))
        }
        Promise.all(promise)
        .then(async result => {
            let labels = [];
            let earnings = [];
            _.each(result, (elem) => {
                labels.push(elem.name)
                earnings.push(elem.earn)
            })
            done(null, {
                labels:labels,
                earnings:earnings
            })
        });
    });
};

const earnByParticularVehicle = (columnAndValues) => {
    return new Promise(async(resolve, reject) => {
        let compairData = {
            status: 'completed',
            vehicle_id:columnAndValues.vehicle_id
        }
        query.selectWithAnd(dbConstants.dbSchema.trips, compairData, {
            trip_id: 1,
            total: 1,
        }, (error, trips) => {
            let earn = LD.sumBy(trips, 'total');
            earn = parseFloat(earn).toFixed(2)
            resolve({
                name: columnAndValues.title['EN'],
                earn:parseFloat(earn)
            });
            return;
        });
    })
};


module.exports = {
    statistics,
    earnings,
    sales,
    usersByOs,
    earnByVehicle
};