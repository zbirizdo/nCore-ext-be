ObjectID = require('mongodb').ObjectID;

module.exports = function(name, db) {

    var token = '08841av2mg2VHUYE5APIpHik38KatgKX9wTNmyWXy5F67UUoGaN9xq7wpdqIbPdw';

    function createOneOrMay(req, res) {
        if (req.headers.authorization !== token) return res.status(500).send('Auth error');
        if (!db) return res.status(500).send('DB init error');

        var isOne = !Array.isArray(req.body);
        db.collection(name)[isOne ? 'insertOne' : 'insertMany'](req.body, function (err, result) {
            if(err) return res.send('insert error: ' + err);
            setLastUpdate();
            res.send(isOne ? result.ops[0] : result.ops);
        });
    }
    
    function readAll(req, res) {
        if (req.headers.authorization !== token) return res.status(500).send('Auth error');
        if (!db) return res.status(500).send('DB init error');

        db.collection(name).find({}).toArray(function(err, result){
            if(err) return res.status(500).send('find error: ' + err);
            res.send(result);
        });
    }
    
    function readOne(req, res) {
        if (req.headers.authorization !== token) return res.status(500).send('Auth error');
        if (!db) return res.status(500).send('DB init error');

        db.collection(name).find(ObjectID(req.params.resId)).next(function(err, result){
            if(err) return res.status(500).send('find error: ' + err);
            res.send(result);
        });
    }
    
    function updateOne(req, res) {
        if (req.headers.authorization !== token) return res.status(500).send('Auth error');
        if (!db) return res.status(500).send('DB init error');

        delete req.body._id;
        db.collection(name).updateOne({_id: ObjectID(req.params.resId)}, req.body, { upsert: true }, function(err){
            if(err) return res.send('updateOne error: ' + err);
            db.collection(name).find(ObjectID(req.params.resId)).next(function(err, result){
                if(err) return res.status(500).send('find error: ' + err);
                setLastUpdate();
                res.send(result);
            });
        });
    }

    function updateOrCreateMany(req, res) {
        if (req.headers.authorization !== token) return res.status(500).send('Auth error');
        if (!db) return res.status(500).send('DB init error');

        db.collection(name).bulkWrite(req.body.map(function(res) {
            var id = res._id;
            delete res._id;
            return {
                updateOne: { filter: { _id: ObjectID(id) }, update: res, upsert: true }
            };
        }), function (err) {
            if(err) return res.status(500).send('bulkWrite error: ' + err);
            setLastUpdate();
            res.send({result: 'OK'});
        });

    }
    
    function deleteOne(req, res) {
        if (req.headers.authorization !== token) return res.status(500).send('Auth error');
        if (!db) return res.status(500).send('DB init error');

        db.collection(name).removeOne({_id: ObjectID(req.params.resId)}, function(err, result){
            if(err) return res.status(500).send('updateOne error: ' + err);
            res.send({result: 'OK'});
        });
    }

    function lastUpdate(req, res) {
        if (req.headers.authorization !== token) return res.status(500).send('Auth error');
        if (!db) return res.status(500).send('DB init error');

        db.collection('lastUpdates').find({name: name}).next(function(err, result){
            if(err) return res.status(500).send('find error: ' + err);
            res.send(result);
        });
    }

    function setLastUpdate() {
        db.collection('lastUpdates').updateOne({name: name}, {name: name, date: new Date()}, { upsert: true }, function(err){
            if(err) console.log('Error setting last update on ' + name, err);
        });
    }
    
    return {
        token: token,
        name: name,
        setLastUpdate: setLastUpdate,
        routes: {
            createOneOrMay: {
                method: 'post',
                path: '/' + name,
                controller: createOneOrMay
            },
            readAll: {
                method: 'get',
                path: '/' + name,
                controller: readAll
            },
            updateOrCreateMany: {
                method: 'put',
                path: '/' + name,
                controller: updateOrCreateMany
            },
            readOne: {
                method: 'get',
                path: '/' + name + '/:resId',
                controller: readOne
            },
            updateOne: {
                method: 'put',
                path: '/' + name + '/:resId',
                controller: updateOne
            },
            deleteOne: {
                method: 'delete',
                path: '/' + name + '/:resId',
                controller: deleteOne
            },
            lastUpdate: {
                method: 'get',
                path: '/lastUpdate/' + name,
                controller: lastUpdate
            }
        }
    };
};