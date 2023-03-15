var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

var customerSchema = new Schema({
    customer_id: {
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
    player_id: {
        type: String,
        default: ''
    },
    otp: {
        type: Number,
        default: 0
    },
    gender: {
        type: String,
        default:'male'
    },
    addresses: {
        type: Array,
        default: []
    },
    stripe_profile_id: {
        type: String,
        default: ''
    },
    cards: {
        type: Array,
        default: []
    },
    default_card: {
        type: String,
        default: ''
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
customerSchema.pre('save', function(callback) {
    idGenerator.generateId('customers', 'customer_id', 'CUS', (err, ID) => {
        this.customer_id = ID;
        callback();
    });
});

var Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;