'use strict';

const _ = require('underscore');
const responseCodes = require('./../helpers/response-codes');
const labels = require('./../utils/labels.json');
const config = require('../config');

function DZError(message, code, name = 'DZError') {
	this.name = name;
	this.message = message || 'Default Message';
	this.code = code;
	this.stack = (new Error()).stack;
}

DZError.prototype = Object.create(Error.prototype);
DZError.prototype.constructor = DZError;

module.exports = {
	missingParameters: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_MISSING_PARAMETERS['MESSAGE'][language || config.default_language],
			responseCodes.BadRequest,
			labels.LBL_MISSING_PARAMETERS['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	internalServer: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_INTERNAL_SERVER['MESSAGE'][language || config.default_language],
			responseCodes.InternalServer,
			labels.LBL_INTERNAL_SERVER['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	userNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_USER_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.ResourceNotFound, 
			labels.LBL_USER_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	orderNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_ORDER_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.ResourceNotFound, 
			labels.LBL_ORDER_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	helpCategoryNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_HELP_CATEGORY_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.ResourceNotFound, 
			labels.LBL_HELP_CATEGORY_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	templateNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_TEMPLATE_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.ResourceNotFound, 
			labels.LBL_TEMPLATE_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidOTP: function(formatForWire, language) {
		const error = new DZError(
			labels.LBL_INVALID_OTP['MESSAGE'][language || config.default_language],
			responseCodes.InvalidOTP, 
			labels.LBL_INVALID_OTP['MESSAGE'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	vehicleNotFound: function(formatForWire, language) {
		const error = new DZError(
			labels.LBL_VEHICLE_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.InvalidOTP, 
			labels.LBL_VEHICLE_NOT_FOUND['MESSAGE'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	resourceNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_CUSTOMER_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.ResourceNotFound, 
			labels.LBL_CUSTOMER_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	insufficientWallet: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_INSUFFICIENT_WALLET['MESSAGE'][language || config.default_language],
			responseCodes.Conflict, 
			labels.LBL_INSUFFICIENT_WALLET['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	ongoingJobNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_ONGOING_JOB_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.Conflict, 
			labels.LBL_ONGOING_JOB_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	emailAlreadyExist: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_EMAIL_ALREADY_EXIST['MESSAGE'][language || config.default_language],
			responseCodes.Conflict, 
			labels.LBL_EMAIL_ALREADY_EXIST['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	mobileAlreadyExist: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_MOBILE_ALREADY_EXIST['MESSAGE'][language || config.default_language],
			responseCodes.Conflict, 
			labels.LBL_MOBILE_ALREADY_EXIST['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	socialIdAlreadyExist: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_SOCIAL_ID_ALREADY_EXIST['MESSAGE'][language || config.default_language],
			responseCodes.Conflict, 
			labels.LBL_SOCIAL_ID_ALREADY_EXIST['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	googleDistanceNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_DISTANCE_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.Conflict, 
			labels.LBL_DISTANCE_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	socialIdNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_SOCIAL_ID_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.ResourceNotFound, 
			labels.LBL_SOCIAL_ID_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	emailNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_EMAIL_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.ResourceNotFound, 
			labels.LBL_EMAIL_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	mobileNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_MOBILE_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.ResourceNotFound, 
			labels.LBL_MOBILE_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidPassword: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_INVALID_PASSWORD['MESSAGE'][language || config.default_language],
			responseCodes.Invalid, 
			labels.LBL_INVALID_PASSWORD['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidOldPassword: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_INVALID_OLD_PASSWORD['MESSAGE'][language || config.default_language],
			responseCodes.Invalid, 
			labels.LBL_INVALID_OLD_PASSWORD['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	invalidPin: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_INVALID_PIN['MESSAGE'][language || config.default_language],
			responseCodes.Conflict, 
			labels.LBL_INVALID_PIN['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	duplicateUser: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_CUSTOMER_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.Conflict, 
			labels.LBL_CUSTOMER_NOT_FOUND['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	orderAlreadyAccept: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_ORDER_ALREADY_ACCEPT['MESSAGE'][language || config.default_language],
			responseCodes.Conflict, 
			labels.LBL_ORDER_ALREADY_ACCEPT['NAME'][language || config.default_language],
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	notActivate: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_ACCOUNT_INACTIVE['MESSAGE'][language || config.default_language],
			responseCodes.NotActive,
			labels.LBL_ACCOUNT_INACTIVE['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	couponNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_COUPON_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.Conflict,
			labels.LBL_COUPON_NOT_FOUND['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	priceNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_PRICE_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.Conflict,
			labels.LBL_PRICE_NOT_FOUND['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	couponExpired: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_COUPON_EXPIRED['MESSAGE'][language || config.default_language],
			responseCodes.Invalid,
			labels.LBL_COUPON_EXPIRED['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	couponNotAvailable: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_COUPON_NOT_AVAILABLE['MESSAGE'][language || config.default_language],
			responseCodes.Invalid,
			labels.LBL_COUPON_NOT_AVAILABLE['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	addressTypeAlreadyExists: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_ADDRESS_TYPE_EXISTS['MESSAGE'][language || config.default_language],
			responseCodes.NotActive,
			labels.LBL_ADDRESS_TYPE_EXISTS['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	vehicleAlreadyExists: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_VEHICLE_ALREADY_EXISTS['MESSAGE'][language || config.default_language],
			responseCodes.NotActive,
			labels.LBL_VEHICLE_ALREADY_EXISTS['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	stripeError: function(formatForWire, message, language){
		const error = new DZError(
			message,
			responseCodes.NotActive,
			message
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	notRemoveDefaultCard: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_NOT_DELETE_DEFAULT_CARD['MESSAGE'][language || config.default_language],
			responseCodes.NotActive,
			labels.LBL_NOT_DELETE_DEFAULT_CARD['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	cardNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_CARD_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.Invalid,
			labels.LBL_CARD_NOT_FOUND['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	tripNotFound: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_TRIP_NOT_FOUND['MESSAGE'][language || config.default_language],
			responseCodes.Invalid,
			labels.LBL_TRIP_NOT_FOUND['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	driverNotAvailableForTrip: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_DRIVER_NOT_AVAILABLE_FOR_TRIP['MESSAGE'][language || config.default_language],
			responseCodes.Invalid,
			labels.LBL_DRIVER_NOT_AVAILABLE_FOR_TRIP['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	tripAlreadyAccept: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_TRIP_ALREADY_ACCEPT['MESSAGE'][language || config.default_language],
			responseCodes.Invalid,
			labels.LBL_TRIP_ALREADY_ACCEPT['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	tripAlreadyPickup: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_TRIP_ALREADY_PICKUP['MESSAGE'][language || config.default_language],
			responseCodes.Invalid,
			labels.LBL_TRIP_ALREADY_PICKUP['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	tripAlreadyStart: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_TRIP_ALREADY_START['MESSAGE'][language || config.default_language],
			responseCodes.Invalid,
			labels.LBL_TRIP_ALREADY_START['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	canNotCancelTrip: function(formatForWire, language){
		const error = new DZError(
			labels.LBL_TRIP_CAN_NOT_CANCEL['MESSAGE'][language || config.default_language],
			responseCodes.Conflict,
			labels.LBL_TRIP_CAN_NOT_CANCEL['NAME'][language || config.default_language]
		);
		return formatForWire ? this.formatErrorForWire(error) : error;
	},
	noError: function(){
		return null;
	},
	errorWithMessage: function(error){
		return new DZError((_.has(error, 'message') ? error.message : ''));
	},
	formatErrorForWire: function(DZError){
		return _.omit(DZError, 'stack');
	},
	customError: function(message, code, name, formatForWire){
		const error = new DZError(message, code, name);
		return formatForWire ? this.formatErrorForWire(error) : error;
	}
};
