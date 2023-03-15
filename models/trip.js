// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var tripSchema = new Schema({
    trip_id: {
        type: String,
        default:''
    },
    customer_id: {
        type: String,
        default:''
    },
    driver_id: {
        type: String,
        default:''
    },
    card_id: {
        type: String,
        default:''
    },
    transaction_id: {
        type: String,
        default:''
    },
    charge_id: {
        type: String,
        default:''
    },
    cancel_charge_id: {
        type: String,
        default:''
    },
    vehicle_id: {
        type: String,
        default:''
    },
    start_address: {
        type: String,
        default:''
    },
    start_latitude: {
        type: Number,
        default:0
    },
    start_longitude: {
        type: Number,
        default:0
    },
    finish_address: {
        type: String,
        default:''
    },
    finish_latitude: {
        type: Number,
        default:0
    },
    finish_longitude: {
        type: Number,
        default:0
    },
    total_distance: {
        type: Number,
        default:0
    },
    total_duration: {
        type: Number,
        default:0
    },
    formatted_distance: {
        type: String,
        default:''
    },
    formatted_duration: {
        type: String,
        default:''
    },
    preferences: {
        mode_id:{
            type: String,
            default:''
        },
        music_id:{
            type: String,
            default:''
        },
        accessible_id:{
            type: String,
            default:''
        },
        temperature:{
            type: String,
            default:''
        }
    },
    total: {
        type: Number,
        default:0
    },
    driver_earn: {
        type: Number,
        default:0,
    },
    company_earn: {
        type: Number,
        default:0,
    },
    requested_ids: {
        type: Array,
        default:[]
    },
    rejected_ids: {
        type: Array,
        default:[]
    },
    fare_info: {
        type: Object,
        default:{}
    },
    customer_to_driver_rating: {
        type: Number,
        default:0
    },
    customer_to_driver_comment: {
        type: String,
        default:''
    },
    dispute_msg: {
        type: String,
        default:''
    },
    dispute_status: {
        type: String,
        enum: ['pending', 'resolved'],
        default:'pending'
    },
    is_driver_paid: {
        type: Boolean,
        default:false
    },
    company_percentage: {
        type: Number,
        default:0,
    },
    toll_charge: {
        type: Number,
        default:0
    },
    cleaning_charge: {
        type: Number,
        default:0
    },
    trip_otp: {
        type: Number,
        default:0
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'pickedup', 'started', 'completed', 'canceled'],
        default:'pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});


// // Execute before each user.save() call
tripSchema.pre('save', function(callback) {
    idGenerator.generateId('trips', 'trip_id', 'TRI', (err, ID) => {
        this.trip_id = ID;
        callback();
    });
});

var Trip = mongoose.model('Trip', tripSchema);
module.exports = Trip;