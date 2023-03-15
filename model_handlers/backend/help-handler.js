'use strict';

const logger = require('./../../utils/logger');
const jsonResponse = require('./../../utils/json-response');
const errors = require('./../../utils/dz-errors');
const dbConstants = require('./../../constants/db-constants');
const query = require('./../../utils/query-creator');
let async = require('async');
let _ = require('underscore');
const Help = require('./../../models/help');
const S3Handler = require('./../../utils/s3-handler');
const s3Handler = new S3Handler();
const config = require('./../../config');
let fs = require('fs');

const get = function(req,done){
	let columnAndValue={}
    if(req.query.help_id || req.query.status){
        if(req.query.help_id){
            columnAndValue.help_id = req.query.help_id
        }
        if(req.query.status){
            columnAndValue.status = req.query.status
        }
    	query.selectWithAndFilter(dbConstants.dbSchema.helps, columnAndValue, {
            _id: 0,
        }, {created_at:-1}, {}, (error, response) => {
        	if (error) {
                logger('Error: can not get ', dbConstants.dbSchema.helps);
                done(errors.internalServer(true), null);
                return;
            }
            if(req.query.status){
                done(null,response)
            }
            else{
                let chart={};
                response = response[0]
                response = JSON.parse(JSON.stringify(response));
                query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'}, {}, function(error, languages) {
                    _.each(languages, (element, index, list) => {
                        response[element.code] = response.question[element.code];
                        response["ans_" + element.code] = response.ans[element.code];
                        chart["ans_" + element.code] = response.ans[element.code];
                    });
                    response.chart = chart;
                    done(null,response)
                });
            }
        });
    }
    else{
        let joinArr = [{
            $lookup: {
                from: 'help_categories',
                localField: 'help_category_id',
                foreignField: 'help_category_id',
                as: 'catDetails'
            }
        },  {
            $unwind: "$catDetails"
        },  { 
            $match : columnAndValue
        }, { 
            $sort : {created_at:-1}
        }, {
            $project: {
                _id: 0,
                help_id: "$help_id",
                help_category_name: "$catDetails.title.EN",
                question: "$question.EN",
                status: "$status",
            }
        }];
        query.joinWithAnd(dbConstants.dbSchema.helps, joinArr, (error, response) => {
            if (error) {
                logger('Error: can not get record.');
                done(errors.internalServer(true), null);
                return;
            }
            done(null, response)
        });
    }
};

const create = function(requestParam,done){
	let answer = new Object();
    let question = new Object();
    let link = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function(error, languages) {
        async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
            let fileName = Math.floor(Math.random()*8999999+10000)+".html";
            question[singleLanguage.code] = requestParam[singleLanguage.code];
            answer[singleLanguage.code] = requestParam["ans_"+singleLanguage.code];

            let ansTemplate;
            ansTemplate = fs.readFileSync('./public/cms_pages/help.html', "utf8");
            ansTemplate = ansTemplate.replace('#QUESTION#', requestParam[singleLanguage.code]);
            ansTemplate = ansTemplate.replace('#ANSWER#', requestParam["ans_" + singleLanguage.code]);
            s3Handler.writeFile(ansTemplate, fileName, config.aws.s3.helpBucket, 'html', (error, pagePath) => {
                if (error) {
                    logger('Error: failed to Upload  HTML Page Failed with error:', error);
                    done(error, null);
                    return;
                }
                link[singleLanguage.code] = fileName;
                Callback_s1();
            });
        },function(){
            requestParam.question = question;
            requestParam.ans = answer;
            requestParam.link = link;
            query.insertSingle(dbConstants.dbSchema.helps, requestParam, function(error, response) {
                if (error) {
                    logger('Error: can not create');
                    done(error, null);
                    return;
                }
                done(null, response);
            });
        });
    });
};


const update = function(requestParam,done){
	let answer = new Object();
    let question = new Object();
    let link = new Object();
    query.selectWithAnd(dbConstants.dbSchema.languages,{status:'active'},{}, function(error, languages) {
        async.forEachSeries(languages, function(singleLanguage, Callback_s1) {
            let fileName = Math.floor(Math.random()*8999999+10000)+".html";
            question[singleLanguage.code] = requestParam[singleLanguage.code];
            answer[singleLanguage.code] = requestParam["ans_"+singleLanguage.code];

            let ansTemplate;
            ansTemplate = fs.readFileSync('./public/cms_pages/help.html', "utf8");
            ansTemplate = ansTemplate.replace('#QUESTION#', requestParam[singleLanguage.code]);
            ansTemplate = ansTemplate.replace('#ANSWER#', requestParam["ans_" + singleLanguage.code]);
            s3Handler.writeFile(ansTemplate, fileName, config.aws.s3.helpBucket, 'html', (error, pagePath) => {
                if (error) {
                    logger('Error: failed to Upload  HTML Page Failed with error:', error);
                    done(error, null);
                    return;
                }
                link[singleLanguage.code] = fileName;
                Callback_s1();
            });
        },function(){
            requestParam.question = question;
            requestParam.ans = answer;
            requestParam.link = link;
            query.updateSingle(dbConstants.dbSchema.helps, requestParam, {
                'help_id': requestParam.help_id
            }, function(error, response) {
                if (error) {
                    logger('Error: can not update');
                    done(error, null);
                    return;
                }
                done(null, response);
            });
        });
    });
};


const action  = (requestParam, done) => {
 	if (requestParam['type']=="delete") {
        query.removeMultiple(dbConstants.dbSchema.helps, {
            'help_id': {
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
       query.updateMultiple(dbConstants.dbSchema.helps, columnsToUpdate, {
            'help_id': {
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