// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var lostItemSchema = new Schema({
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
    msg: {
        type: String,
        default:''
    },
    status: {
        type: String,
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

var Lost_item = mongoose.model('Lost_item', lostItemSchema);
module.exports = Lost_item;