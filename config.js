'use strict';

const dotenv = require('dotenv')
dotenv.config()

const _ = require('underscore');

const requiredParams = [
    'DEFAULT_LANGUAGE',
    'APP_NAME',
    'PORT',
    'CMS_LINK_PATH',
    'CMS_WRITE_PATH',
    'STRIPE_TEST_KEY',
    'STRIPE_LIVE_KEY',
    'ONESIGNAL_CUSTOMER_APP_ID',
    'ONESIGNAL_CUSTOMER_API_KEY',
    'ONESIGNAL_DRIVER_APP_ID',
    'ONESIGNAL_DRIVER_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_MOBILE_NO',
    'AWS_ACCESS_KEY_ID',
    'AWS_ACCESS_SECRET_KEY',
    'AWS_REGION',
    'AWS_SES_REGION',
    'AWS_S3_BUCKET_NAME',
    'AWS_S3_URL_PRIFIX',
    'AWS_S3_HELP_BUCKET',
    'AWS_S3_USER_BUCKET',
    'AWS_S3_CUSTOMER_BUCKET',
    'AWS_S3_DRIVER_BUCKET',
    'AWS_S3_VEHICLE_BUCKET',
    'GOOGLE_API_KEY',
    'DATABASE_URL',
    'FIREBASE_TRACKER_PATH',
    'FIREBASE_SERVICE_ACCOUNT_PATH',
];

for (let i = 0; i < requiredParams.length; i++) {
    if (!_.has(process.env, requiredParams[i])) {
        console.log(
            'Error: environment variables have not been properly setup for the Just Her Rideshare Platform. The variable:',
            requiredParams[i],
            'was not found.'
        );

        throw new Error('Just Her Rideshare Platform Environment Variables Not Properly Set');
    }
}
console.log(process.env.DATABASE_URL)
const admin = require('firebase-admin');
const trackerConfig = require(process.env.FIREBASE_TRACKER_PATH);
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: trackerConfig.databaseURL,
});
const firebaseDBRef = admin.database();
const driversRef = admin.database().ref('drivers');
const tripsRef = admin.database().ref('trips');
const assignTripsRef = admin.database().ref('assign_trips');

const { GeoFire } = require('geofire');
const geoDriverRef = new GeoFire(driversRef);

module.exports = {
	time_zone:'America/Chicago',
    default_language:process.env.DEFAULT_LANGUAGE,
	appName: process.env.APP_NAME,
	port: process.env.PORT,
	cms:{
		link_path:process.env.CMS_LINK_PATH,
		write_path:process.env.CMS_WRITE_PATH
	},
	stripeInfo: {
		test_key: process.env.STRIPE_TEST_KEY,
		live_key: process.env.STRIPE_LIVE_KEY
	},
	onesignal_customer: {
		app_id: process.env.ONESIGNAL_CUSTOMER_APP_ID,
		api_key:process.env.ONESIGNAL_CUSTOMER_API_KEY
	},
	onesignal_driver: {
		app_id: process.env.ONESIGNAL_DRIVER_APP_ID,
		api_key:process.env.ONESIGNAL_DRIVER_API_KEY
	},
	twilio: {
		accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        mobileNo: process.env.TWILIO_MOBILE_NO
	},
	aws:{
		keyId: process.env.AWS_ACCESS_KEY_ID,
        key: process.env.AWS_ACCESS_SECRET_KEY,
        region: process.env.AWS_REGION,
        sesRegion: process.env.AWS_SES_REGION,
        bucketName: process.env.AWS_S3_BUCKET_NAME,
        prefix: process.env.AWS_S3_URL_PRIFIX,
        s3: {
        	helpBucket: process.env.AWS_S3_HELP_BUCKET,
        	userBucket: process.env.AWS_S3_USER_BUCKET,
        	customerBucket: process.env.AWS_S3_CUSTOMER_BUCKET,
        	driverBucket: process.env.AWS_S3_DRIVER_BUCKET,
        	vehicleBucket: process.env.AWS_S3_VEHICLE_BUCKET,
	    }
	},
	geocoderInfo: {
		provider: 'google',
		httpAdapter: 'https',
		apiKey: process.env.GOOGLE_API_KEY,
		formatter: null
	},
    firebase:{
        driversRef,
        geoDriverRef,
        tripsRef,
        assignTripsRef
    },
	google_key: process.env.GOOGLE_API_KEY,
};
