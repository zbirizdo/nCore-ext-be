
module.exports = function(app, db) {
    require('./baseCrud')('favorites', db).forEach(function(cfg) {
        app[cfg.method](cfg.path, cfg.controller);
    });
};