"use strict";
var LocalStrategy    = require('passport-local').Strategy,
    Enumerator = require('../../class/Enumerator'),
    Config = require('../../config/Config');

module.exports = function(passport, User) {
    var req, done, userInfo = {};
    /**
     * User Local Signin
     */
    passport.use(new LocalStrategy(
        {
            usernameField : 'login',
            passwordField : 'password',
            passReqToCallback: true
        },
        onPassportCallback
    ));

    /**
     * On Passport Local Callback
     * @param _req {Object} ExpressJS Request Object
     * @param login {Object} User Login
     * @param password {String} User Password
     * @param _done {Function} Authentication Callback
     */
    function onPassportCallback(_req, login, password, _done) {
        req = _req;
        done = _done;
        userInfo.login = login;

        if (login) login = login.toLowerCase();

        User.Login({
            login: login,
            password: password
        }, function (err, data) {
            if (err) onError(err);
            else finishLogin(data);
        }, true);
    }

    /**
     * On Error
     * @param err           {Error}     Error Object
     * @param level         {Number=}   Log Level, Default 0. Enumerator.LogLevel.ERROR
     */
    function onError(err, level) {
        if (!level) level = Enumerator.LogLevel.ERROR;
        SetLog(level, err);
        done(null, false, req.flash('message', err.message));
    }

    /**
     * Finish SAML Login Process
     * @param user          {Object}    User Model
     */
    function finishLogin(user) {
        userInfo._id = user._id;
        SetLog(Enumerator.LogLevel.INFORMATION, `User logged in`);
        done(null, user);
    }

    /**
     * Set SAML Login Logs
     * @param level         {Number}
     * @param log
     */
    function SetLog(level, log) {
        var status, user, message;

        if (level == Enumerator.LogLevel.INFORMATION) status = '200';
        else if (level == Enumerator.LogLevel.WARNING) status = '403';
        else status = '500';

        user = {
            login: userInfo.login,
            authType: Enumerator.AuthenticationType.LOCAL
        };
        if (userInfo._id) user._id = userInfo._id;

        message = log.hasOwnProperty('message')? log.message: log;

        logger.log(level, message, {
            resource: {
                path: req.path,
                method: req.method,
                queryString: req.query
            },
            detail: {
                user: user,
                header: req.headers,
                httpStatusCode: status,
                description: log
            }
        });
    }
};