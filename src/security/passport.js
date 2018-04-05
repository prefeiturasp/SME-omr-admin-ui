"use strict";
var UserBO = require('../lib/omr-base/business/User.bo'),
    Config = require('../config/Config'),
    Enumerator = require('../class/Enumerator'),
    User = new UserBO(Config, Enumerator);

module.exports = function(passport) {

    passport.serializeUser(serializeUser);

    passport.deserializeUser(deserializeUser);

    /**
     * Serialize User in Session
     * @param user {Object} User Object
     * @param done {Function} Process Callback
     * @callback
     */
    function serializeUser(user, done) {
        done(null, user._id);
    }

    /**
     * Deserialize User in Session
     * @param id {String|ObjectId|Number} User Identification
     * @param done {Function} Process Callback
     * @callback
     */
    function deserializeUser(id, done) {
        User.GetById(id, function(err, user) {
            done(err, user);
        });
    }

    if (Config.Auth.TYPE == Enumerator.AuthenticationType.LOCAL) require('./strategy/local.passport')(passport, User);
    else if (Config.Auth.TYPE == Enumerator.AuthenticationType.CORESSO_SAML) require('./strategy/coresso-saml.passport')(passport, User);
};