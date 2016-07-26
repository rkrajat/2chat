var express = require('express');
var router = express.Router();

var db_crud = require('../db_functions/db_crud');

/*db_crud.getUser('Prakash', callback);
db_crud.postUser({name : 'Prakash',email: 'prakash120889@gmail.com',mobile:7418373254,password:'prakash'},callback);
*/

/*db_crud.getChatters('PrakashV', callback);*/

//Used for routes that must be authenticated.
isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects

	console.log(req.isAuthenticated());

	if (req.isAuthenticated()){
		return next();
	}
	
	//allow all get request methods
	if(req.method === "GET"){
		return next();
	}

	// if the user is not authenticated then redirect him to the login page
	res.redirect('/#login');
};

router.use('/users', isAuthenticated);
router.use('/contacts', isAuthenticated);

router.route('/users')
	.get(function(req, res){
		if(!req.isAuthenticated()){
			return res.send(401,{message : 'not authenticated'});
		}

		db_crud.getUsers(function(err, users){
			if(err){
				return res.send(500, err);
			}

			return res.json(users);
		});
	})

	.post(function(req,res){
		if(!req.isAuthenticated()){
			return res.send(401,{message : 'not authenticated'});
		}

		var userFromReq = req.body;
		db_crud.getUser(userFromReq.name, function(err,user){
			if(err){
				return res.send(500, err);
			}

			if(user){
				return res.send(500, {message: 'User Name ' + user.name + ' already exists'});
			}

			db_crud.postUser(userFromReq, function(err,user){
				if(err){
					return res.send(500, err);
				}

				return res.json(user);
			});
		});
	});

	router.route('/users/:userName')
		.get(function(req, res){
			if(!req.isAuthenticated()){
				return res.send(401,{message : 'not authenticated'});
			}

			db_crud.getUser(req.params.userName, function(err, user){
				if(err){
					return res.send(500, err);
				}

				if(user){
					return res.json(user);
				}
				else{
			    	return res.send(500,{message: 'No User found for User Name (' + req.params.userName + ')'})
				}

			});
		});

	router.route('/users/paginated/:email')
		.get(function(req, res){
			if(!req.isAuthenticated()){
				return res.send(401,{message : 'not authenticated'});
			}

			db_crud.getUserPaginated(req.params.email, req.query.offset, req.query.limit, function(err, users){
				if(err){
					console.log(err);

					//return res.send(500, err);
				}

				if(users){
					return res.json(users);
				}
				else{
					return res.send(500,{message: 'No User found for Email (' + req.params.email + ')'})
				}

			});
		});

router.route('/contacts')
	.get(function(req, res){
		if(!req.isAuthenticated()){
			return res.send(401, {message: 'not authenticated'});
		}

		db_crud.getContacts(req.query.username, function(err, users){
			if(err){
				return res.send(500, err);
			}

			if(!users){
				return res.send(500, {message : 'No Contacts found in 2Chat'});
			}

			return res.json(users);
		});
	});
	router.route('/contacts/chatters')
		.get(function(req, res) {
			if(!req.isAuthenticated()){
				return res.send(401, {message: 'not authenticated'});
			}

			db_crud.getChatters(req.query.username, function(err, users) {
				if(err) {
					return res.send(500, err);
				}

				return res.json(users);
			});
		});

function callback(err,data){
  console.log("CallBack Received ");
  console.log(err);
  console.log(data);
}

module.exports = router