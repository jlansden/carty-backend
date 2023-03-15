// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var priceSchema = new Schema({
	price_id: {
        type: String,
        default: ''
    },
    vehicle_id: {
        type: String,
        default: ''
    },
    base_fare: {
        type: Number,
        default: 0
    },
    booking_fare: {
        type: Number,
        default: 0
    },
    per_mile_fare: {
        type: Number,
        default: 0
    },
    per_min_fare: {
        type: Number,
        default: 0
    },
    max_fare: {
        type: Number,
        default: 0
    },
    min_fare: {
        type: Number,
        default: 0
    },
    cancellation_fare: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default:'active'
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
priceSchema.pre('save', function(callback) {
	idGenerator.generateId('prices', 'price_id', 'PRI', (err, ID) => {
        this.price_id = ID;
        callback();
    });
});

var Price = mongoose.model('Price', priceSchema);
module.exports = Price;