// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var shareTripSchema = new Schema({
    trip_id: {
        type: String,
        default:''
    },
    customer_id: {
        type: String,
        default:''
    },
    share_ids: {
        type: Array,
        default:[]
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

var Share_trip = mongoose.model('Share_trip', shareTripSchema);
module.exports = Share_trip;