// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var settingsSchema = new Schema({
	settings_id:{
		type: String,
		default:''
	},
	fb_url:{
		type: String,
		default:''
	},
	twitter_url:{
		type: String,
		default:''
	},
	instagram_url:{
		type: String,
		default:''
	},
	linkedin_url:{
		type: String,
		default:''
	},
	youtube_url:{
		type: String,
		default:''
	},
	default_currency:{
		type: String,
		default:''
	},
	call_us:{
		type: String,
		default:''
	},
	support_email:{
		type: String,
		default:''
	},
	company_address:{
		type: String,
		default:''
	},
	tax_percentage:{
		type: Number,
		default:0
	},	
	company_percentage: {
        type: Number,
        default:0,
    },
    near_by_radius: {
        type: Number,
        default:0,
    },
    sos_number: {
        type: String,
		default:''
    },
    is_payment_live: {
		type: Boolean,
		default:false
	},
});

settingsSchema.pre('save', function(callback) {
    idGenerator.generateId('settings', 'settings_id', 'SET', (err, ID) => {
        this.settings_id = ID;
        callback();
    });
});

var Setting = mongoose.model('Setting', settingsSchema);
module.exports = Setting;