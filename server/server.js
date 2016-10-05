// var webpack = require('webpack');
// var WebpackDevServer = require('webpack-dev-server');
// var config = require('./webpack.config');

// var server = new WebpackDevServer(webpack(config), {
//   publicPath: config.output.publicPath,
//   hot: true,
//   historyApiFallback: true
// }).listen(3000, 'localhost', function (err, result) {
//   if (err) {
//     return console.log(err);
//   }
//   console.log('Listening at http://localhost:3000/');
// });
var webpack = require('webpack'),
    webpackDevMiddleware = require('webpack-dev-middleware'),
    webpackHotMiddleware = require('webpack-hot-middleware'),
    webpackconfig = require('../webpack.config.js'),
    webpackcompiler = webpack(webpackconfig);

// var db = require('./db/index.js');
var helper = require('./utils/helper.js')

//enable webpack middleware for hot-reloads in development
function useWebpackMiddleware(app) {
    app.use(webpackDevMiddleware(webpackcompiler, {
        publicPath: webpackconfig.output.publicPath,
        stats: {
            colors: true,
            chunks: false, // this reduces the amount of stuff I see in my terminal; configure to your needs
            'errors-only': true
        }
    }));
    app.use(webpackHotMiddleware(webpackcompiler, {
        log: console.log
    }));
 
    return app;
}

var fs = require('fs'); // To load the key and cert files
var https = require('https'); // https required for WebRTC
var os = require('os');

var bodyParser = require('body-parser');

var path = require('path');
var express = require('express');
var app = express();
//var http = require('http').Server(app);
var db = require('./db/index.js');

var passport = require('passport');
var passportGithub = require('./auth/github');
var session = require('express-session');

var httpsServer = https.createServer({
  key: fs.readFileSync('./server/key.pem'),
  cert: fs.readFileSync('./server/cert.pem')
}, app);

