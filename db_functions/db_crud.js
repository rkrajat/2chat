var mongoose = require('mongoose');
var User = mongoose.model('User');
var Int32 = require('mongoose-int32');

exports.getUsers = function(callback){
	User.find(function(err, users){
		if(err){
			return callback(err);
		}

		console.log("Returning Users..........");
		console.log(users);

		return callback(err, users);
	});
}

exports.getUser = function(username,callback){
	User.findOne({name: username},function(err, user){
		if(err){
			return callback(err);
		}

		console.log("Returning User for username " + username + "..........");
		console.log(user);

		return callback(err,user);
	});
}

exports.getUserPaginated = function(email, offset, limit, callback){
	var options = {
	  select: 'name email mobile created_at',
	  sort: { date: -1 },
	  populate: 'User',
	  lean: true,
	  offset: 2, 
	  limit: 1
	};

	options.offset = parseInt(offset);
	options.limit = parseInt(limit);
	
	User.paginate({email: email}, options,function(err, user) {
		if(err){
			return callback(err);
		}

		console.log("Returning User for email " + email + "..........");
		console.log(user);

		return callback(err,user);
	});
}

exports.getContacts = function(username, callback){
	User.find({name: {"$ne": username}}, function(err,users){
		if(err){
			return callback(err);
		}

		return callback(err, users);
	});
}

exports.getChatters = function(username, callback){
	User.find({'$or' : [{sender: username}, {reciever: username}]}, function(err, chatters){
		if(err){
			return callback(err);
		}

		return callback(err, chatters);
	});
}

exports.postUser = function(user,callback){
	var newUser = new User();

	newUser.name = user.name;
	newUser.mobile = user.mobile;
	newUser.email = user.email;
	newUser.password = user.password;

	newUser.save(function(err,user){
		if(err){
			return callback(err);
		}

		return callback(err,user);
	});
}
	// Generates hash using bCrypt
	/*var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	};*/
/////////////////////////////////////////////////////////////////////////////////

////////////////// Chat Routes ////////////////////
// 1. Get all chats                              //
// 2. Save a new message       					 //
// 3. Retrieve more messages                     //
///////////////////////////////////////////////////

exports.getChat = function(callback){
	
	Chat.find(function(err, chats){
        if(err){
            return callback(err);
        }

        console.log(chats);

        return callback(err, chats);
        
    });
}

// Save a new message
exports.saveMessage = function(Message, callback){
	var newMessage = new Chat();

	newMessage.message = Message.message;
	newMessage.sender = Message.sender;
	newMessage.reciever = Message.reciever;

	newMessage.save(function(err, message){
		if (err){
            return callback(err); 
        }

        return callback(err, message);
	});
}

exports.getMoreMessage = function(sender, reciever, offset, limit, callback){

	var options = {
	  select: 'new message created_at',
	  sort: { date: -1 },
	  populate: 'Chat',
	  lean: true,
	  offset: 2, 
	  limit: 1
	};

	options.offset = parseInt(offset);
	options.limit = parseInt(limit);


	Chat.paginate({sender: sender, reciever: reciever}, options,  function(err, message){
		if(err){
			return callback(err);
		}

		console.log('Returning more messages between ' + sender + ' and ' + reciever);
		console.log(message);

		return callback(err, message);
	});	
		
}

exports.getAllMessage = function(sender, reciever, callback){
	Chat.find({sender: sender, reciever: reciever}, function(err, message){
        if(err){
            return callback(err);
        }

        console.log(message);

        return callback(err, message);
	});
}

exports.getChatList = function(user, callback){
	console.log(user);
	Chat.find({ $or: [ {sender: user}, {reciever : user} ] }, function(err, chatlist){

		if(err){
        	return callback(err);
        }
        
        console.log(chatlist);

        return callback(err, chatlist);
	});

}