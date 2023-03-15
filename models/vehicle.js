// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var vehicleSchema = new Schema({
	vehicle_id: {
        type: String,
        default: ''
    },
    title: {
        type: Object,
        default: {}
    },
    description: {
        type: Object,
        default: {}
    },
    select_icon: {
        type: String,
        default: ''
    },
    unselect_icon: {
        type: String,
        default: ''
    },
    order_no: {
        type: Number,
        default: 0
    },
    capacity: {
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
vehicleSchema.pre('save', function(callback) {
	idGenerator.generateId('vehicles', 'vehicle_id', 'VEH', (err, ID) => {
        this.vehicle_id = ID;
        callback();
    });
});

var Vehicle = mongoose.model('Vehicle', vehicleSchema);
module.exports = Vehicle;