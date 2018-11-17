ObjectID = require('mongodb').ObjectID;

module.exports = function(name, db) {

    function createOneOrMay(req, res) {
        if (!db) return res.send('DB init error');

        var isOne = !Array.isArray(req.body);
        db.collection(name)[isOne ? 'insertOne' : 'insertMany'](req.body, function (err, result) {
            if(err) return res.send('insert error: ' + err);
            res.send(isOne ? result.ops[0] : result.ops);
        });
    }
    
    function readAll(req, res) {
        if (!db) return res.send('DB init error');

        db.collection(name).find({}).toArray(function(err, result){
            if(err) return res.send('find error: ' + err);
            res.send(result);
        });
    }
    
    function readOne(req, res) {
        if (!db) return res.send('DB init error');

        db.collection(name).find(ObjectID(req.params.resId)).next(function(err, result){
            if(err) return res.send('find error: ' + err);
            res.send(result);
        });
    }
    
    function updateOne(req, res) {
        if (!db) return res.send('DB init error');

        delete req.body._id;
        db.collection(name).updateOne({_id: ObjectID(req.params.resId)}, req.body, { upsert: true }, function(err){
            if(err) return res.send('updateOne error: ' + err);
            db.collection(name).find(ObjectID(req.params.resId)).next(function(err, result){
                if(err) return res.send('find error: ' + err);
                res.send(result);
            });
        });
    }
    
    function deleteOne(req, res) {
        if (!db) return res.send('DB init error');

        db.collection(name).removeOne({_id: ObjectID(req.params.resId)}, function(err, result){
            if(err) return res.send('updateOne error: ' + err);
            res.send({result: 'OK'});
        });
    }
    
    return [{
        method: 'post',
        path: '/' + name,
        controller: createOneOrMay
    }, {
        method: 'get',
        path: '/' + name,
        controller: readAll
    }, {
        method: 'get',
        path: '/' + name + '/:resId',
        controller: readOne
    }, {
        method: 'put',
        path: '/' + name + '/:resId',
        controller: updateOne
    }, {
        method: 'delete',
        path: '/' + name + '/:resId',
        controller: deleteOne
    }];
};