app.use(session({
  secret: 'the_best_ajaxta_secret_ever',
  resave: true,
  saveUninitialized: true,
  cookie: { secure: true, maxAge: 1000 * 60 * 60 * 24 }
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/github', passportGithub.authenticate('github', { scope: [ 'user:email' ] }));

app.get('/auth/github/callback',
  passportGithub.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication
    console.log(res.req.session.passport.user, '<---')

    res.redirect('/secure');
  }
);

app.get('/login', function(req, res) {
  res.send('Go back and register!');
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/secure', helper.checkLogin, function(req, res) {
  // res.send('Successfully logged in');
  res.redirect('/')
});
app.get('/access', helper.checkLogin, function(req, res) {
  res.send(req.session.passport.user);
})

var history = {
  // 'history1': []
}
    // webpackDevHelper = require('./index.dev.js');
useWebpackMiddleware(app);

app.use(express.static('./src/client'));
//add bodyParser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// This never triggers?
app.get('/', function(req, res) {
	res.send('Hello World');
});

// var check = function(req, res, next) {
//   console.log('got thru check');
//   next();
// };



app.get('/doclist', function(req, res) {
  console.log(req.user, '<=== req.user from doclist in server.js');
  helper.fetchrooms(function(docs){
    res.send(docs);
  })
})

app.post('/savedoc', helper.checkLogin, function(req, res) {
  db.Doc.update({
    doc_name:req.body.room,
    doc_content: req.body.contents
  },
  {
    where: {doc_name:req.body.room}
  }).then(function() {
    res.send('/savedoc success!')
  });


})

var oTransform = function(newObj, oldObj, callback){
  console.log('newop', newOp);
  console.log('old', oldOp);
  var newOp = newObj.op;
  var oldOp = oldObj.op;

  var newInsertion = newOp.retain;
  var oldInsertion = oldOp.retain;

  console.log('newInsertion', newInsertion);
  console.log('oldinsertion', oldInsertion);
  if(newInsertion >= oldInsertion){
    newInsertion++;
    newOp.retain = newInsertion;
  } else {
    oldInsertion++;
    oldOp.retain = oldInsertion;
  }
  console.log('2newop', newOp);
  console.log('2old', oldOp);
  callback(newObj);
  // if(oldOp.)
  //if item has insert as key
  //ir item has retain as key
}

app.post('/addops', function(req, res){
  console.log('inFlightOp');
  var inFlightOp = req.body.inFlightOp;
  console.log('pre inFlightOp', inFlightOp.history );
  console.log('pre inFlightOp', inFlightOp );
  console.log('pre inFlightOp', inFlightOp['history'] );
  console.log('pre inFlightOp', history[inFlightOp.history], history[inFlightOp.history] === true);

  if(history[inFlightOp.history] !== undefined){
    //change was there already
      console.log('before transformed. should be obj', inFlightOp);
    //transform
    oTransform(inFlightOp, history[inFlightOp.history][0], function(transformed){
      console.log('transformed. should be obj', transformed);
      history[inFlightOp.history].push(transformed)
    })

  } else {
    history[inFlightOp.history] = [inFlightOp];

  }

  console.log('post inFlightOp', history);
  res.send(history)
})

var docExists = function(user, room, callback) {
  // callback
  helper.docExists(user, room, callback);
}

app.get('/roomExists', function(req, res){
  var user = req.query.user;
  var room = req.query.room;

  docExists(user, room, function(exists){
     //console.log('exists', exists);
     if(!exists){
       // helper.addDocToDB(req.query.user, req.query.room, function(newDoc){
         // helper.addDoctoUser(req.query.user, req.query.room, function(result){
           res.send(false);
         // })
       // })
     } else {
       res.send(true);
     }  
  });
})

  app.post('/addroom', function(req, res){
    var room = req.body.room;
    //console.log('server sees username to save', room)
    helper.addDocToDB(room, function(result){
      res.send(result);
    });
  });

  app.post('/addroomtouser', function(req, res){
    var room = req.body.room;
    var user = req.body.user;
    //console.log('server sees username to save', room, user)
    helper.addDoctoUser(user, room, function(result){
      res.send(result);
    });


  // helper.addDocToDB(req.query.user, req.query.room, function(newDoc){
  //   helper.addDoctoUser(req.query.user, req.query.room, function(result){
  //     res.send(false);
  //   })
  // })


  // helper.docExists(req.query.user, req.query.room, function(exists){
  //   console.log('exists', exists);
  //   if(!exists){
  //     helper.addDocToDB(req.query.user, req.query.room, function(newDoc){
  //       helper.addDoctoUser(req.query.user, req.query.room, function(result){
  //         res.send(false);
  //       })
  //     })
  //   } else {
  //     res.send(true);
  //   } 
  // })
});

app.post('/addroomtouser', function(req, res){
  // helper.
  var room = req.body.room;
  var user = req.body.user;
  //console.log('in add room to user', room, user)
  helper.addDoctoUser(user, room, function(result){
    res.send(result);
  });
})

app.post('/adduser', function(req, res){
  var user = req.body.user;
  //console.log('server sees username to save', user)
  helper.saveuser(user, function(result){
    res.send(result);
  });
})

// Begin socket component
var io = require('socket.io')(httpsServer);
var commands = [];

io.on('connection', function(socket){

  // *********** Begin WebRTC Socket ************
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

  socket.on('message', function(message) {

    log('Client said: ', message);

    // clientRooms is an array of all the rooms I am in.
    var clientRooms = Object.keys(socket.rooms).filter(function(aRoom) {
      return (aRoom === socket.id) ? false : true;
    });
    
    // Relay the message to each user in my room
    clientRooms.forEach(function(aRoom) {
      socket.broadcast.to(aRoom).emit('message', message);
    });
  });

  socket.on('create or join', function(room) {
    //console.log(room, '===== ROOM');
    // var fetch = function(exists) {
    //   if(exists){
    //     console.log('doc exists')
    //     helper.fetchDocContent(room, socket);
    //   } else {
    //     console.log('doc does not exists')

    //     // socket.disconnect();
    //     //emit room doesn't exist.
    //     //create listener for roomdoes't exist;
    //   }
    // }
    // var exists = helper.docExists(room, fetch);
    // console.log('exists', exists);

    console.log('create or join');

    log('Received request to create or join room ' + room);
    console.log('Received request to create or join room ' + room);

    var users = Object.keys(socket.rooms).length;
    var numClients;
    var socketRoom = io.sockets.adapter.rooms[room];
    console.log(io.sockets.adapter.rooms);

    if (socketRoom) {
      numClients = socketRoom.length + 1;
    } else {
      numClients = 1;
    }

    console.log('numClients', numClients)
    //var numClients = io.sockets.sockets.length;
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 1) {
      console.log('one client')
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      
      //socket.emit('created', room, socket.id);

      io.sockets.in(room).emit('created', room, socket.id);

      // docExists(socket.id, room, function(exists){
      //   if(exists){
      db.Doc.findOne({where: {
        doc_name: room
      }})
      .then(function(doc) {
        //console.log('found doc', doc)
        io.to(socket.id).emit('found latest doc', doc);
      });

    } else if (numClients === 2) {

      //console.log('more than one user!')
      //console.log('two clients',room, socket.id)
      socket.join(room);

      //console.log('---AFTER JOIN ROOM -----')
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.sockets.in(room).emit('join', room);
            //console.log('---AFTER JOIN emit -----')

      //socket.emit('joined', room, socket.id);
      io.sockets.in(room).emit('joined', room, socket.id);
            //console.log('---AFTER JOINed emit -----')

      io.sockets.in(room).emit('ready');
            //console.log('---AFTER ready emit -----')

      socket.broadcast.to(room).emit('fetch live version', socket.id);
            //console.log('---AFTER fetch live emit -----')

    } else { // max two clients for video.  3+ join as code-collab only
      //io.sockets.in(room).emit('full', room);
      socket.join(room);
      socket.broadcast.to(room).emit('fetch live version', socket.id);
      //socket.emit('full', room);
    }
    console.log('Room ' + room + ' now has ' + numClients + ' users.');

  });

  socket.on('live version', function(latest){
    //console.log('got live v---------', latest);
    var requestId = latest.requestId;
    var delta = latest.delta;
    io.to(requestId).emit('fetched live', delta)
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          io.sockets.in(room).emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('bye', function(){
    console.log('received bye');
  });
  // *********** End WebRTC Socket ************
  
  // *********** Begin Quill Socket ************
  //console.log('a user connected');
  socket.on('typed', function(delta) {
    commands.push(delta)
    console.log(commands);
    // socket.broadcast.emit('receive',delta);
    // console.log('socket id', socket.id)
    // console.log('socket rooms', socket.rooms)

    var clientID = socket.id;
    var clientRooms = Object.keys(socket.rooms).filter(function(aRoom) {
      return (aRoom === clientID) ? false : true;
    });
    console.log('rooms', clientRooms, clientID)
    clientRooms.forEach(function(aRoom) {
      console.log('===========', aRoom, clientID)
      socket.broadcast.to(aRoom).emit('receive', delta);
    });
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('changesToApply', function(index){
    console.log('oldIndex', index);
    socket.broadcast.emit('done', index);
  })

  // socket.emit('fetch rooms', 'get existing rooms');
  // socket.on('got room list', function(docs){  

  // *********** End Quill Socket ************
});


// app.use('/api/', require('./config/router'))

httpsServer.listen(3000, function () {
  console.log('Example https app listening on port 3000!');
});