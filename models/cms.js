// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const idGenerator = require('./../utils/id-generator');

// create a schema
var cmsCategorySchema = new Schema({
	cms_id: {
        type: String,
        default: ''
    },
    title: {
        type: Object,
        default: {}
    },
    code: {
        type: String,
        default: ''
    },
    type: {
        type: String,
        default: ''
    },
    description: {
        type: Object,
        default: {}
    },
    link: {
        type: Object,
        default: ''
    }
});

// // Execute before each user.save() call
cmsCategorySchema.pre('save', function(callback) {
	idGenerator.generateId('cms', 'cms_id', 'CMS', (err, ID) => {
        this.cms_id = ID;
        callback();
    });
});

var Cms = mongoose.model('Cms', cmsCategorySchema);
module.exports = Cms;