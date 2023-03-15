'use strict';

// var moment = require('moment-timezone');
// console.log(moment(new Date()).tz("Australia/Sydney").format());

//configurations
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('./utils/logger');
const jsonResponse = require('./utils/json-response');
const config = require('./config');
const errors = require('./utils/dz-errors');
const cors = require('cors');
const cron = require('node-cron');
const request = require('request');


//routes
const routes = require('./routes/index');
const authBackend = require('./routes/backend/auth');
const dashboard = require('./routes/backend/dashboard');
const settingBackend = require('./routes/backend/settings');
const language = require('./routes/backend/language');
const label = require('./routes/backend/label');
const cms = require('./routes/backend/cms');
const helpCategoryBackend = require('./routes/backend/help-category');
const helpBackend = require('./routes/backend/help');
const email = require('./routes/backend/email');
const push = require('./routes/backend/push');
const sms = require('./routes/backend/sms');
const ticketBackend = require('./routes/backend/ticket');
const role = require('./routes/backend/role');
const user = require('./routes/backend/user');
const screen = require('./routes/backend/screen');
const coupon = require('./routes/backend/coupon');
const customerBackend = require('./routes/backend/customer');
const driverBackend = require('./routes/backend/driver');
const vehicleBackend = require('./routes/backend/vehicle');
const priceBackend = require('./routes/backend/price');
const modeBackend = require('./routes/backend/mode');
const musicBackend = require('./routes/backend/music');
const accessibleBackend = require('./routes/backend/accessible');
const tripBackend = require('./routes/backend/trip');
const report = require('./routes/backend/report');
const transaction = require('./routes/backend/transaction');
const make = require('./routes/backend/make');
const model = require('./routes/backend/model');
const year = require('./routes/backend/year');
const stateBack = require('./routes/backend/state');
const cityBack = require('./routes/backend/city');

// FOR API
const languageAPI = require('./routes/api/language');
const labelAPI = require('./routes/api/label');
const apiCms = require('./routes/api/cms');
const settings = require('./routes/api/settings');
const helpCategory = require('./routes/api/help-category');
const help = require('./routes/api/help');
const authAPI = require('./routes/api/auth');
const customerAPI = require('./routes/api/customer');
const preference = require('./routes/api/preference');
const vehicleAPI = require('./routes/api/vehicle');
const card = require('./routes/api/card');
const driverAPI = require('./routes/api/driver');
const tripAPI = require('./routes/api/trip');
const notificationAPI = require('./routes/api/notification');
const emergency = require('./routes/api/emergency');
const common = require('./routes/api/common');
const state = require('./routes/api/state');
const city = require('./routes/api/city');
const yearAPI = require('./routes/api/year');

//other configurations
const passport = require('passport');
const favicon = require('serve-favicon');
const multiparty = require('connect-multiparty');
const upload = require('express-fileupload');
const multipartyMiddleWare = multiparty();

//express configurations
const app = express();
app.use(favicon(path.join(__dirname, './public/img', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '50mb'}));
app.use(cookieParser());
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(cors());
app.use(passport.initialize());
app.use(passport.session());
app.use(multipartyMiddleWare);

// import routes
app.use('/',routes);
app.use('/backend/auth', authBackend);
app.use('/backend/dashboard', dashboard);
app.use('/backend/settings', settingBackend);
app.use('/backend/language', language);
app.use('/backend/label', label);
app.use('/backend/cms', cms);
app.use('/backend/help-category', helpCategoryBackend);
app.use('/backend/help', helpBackend);
app.use('/backend/email', email);
app.use('/backend/push', push);
app.use('/backend/sms', sms);
app.use('/backend/ticket', ticketBackend);
app.use('/backend/role', role);
app.use('/backend/user', user);
app.use('/backend/screen', screen);
app.use('/backend/coupon', coupon);
app.use('/backend/customer', customerBackend);
app.use('/backend/driver', driverBackend);
app.use('/backend/vehicle', vehicleBackend);
app.use('/backend/price', priceBackend);
app.use('/backend/mode', modeBackend);
app.use('/backend/music', musicBackend);
app.use('/backend/accessible', accessibleBackend);
app.use('/backend/trip', tripBackend);
app.use('/backend/report', report);
app.use('/backend/transaction', transaction);
app.use('/backend/make', make);
app.use('/backend/model', model);
app.use('/backend/state', stateBack);
app.use('/backend/city', cityBack);
app.use('/backend/year', year);


// FOR API
app.use('/api/language', languageAPI);
app.use('/api/label', labelAPI);
app.use('/api/cms', apiCms);
app.use('/api/settings', settings);
app.use('/api/help-category', helpCategory);
app.use('/api/help', help);
app.use('/api/auth', authAPI);
app.use('/api/customer', customerAPI);
app.use('/api/preference', preference);
app.use('/api/vehicle', vehicleAPI);
app.use('/api/card', card);
app.use('/api/driver', driverAPI);
app.use('/api/trip', tripAPI);
app.use('/api/notification', notificationAPI);
app.use('/api/emergency', emergency);
app.use('/api/common', common);
app.use('/api/state', state);
app.use('/api/city', city);
app.use('/api/year', yearAPI);


app.use(upload());

var swaggerUi = require("swagger-ui-express"),
swaggerDocument = require("./swagger.json");

app.use("/api-swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// catch 404 and forward to error handler
app.use((req, res) => {
	logger('Error: No route found or Wrong method name');
	jsonResponse(res, errors.resourceNotFound(true), null);
});
// development error handler
// will print stacktrace

if (app.get('env') === 'development') {
	app.use((err, req, res) => {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
			error: err
		});
	});
}

// production error handler
// no stack traces leaked to user
app.use((err, req, res) => {
	res.status(err.status || 500);
	res.render('error', {
	message: err.message,
		error: {}
	});
});

module.exports = app;




