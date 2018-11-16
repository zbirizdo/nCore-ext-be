//  OpenShift sample Node application
var express     = require('express'),
    app         = express(),
    bodyParser  = require('body-parser'),
    morgan      = require('morgan'),
    ObjectID    = require('mongodb').ObjectID;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
    
Object.assign=require('object-assign');

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL || (process.env.DEV_MODE ? 'mongodb://localhost:27017/sampledb' : null),
    mongoURLLabel = "";

if (mongoURL == null) {
  var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
  // If using plane old env vars via service discovery
  if (process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
    mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
    mongoUser = process.env[mongoServiceName + '_USER'];

  // If using env vars from secret from service binding  
  } else if (process.env.database_name) {
    mongoDatabase = process.env.database_name;
    mongoPassword = process.env.password;
    mongoUser = process.env.username;
    var mongoUriParts = process.env.uri && process.env.uri.split("//");
    if (mongoUriParts.length == 2) {
      mongoUriParts = mongoUriParts[1].split(":");
      if (mongoUriParts && mongoUriParts.length == 2) {
        mongoHost = mongoUriParts[0];
        mongoPort = mongoUriParts[1];
      }
    }
  }

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

app.post('/favorites', function(req, res) {
    if (!db) return res.send('DB init error');

    var isOne = !Array.isArray(req.body);
    db.collection('favorites')[isOne ? 'insertOne' : 'insertMany'](req.body, function (err, result) {
        if(err) return res.send('insert error: ' + err);
        res.send(isOne ? result.ops[0] : result.ops);
    });
});

app.get('/favorites', function (req, res) {
    if (!db) return res.send('DB init error');

    db.collection('favorites').find({}).toArray(function(err, result){
        if(err) return res.send('find error: ' + err);
        res.send(result);
    });
});

app.get('/favorites/:favoriteId', function(req, res) {
    if (!db) return res.send('DB init error');

    db.collection('favorites').find(ObjectID(req.params.favoriteId)).next(function(err, result){
        if(err) return res.send('find error: ' + err);
        res.send(result);
    });
});

app.put('/favorites/:favoriteId', function(req, res) {
    if (!db) return res.send('DB init error');

    delete req.body._id;
    db.collection('favorites').updateOne({_id: ObjectID(req.params.favoriteId)}, req.body, { upsert: true }, function(err){
        if(err) return res.send('updateOne error: ' + err);
        db.collection('favorites').find(ObjectID(req.params.favoriteId)).next(function(err, result){
            if(err) return res.send('find error: ' + err);
            res.send(result);
        });
    });
});

app.delete('/favorites/:favoriteId', function(req, res) {
    if (!db) return res.send('DB init error');

    db.collection('favorites').removeOne({_id: ObjectID(req.params.favoriteId)}, function(err, result){
        if(err) return res.send('updateOne error: ' + err);
        console.log('result', result);
        res.send({result: 'OK'});
    });
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
