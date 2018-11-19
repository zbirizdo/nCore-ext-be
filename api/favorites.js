
module.exports = function(app, db) {

    var crud = require('./baseCrud')('favorites', db);

    crud.routes.updateOrCreateMany.controller = function(req, res) {
        if (req.headers.authorization !== crud.token) return res.status(500).send('Auth error');
        if (!db) return res.status(500).send('DB init error');

        db.collection(crud.name).bulkWrite(req.body.map(function(res) {
            var id = res._id;
            delete res._id;
            return {
                updateOne: {
                    filter: {$or: [
                        { _id: ObjectID(id) },
                        { exp: res.exp }
                    ]},
                    update: res,
                    upsert: true
                }
            };
        }), function (err) {
            if(err) return res.status(500).send('bulkWrite error: ' + err);

            db.collection(crud.name).find({}).toArray(function(err, result){
                if(err) return res.status(500).send('find error: ' + err);
                res.send(result);
            });
        });
    };

    Object.keys(crud.routes).forEach(function(routeName) {
        var cfg = crud.routes[routeName];
        app[cfg.method](cfg.path, cfg.controller);
    });
};