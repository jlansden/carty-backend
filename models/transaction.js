// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var transactionSchema = new Schema({
	transaction_id: {
        type: String,
        default: ''
    },
    payment_transaction_id: {
        type: String,
        default: ''
    },
	trip_id : {
        type: String,
        default: ''
    },
	customer_id : {
        type: String,
        default: ''
    },
    driver_id : {
        type: String,
        default: ''
    },
	charge: {
        type: String,
        default: ''
    },
	payment_type: {
        type: String,
        default: ''
    },
	created_at: { type: Date, default: Date.now },
	updated_at: { type: Date, default: Date.now }
});

// // Execute before each user.save() call
transactionSchema.pre('save', function(callback) {
	idGenerator.generateId('transactions', 'transaction_id', 'TRA', (err, ID) => {
        this.transaction_id = ID;
        callback();
    });
});

var Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;