// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var makeSchema = new Schema({
    make_id: {
        type: String,
        default:''
    },
    title: {
        type: Object,
        default:{}
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
makeSchema.pre('save', function(callback) {
    idGenerator.generateId('makes', 'make_id', 'MKE', (err, ID) => {
        this.make_id = ID;
        callback();
    });
});

var Make = mongoose.model('Make', makeSchema);
module.exports = Make;