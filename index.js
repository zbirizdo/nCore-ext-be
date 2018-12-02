var app             = require('express')(),
    bodyParser      = require('body-parser'),
    morgan          = require('morgan');

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

Object.assign   = require('object-assign');

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));

app.get('/', function (req, res) {
    res.render('index.html');
});

// error handling
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500).send('Something bad happened!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))