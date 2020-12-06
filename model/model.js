var mongoose = require('mongoose');
require('mongoose-long')(mongoose);
var Int32 = require('mongoose-int32');
var SchemaTypes = mongoose.Schema.Types;
var mongoosePaginate = require('mongoose-paginate');

var userSchema = new mongoose.Schema({
	name: String,
	email: String,
	mobile: SchemaTypes.Long,
	password: String,
	created_at: {type: Date, default: Date.now}
});

var chatSchema = new mongoose.Schema({
 message: String, 
 sender: String,
 reciever: String,
 created_at: {type: Date, default: Date.now}
});


userSchema.plugin(mongoosePaginate);
chatSchema.plugin(mongoosePaginate);

mongoose.model('User',userSchema);
mongoose.model('Chat',chatSchema);