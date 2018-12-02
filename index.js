
var app             = require('express')(),
    bodyParser      = require('body-parser'),
    morgan          = require('morgan');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

Object.assign = require('object-assign');

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));

var db = null;

var initDb = function(callback) {
    var mongoURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/ncore-ext';
    var mongodb = require('mongodb');
    if (mongodb == null) return;

    mongodb.connect(mongoURL, function(err, conn) {
        if (err) return callback(err);

        db = conn;
        console.log('Connected to MongoDB');
        callback(null);
    });
};

app.get('/', function (req, res) {
    res.render('index.html');
});

// error handling
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).send('Something bad happened!');
});

initDb(function(err){
    if(err) return console.log('Error connecting to Mongo. Message:\n'+err);

    require('./api/favorites')(app, db);
    require('./api/downloads')(app, db);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));