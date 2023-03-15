var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

var driverSchema = new Schema({
    driver_id: {
        type: String,
        default: ''
    },
    trip_id: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    mobile_country_code: {
        type: String,
        default: ''
    },
    mobile: {
        type: String,
        default: ''
    },
    profile_picture: {
        type: String,
        default: ''
    },
    driving_licence: {
        type: String,
        default: ''
    },
    vehicle_insurance: {
        type: String,
        default: ''
    },
    vehicle_registration: {
        type: String,
        default: ''
    },
    certificate_of_completion: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        default:'male'
    },
    player_id: {
        type: String,
        default: ''
    },
    otp: {
        type: Number,
        default: 0
    },
    is_profile_picture: {
        type: Boolean,
        default: false
    },
    is_driving_licence: {
        type: Boolean,
        default: false
    },
    is_vehicle_insurance: {
        type: Boolean,
        default: false
    },
    is_vehicle_registration: {
        type: Boolean,
        default: false
    },
    is_legal_aggrement: {
        type: Boolean,
        default: false
    },
    is_certificate_of_completion: {
        type: Boolean,
        default: false
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    vehicles: {
        type: Array,
        default: []
    },
    vehicle_id:{
        type: String,
        default:''
    },
    availability_status: {
        type: String,
        enum: ['offline', 'online'],
        default:'offline'
    },
    state_id: {
        type: String,
        default: ''
    },
    city_id: {
        type: String,
        default: ''
    },
    device_name: {
        type: String,
        default: ''
    },
    device_type: {
        type: String,
        enum: ['android', 'ios', ''],
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default:'active'
    },
    is_push: {
        type: Boolean,
        default:true
    },
    is_email: {
        type: Boolean,
        default:true
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
driverSchema.pre('save', function(callback) {
    idGenerator.generateId('drivers', 'driver_id', 'DRI', (err, ID) => {
        this.driver_id = ID;
        callback();
    });
});

var Driver = mongoose.model('Driver', driverSchema);
module.exports = Driver;