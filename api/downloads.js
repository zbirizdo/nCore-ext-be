
module.exports = function(app, db) {
    require('./baseCrud')('downloads', db).forEach(function(cfg) {
        app[cfg.method](cfg.path, cfg.controller);
    });
};