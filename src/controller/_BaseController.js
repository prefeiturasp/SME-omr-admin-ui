"use strict";
var Config,
    Enumerator;

Config = require('../config/Config');
Enumerator = require('../class/Enumerator');

class BaseController {

    /**
     * BaseController
     * @class BaseController
     * @param business          {Object}        Business Instance
     * @param router            {Router}        ExpressJS Router Reference
     * @param baseViewPath      {String}        Base View Path
     * @param baseRoutePath     {String=}       Base Route Path
     * @constructor
     */
    constructor(business, router, baseViewPath, baseRoutePath) {
        if (business) this.BO = new business(Config);
        this.Router = router;
        this.BaseViewPath = baseViewPath;
        this.BaseRoutePath = baseRoutePath || '';
    }

    /**
     * Bind Path in ExpressJS Router
     * @param path              {String=}       Route Path, default is ''
     * @param ignoreBase        {Boolean=}      Ignore Base Route Path, default false
     * @return {Route}                          ExpressJS Route Instance
     */
    Bind(path, ignoreBase) {
        if (!ignoreBase) path = this.BaseRoutePath + (path || '');
        return this.Router.route(path);
    }

    /**
     * Send Response to Express
     * @param req               {Object}         Express Request Object
     * @param res               {Object}         Express Response Object
     * @param view              {String}         View File Path
     * @param object            {Object=}        Response Object
     * @param log               {String|Object=} Log Information
     * @param level             {Number=}        Enumerator.LogLevel, default is INFORMATION
     */
    Send(req, res, view, object, log, level) {
        var status;
        status = '200';

        object = object || {};
        object.Config = Config;
        object.Enumerator = Enumerator;
        object.User = this.User;

        if (view.match(/500|404/)) {
            status = view;
            view = 'page/error/' + view;
        }
        else view = this.BaseViewPath + view;

        if (!object.hasOwnProperty('Error')) {
            object.Error = {
                Title: 'Erro ao executar operação',
                Message: 'A applicação executou uma operação incorreta. Por favor tente novamente'
            }
        }

        this.SetLog(req, status, log, level);

        res.render(view, object);
    }

    /**
     * Let Request Logs
     * @param req               {Object}         Express Request Object
     * @param status            {String}         Http Status Code
     * @param log               {String|Object=} Log Information
     * @param level             {Number=}        Enumerator.LogLevel, default is INFORMATION
     */
    SetLog(req, status, log, level) {
        var login, user, message;

        if (!level) {
            if (status == '500') level = Enumerator.LogLevel.ERROR;
            else if (status == '404') level = Enumerator.LogLevel.WARNING;
            else if (status == '200') level = Enumerator.LogLevel.INFORMATION;
        }

        if (!log) {
            if (status == '500') log = "Internal server error";
            else if (status == '404') log = "Resource not found";
            else if (status == '200') log = "Resource loaded";
        }

        if (this.User) {
            if (Config.Auth.TYPE == Enumerator.AuthenticationType.LOCAL) login = this.User.authentication.local.login;
            else if (Config.Auth.TYPE == Enumerator.AuthenticationType.CORESSO_SAML) login = this.User.authentication.saml.login;

            user = {
                _id: this.User._id,
                login: login,
                authType: Config.Auth.TYPE
            }
        }

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
                body: req.body,
                httpStatusCode: status,
                description: log
            }
        });
    }

    /**
     * User Authentication Middleware
     * @param req               {Object}        Express Request Object
     * @param res               {Object}        Express Response Object
     * @param next              {Object}        Express Next Function
     */
    Authentication(req, res, next) {
        if (req.isAuthenticated()) {
            this.User = req.user;
            return next();
        }
        else res.redirect('/auth/signin');
    }

    /**
     * User Authorization
     * @param req               {Object}        Express Request Object
     * @param res               {Object}        Express Response Object
     * @returns                 {Boolean}
     */
    Authorization(req, res) {
        if (req.user && req.user.authentication.security.isAdmin) return true;
        else res.redirect('/auth/signin');
    }
}

module.exports = BaseController;