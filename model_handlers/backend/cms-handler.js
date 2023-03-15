'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
const config = require('./../../config');
let async = require('async');
let _ = require('underscore');
const Cms = require('./../../models/cms');
let fs = require('fs');
const S3Handler = require('./../../utils/s3-handler');
const s3Handler = new S3Handler();


const get = function(req,done){
	let columnAndValue={}
    if(req.query.cms_id){
    	if(req.query.cms_id){
    		columnAndValue.cms_id = req.query.cms_id
    	}
        query.selectWithAndFilter(dbConstants.dbSchema.cms, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
            if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.cms);
                done(errors.internalServer(true), null);
                return;
            }
            response = response[0]
            response = JSON.parse(JSON.stringify(response));
            let chart={}
            query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'}, {}, function(error, languages) {
                _.each(languages, (element, index, list) => {
                    response[element.code] = response.title[element.code];
                    response["desc_"+element.code] = response.description[element.code];
                    chart["desc_"+element.code] = response.description[element.code];
                });
                response.chart = chart;
                done(null,response)
            });
        });
    }
    else{
    	query.selectWithAndFilter(dbConstants.dbSchema.cms, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.cms);
                done(errors.internalServer(true), null);
                return;
            }
            _.each(response, (ele) => {
                ele.title = ele.title.EN
            })
            done(null,response)
        });
    }
};

const create = function(requestParam, done){
    let title = new Object();
    let description = new Object();
    let link = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function (error, languages) {
        async.forEachSeries(languages, function(element, Callback_s1) {
            let fileName = requestParam.type+'_'+requestParam.code+'_'+element.code+".html";

            title[element.code] = requestParam[element.code];
            description[element.code] = requestParam["desc_"+element.code];
            //link[element.code] = fileName;

            let ansTemplate = fs.readFileSync('./public/cms_pages/cms.html', "utf8");
            ansTemplate = ansTemplate.replace('#CONTENT#', requestParam["desc_" + element.code]);
            // fs.writeFile(config.cms.write_path+fileName, ansTemplate, function(err) {
            //     if(err) {
            //         logger('Error: can not write file ', dbConstants.dbSchema.cms);
            //         done(errors.internalServer(true), null);
            //         return;
            //     }
            //     Callback_s1();
            // }); 
            s3Handler.writeFile(ansTemplate, fileName, config.aws.s3.userBucket, 'html', (error, pagePath) => {
                if (error) {
                    logger('Error: failed to Upload  HTML Page Failed with error:', error);
                    done(error, null);
                    return;
                }
                link[element.code] = fileName;
                Callback_s1();
            });
        }, function(){
            requestParam.link = link;
            requestParam.title = title;
            requestParam.description = description;
            query.insertSingle(dbConstants.dbSchema.cms, requestParam, function (error, label) {
                if (error) {
                    logger('Error: can not create label');
                    done(error, null);
                    return;
                }
                done(null, label);
            });
        });
        
    });
};


const update = function(requestParam, done){
    let title = new Object();
    let description = new Object();
    let link = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function (error, languages) {
        async.forEachSeries(languages, function(element, Callback_s1) {
            let fileName = requestParam.type+'_'+requestParam.code+'_'+element.code+".html";

            title[element.code] = requestParam[element.code];
            description[element.code] = requestParam["desc_"+element.code];
            //link[element.code] = fileName;

            let ansTemplate = fs.readFileSync('./public/cms_pages/cms.html', "utf8");
            ansTemplate = ansTemplate.replace('#CONTENT#', requestParam["desc_" + element.code]);
            /*fs.writeFile(config.cms.write_path+fileName, ansTemplate, function(err) {
                if(err) {
                    logger('Error: can not write file ', dbConstants.dbSchema.cms);
                    done(errors.internalServer(true), null);
                    return;
                }
                Callback_s1();
            }); */
            s3Handler.writeFile(ansTemplate, fileName, config.aws.s3.userBucket, 'html', (error, pagePath) => {
                if (error) {
                    logger('Error: failed to Upload  HTML Page Failed with error:', error);
                    done(error, null);
                    return;
                }
                link[element.code] = fileName;
                Callback_s1();
            });
        }, function(){
            requestParam.link = link;
            requestParam.title = title;
            requestParam.description = description;
            query.updateSingle(dbConstants.dbSchema.cms,requestParam, { 'cms_id':requestParam.cms_id},function (error, cms) {
                if (error) {
                    logger('Error: can not update cms');
                    done(error, null);
                    return;
                }
                done(null, cms);
            });
        });
        
    });
    
};


const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.cms, {
            'cms_id': {
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
       query.updateMultiple(dbConstants.dbSchema.cms, columnsToUpdate, {
            'cms_id': {
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