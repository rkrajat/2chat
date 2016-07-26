var express = require('express');
var router = express.Router();

module.exports = function(passport){

	router.get('/success', function(req, res){
		res.send({state: 'success', user: req.user ? req.user : null});
	});

	router.get('/loginFailure', function(req, res){
		res.send({state: 'failure', user: null, message: 'Invalid username or password'});
	});

	router.get('/singupFailure', function(req, res){
		res.send({state: 'failure', user: null, message: 'Username already exists'});
	});

	router.post('/login', passport.authenticate('login', {
		successRedirect: '/auth/success',
		failureRedirect: 'auth/loginFailure'
	}));

	router.post('/signup',passport.authenticate('signup',{
		successRedirect: '/auth/success',
		failureRedirect: '/auth/singupFailure'
	}));

	router.get('/signout', function(req,res){
		req.logout();
		res.redirect('/');
	});

	return router;
};