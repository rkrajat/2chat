var model = require('./model/model');
var mongoose = require('mongoose');   
var User = mongoose.model('User');
var LocalStrategy   = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');
var db_crud = require('./db_functions/db_crud');

module.exports = function(passport){

	// Passport needs to be able to serialize and deserialize users to support persistent login sessions
	passport.serializeUser(function(user, done) {
		console.log('serializing user:',user.name);
		done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			console.log('deserializing user:',user.name);
			done(err, user);
		});
	});

	passport.use('login', new LocalStrategy({
			passReqToCallback : true
		},
		function(req, username, password, done) { 
			// check in mongo if a user with username exists or not
			console.log(username);
			console.log(password);
			db_crud.getUser(username, 
				function(err, user) {
					// In case of any error, return using the done method
					console.log(err);
					if (err)
						return done(err);
					// Username does not exist, log the error and redirect back
					if (!user){
						console.log('User Not Found with username '+username);
						return done(null, false);                 
					}
					// User exists but wrong password, log the error 
					if (!isValidPassword(user, password)){
						console.log('Invalid Password');
						return done(null, false); // redirect back to login page
					}
					// User and password both match, return user from done method
					// which will be treated like success
					return done(null, user);
				}
			);
		}
	));

	passport.use('signup', new LocalStrategy({
			passReqToCallback : true // allows us to pass back the entire request to the callback
		},
		function(req, username, password, done) {

			findOrCreateUser = function(){
				console.log('PPPPPPPPPPP');
				// find a user in mongo with provided username
				db_crud.getUser(username, function(err, user) {
					// In case of any error, return using the done method
					if (err){
						console.log('Error in SignUp: '+err);
						return done(err);
					}
					// already exists
					if (user) {
						console.log('User already exists with username: '+username);
						return done(null, false);
					} else {
						// if there is no user, create the user
						var newUser = {};
						// set the user's local credentials
						newUser.name = username;
						newUser.password = createHash(password);
						newUser.email = req.body.email;
						newUser.mobile = req.body.mobile;

						console.log('$$$$$$$$$$$$$$$');
						console.log(newUser);

						db_crud.postUser(newUser, function(err, newCreatedUser){
							// In case of any error, return using the done method
					if (err)
						throw err; 
					// User and password both match, return user from done method
					// which will be treated like success
					return done(null, newCreatedUser);
						});

					}
				});
			};
			// Delay the execution of findOrCreateUser and execute the method
			// in the next tick of the event loop
			process.nextTick(findOrCreateUser);
		})
	);
	
	var isValidPassword = function(user, password){
		return bCrypt.compareSync(password, user.password);
	};
	// Generates hash using bCrypt
	var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
	};

};