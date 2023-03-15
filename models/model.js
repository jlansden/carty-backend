// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var modelSchema = new Schema({
    model_id: {
        type: String,
        default:''
    },
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
modelSchema.pre('save', function(callback) {
    idGenerator.generateId('models', 'model_id', 'MDL', (err, ID) => {
        this.model_id = ID;
        callback();
    });
});

var Model = mongoose.model('Model', modelSchema);
module.exports = Model;