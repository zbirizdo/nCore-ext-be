
module.exports = function() {

    var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
        ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
        mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGODB_URI,
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

    if(!mongoURL && !!process.env.DEV_MODE === true) {
        mongoURL = 'mongodb://localhost:27017/sampledb';
    }

    return {
        ip: ip,
        port: port,
        mongoURL: mongoURL,
        mongoURLLabel: mongoURLLabel
    }
};