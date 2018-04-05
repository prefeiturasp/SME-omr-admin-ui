"use strict";
var SAMLStrategy,
    Config,
    Enumerator,
    CoreSSO,
    coreSSO,
    req;

SAMLStrategy = require('passport-saml').Strategy;
Config = require('../../config/Config');
Enumerator = require('../../class/Enumerator');
CoreSSO = require('../coresso/CoreSSO');

module.exports = function(passport, User) {

    var SAML = Config.Auth.METHOD[Enumerator.AuthenticationType.CORESSO_SAML];
    var done, userInfo;

    /**
     * User SAML Signin
     */
    passport.use(new SAMLStrategy(
        {
            path: '/auth/signin',
            entryPoint: 'http://' + SAML.IDP_DOMAIN + SAML.IDP_LOGIN_PATH,
            logoutUrl: 'http://' + SAML.IDP_DOMAIN + SAML.IDP_LOGOUT_PATH,
            issuer: SAML.ISSUER,
            additionalParams: {
                RelayState: '/'
            },
            passReqToCallback: true
        },
        onPassportCallback
    ));

    /**
     * On Passport SAML Callback
     * @param _req {Object} ExpressJS Request Object
     * @param _profile {Object} User Profile Information
     * @param _done {Function} Authentication Callback
     * @callback
     */
    function onPassportCallback(_req, _profile, _done) {
        req = _req;
        done = _done;
        userInfo = _profile.nameID.split('\\');

        userInfo = {
            ent_id: userInfo[0],
            usu_login: userInfo[1]
        };

        coreSSO = new CoreSSO(onCoreSSOConnection);
    }

    /**
     * On CoreSSO Database Connection
     * @param err           {Error}     Error Object
     */
    function onCoreSSOConnection(err) {
        if (err) onError(err);
        else {
            coreSSO.GetUserData(userInfo.usu_login, userInfo.ent_id)
                .then(onUserData)
                .catch(onError);
        }
    }

    /**
     * On CoreSSO Get User Data
     * @param userData      {Object}    CoreSSO User Data
     */
    function onUserData(userData) {
        userInfo.usu_id = userData.usu_id;
        userInfo.pes_nome = userData.pes_nome;

        coreSSO.GetUserGroupsBySystem(userData.usu_id, SAML.SYSTEM)
            .then(onUserGroups)
            .catch(onError);
    }

    /**
     * On CoreSSO Get User Groups
     * @param groups        {Array}     CoreSSO User Groups
     */
    function onUserGroups(groups) {
        var haveRights, groupLen;
        if (groups.length <= 0) onError(new Error("User HAVE NO RIGHTS"), Enumerator.LogLevel.WARNING);
        else {
            haveRights = false;
            groupLen = groups.length;
            for (let i = 0; i < groupLen; i++) {
                if (groups[i].gru_id == SAML.GROUP.ADMINISTRATOR) {
                    haveRights = true;
                    break;
                }
            }

            if (!haveRights) onError(new Error("User HAVE NO RIGHTS"), Enumerator.LogLevel.WARNING);
            else {
                coreSSO.GetUserSystems(userInfo.usu_id, SAML.SYSTEM)
                    .then(onUserSystems)
                    .catch(onError);
            }

        }
    }

    /**
     * On CoreSSO Get User Systems
     * @param systems       {Array}     CoreSSO User Systems
     */
    function onUserSystems(systems) {
        var systemList;
        systemList = [];
        systems.forEach(function (sys) {
            systemList.push({
                name: sys.sis_nome,
                url: sys.sis_caminho
            });
        });

        getUser(userInfo.usu_id)
            .then(function (users) {
                if (users.length == 0) createUser(systemList);
                else updateUser(users[0]._doc, systemList);
            })
            .catch(onError);

    }

    /**
     * Get User from Local Database
     * @param usuId         {String}    User ID (GUID/UUID)
     * @return {Promise}
     */
    function getUser(usuId) {
        return new Promise(function (resolve, reject) {
            User.GetByQuery(
                {
                    'authentication.saml.externalId': usuId.toLowerCase()
                },
                null,
                1,
                null,
                function (err, users) {
                    if (err) reject(err);
                    else resolve(users);
                }
            );
        });
    }

    /**
     * Create User in Local Database
     * @param systemList    {Array}     CoreSSO User Systems
     */
    function createUser(systemList) {
        User.Create(
            {
                name: userInfo.pes_nome || userInfo.usu_login,
                authentication: {
                    security: {
                        isAdmin: true
                    },
                    saml: {
                        login: userInfo.usu_login,
                        externalId: userInfo.usu_id.toLowerCase(),
                        context: userInfo.ent_id.toLowerCase(),
                        systems: systemList
                    }
                }
            },
            function (err, doc) {
                if (err) onError(err);
                else finishLogin(doc);
            }
        );
    }


    /**
     * Update User in Local Database
     * @param doc           {Object}    MongoDB Current User Document
     * @param systemList    {Array}     CoreSSO User Systems
     */
    function updateUser(doc, systemList) {
        userInfo._id = doc._id;

        doc.name = userInfo.pes_nome || userInfo.usu_login;
        doc.authentication.saml.login = userInfo.usu_login;
        doc.authentication.saml.systems = systemList;

        User.Update(
            doc._id,
            doc,
            function (err, updatedDoc) {
                if (err) onError(err);
                else finishLogin(updatedDoc);
            }
        );
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
        SetLog(Enumerator.LogLevel.INFORMATION, `User logged in: ${user._id}`);
        done(null, user);
    }

    /**
     * Set SAML Login Logs
     * @param level         {Number}
     * @param log
     */
    function SetLog(level, log) {
        var status, message;

        if (level == Enumerator.LogLevel.INFORMATION) status = '200';
        else if (level == Enumerator.LogLevel.WARNING) status = '403';
        else status = '500';

        message = log.hasOwnProperty('message')? log.message: log;

        logger.log(level, message, {
            resource: {
                path: req.path,
                method: req.method,
                queryString: req.query
            },
            detail: {
                user: {
                    _id: userInfo._id || userInfo.usu_id,
                    login: userInfo.usu_login,
                    authType: Enumerator.AuthenticationType.CORESSO_SAML
                },
                header: req.headers,
                httpStatusCode: status,
                description: log
            }
        });
    }
};