"use strict";
var express         = require('express'),
    bodyParser      = require('body-parser'),
    morgan          = require('morgan'),
    path            = require('path'),
    CORS            = require('cors'),
    passport        = require('passport'),
    flash           = require('connect-flash'),
    cookieParser    = require('cookie-parser'),
    session         = require('express-session'),
    app             = express(),
    router          = express.Router(),
    Config          = require(path.join(__dirname, 'config', 'Config')),
    Enumerator      = require('./lib/omr-base/class/Enumerator'),
    mongo;

/**
 *
 * @exports setup
 * @exports runHTTP
 * @exports runHTTPS
 */
var Server = module.exports = {
    /**
     * Server Setup
     */
    setup: function() {
        Config.init();

        mongo = require('./lib/omr-base/class/Database')(Config.MongoDB);
        require('./lib/omr-base/class/Log')({
            db: mongo.db,
            connectionString: Config.MongoDB,
            label: Enumerator.LogType.ADMIN_UI,
            level: Config.KeepLogLevel
        });

        process.chdir(__dirname);
        app.use(CORS());
        app.use(bodyParser.json());
        app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(cookieParser());

        if (Config.Env !== 'production') app.use(morgan(Config.Env));

        require('./security/passport')(passport);
        app.use(session({ secret: Config.Auth.GLOBAL.SECRET, resave: true, saveUninitialized: true }));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(flash());

        app.set('view engine', 'ejs');
        app.use(express.static('static'));
        app.set('views', __dirname + '/view');

        require('./route/Route')(router, passport);

        app.locals.Helper = require('./view/helper/HelperManager');

        app.use('/', router);
    },

    /**
     * Http Server Init
     */
    runHTTP: function () {
        var http        = require(path.join(__dirname, 'Server'));
        http.run(
            app,
            Config.Port
        );
    }
};

Server.setup();
Server.runHTTP();