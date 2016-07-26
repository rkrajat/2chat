var express = require('express');
var app = express();
var debug = require('debug')('2chat_org:server');
var server = require('http').Server(app);
var io = require('socket.io')();
var port = normalizePort(process.env.PORT || '3000');
var session = require('express-session')
var model = require('./model/model');
var dbFunctions = require('./db_functions/db_crud');

//var bcrypt = require('bcrypt');
var allUsers = {};
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');

var dbURI = 'mongodb://2chatadmin:pwd2chat@ds023495.mlab.com:23495/2chat';//"mongodb://localhost:27017/2chat";
mongoose.connect(dbURI);

var model = require('./model/model');

var routes = require('./routes/index');
var api = require('./routes/api');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var authenticate = require('./routes/auth')(passport);

//// Initialize Passport
var initPassport = require('./passport-init');
initPassport(passport);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function () {  
  console.log('Mongoose default connection open to ' + dbURI);
  startApp(true);
}); 

// If the connection throws an error
mongoose.connection.on('error',function (err) {  
  console.log('Mongoose default connection error: ' + err);
  startApp(false);
}); 

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {  
  console.log('Mongoose default connection disconnected'); 
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function startApp(isSuccess) {
  if (isSuccess) {
    server.listen(port, function() {
      console.log('Server started ' + port + ' at ' +
        (new Date().toLocaleString().substr(0, 24)));
    });
    server.on('error', onError);
    server.on('listening', onListening);
    
    io.attach(server, {
      'pingInterval': 15000,
      'pingTimeout': 15000
    });
  } else {
    console.log("Server failed to start.");
  }
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: '2chat_secret_$' }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);
app.use('/api', api);
app.use('/auth', authenticate);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

process.on('SIGINT', function() {  
  mongoose.connection.close(function () { 
    console.log('Mongoose 2chat db connection disconnected through app termination'); 
    process.exit(0); 
  }); 
}); 

io.on('connection', function(socket) {
  //Login Admin
  socket.on('login', function(data) {
    allUsers[data.username] = socket.id;
    console.log( allUsers[data.username] );
  }); 
  //Init admin
  socket.on('add admin', function(data) {
    this.isAdmin = data.isAdmin;
    socket.username = data.admin;

    _.each(admins, function(adminSocket) {
      adminSocket.emit("admin added", socket.username)
      socket.emit("admin added", adminSocket.username)
    });

    admins[socket.username] = socket;

    //If some user is already online on chat
    if (Object.keys(users).length > 0) {
      _.each(users, function(userSocket) {
        dbFunctions.getMessages(userSocket.roomID, 0)
          .then(function(history) {
            var len = history.length;
            var userSocket = users[history[len - 1]];
            history.splice(-1, 1);
            socket.join(userSocket.roomID);
            socket.emit("New Client", {
              roomID: userSocket.roomID,
              history: history,
              details: userSocket.userDetails,
              justJoined: true
            })
          })
      });
    }
  }); 
  //Init user
  socket.on('add user', function(data) {
    socket.isAdmin = false;
    if (data.isNewUser) {
      data.roomID = uuid.v4();
      dbFunctions.setDetails(data);
      socket.emit("roomID", data.roomID);
    }
    socket.roomID = data.roomID;
    //Fetch user details
    dbFunctions.getDetails(socket.roomID)
      .then(function(details) {
        socket.userDetails = details;
      })
      .catch(function(error) {
        console.log("Line 95 : ", error)
      })
      .done();
    socket.join(socket.roomID);
    var newUser = false;
    if (!users[socket.roomID]) {  // Check if different instance of same user. (ie. Multiple tabs)
      users[socket.roomID] = socket;
      newUser = true;
    }
    //Fetch message history
    dbFunctions.getMessages(socket.roomID, 0)
      .then(function(history) {
        history.splice(-1, 1)
        socket.emit('chat history', {
          history: history,
          getMore: false
        });
        if (Object.keys(admins).length == 0) {
          //Tell user he will be contacted asap and send admin email
          socket.emit('log message', "Thank you for reaching us." +
            " Please leave your message here and we will get back to you shortly.");
          /*mail.alertMail();*/
        } else {
          if (newUser) {
            socket.emit('log message', "Hello " + socket.userDetails[0] + ", How can I help you?");
            //Make all available admins join this users room.
            _.each(admins, function(adminSocket) {
              adminSocket.join(socket.roomID);
              adminSocket.emit("New Client", {
                roomID: socket.roomID,
                history: history,
                details: socket.userDetails,
                justJoined: false
              })
            });
          }
        }
      })
      .catch(function(error) {
        console.log("Line 132 : ", error)
      })
      .done();
    dbFunctions.getMsgLength(socket.roomID)
      .then(function(len) {
        socket.MsgHistoryLen = (len * -1) + 10;
        socket.TotalMsgLen = (len * -1);
      })
      .catch(function(error) {
        console.log("Line 140 : ", error)
      })
      .done();
  });

  socket.on('chat message', function(data) {
    console.log(allUsers);
    console.log(data);
    console.log(data.reciever);
    console.log(allUsers[data.reciever]);
    socket.broadcast.to(allUsers[data.reciever]).emit('chat message', data);
  });

  socket.on("typing", function(data) {
    socket.broadcast.to(data.roomID).emit("typing", {
      isTyping: data.isTyping,
      person: data.person,
      roomID: data.roomID
    });
  });

  socket.on('disconnect', function() {
    if (socket.isAdmin) {
      delete admins[socket.username];
      _.each(admins, function(adminSocket) {
        adminSocket.emit("admin removed", socket.username)
      });
    } else {
      if (io.sockets.adapter.rooms[socket.roomID]) {
        var total = io.sockets.adapter.rooms[socket.roomID]["length"];
        var totAdmins = Object.keys(admins).length;
        var clients = total - totAdmins;
        if (clients == 0) {
          //check if user reconnects in 4 seconds 
          setTimeout(function() {
            if (io.sockets.adapter.rooms[socket.roomID])
              total = io.sockets.adapter.rooms[socket.roomID]["length"];
            totAdmins = Object.keys(admins).length;
            if (total <= totAdmins) {
              /*mail.sendMail({
                roomID: socket.roomID,
                MsgLen: socket.TotalMsgLen,
                email: socket.userDetails
              });*/
              delete users[socket.roomID];
              socket.broadcast.to(socket.roomID).emit("User Disconnected", socket.roomID);
              _.each(admins, function(adminSocket) {
                adminSocket.leave(socket.roomID)
              });
            }
          }, 4000);
        }
      } else {
        if (socket.userDetails)
          /*mail.sendMail({
            roomID: socket.roomID,
            MsgLen: socket.TotalMsgLen,
            email: socket.userDetails
          });*/
        delete users[socket.roomID];
      }
    }
  });

  socket.on('poke admin', function(targetAdmin) {
    admins[targetAdmin].emit("poke admin", {})
  });

  socket.on('client ack', function() {
    for (adminSocket in admins) {
      if (!admins.hasOwnProperty(adminSocket)) {
        continue;
      }
      admins[adminSocket].emit("client ack", {})
    }
  });

  socket.on("more messages", function() {
    if (socket.MsgHistoryLen < 0) {
      dbFunctions.getMessages(socket.roomID, socket.MsgHistoryLen)
        .then(function(history) {
          history.splice(-1, 1)
          socket.emit('more chat history', {
            history: history
          });
        })
      socket.MsgHistoryLen += 10;
    }
  });
});

module.exports = app;
