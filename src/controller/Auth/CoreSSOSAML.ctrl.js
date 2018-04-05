"use strict";
var BaseController,
    Config,
    Enumerator;

BaseController = require('../_BaseController');
Config = require('../../config/Config');
Enumerator = require('../../class/Enumerator');

class AuthCoreSSOSAMLController extends BaseController {

    /**
     * CoreSSO SAML Authentication Controller
     * @param router
     * @param passport
     * @constructor
     */
    constructor (router, passport) {
        super(null, router, 'page/', '/auth/');

        this.passport = passport;
        this.SetMiddleware(router);

        this.SAML = Config.Auth.METHOD[Enumerator.AuthenticationType.CORESSO_SAML];

        this.Bind('signin').get(this.Authentication.bind(this));
        this.Bind('signin').post(this.Authentication.bind(this));
        this.Bind('signin/error').get(this.Error.bind(this));
        this.Bind('signout').get(this.Logout.bind(this));
        this.Bind('signout').post(this.Logout.bind(this));
    }

    /**
     * Authentication Middleware
     * @return {Function}
     */
    get Authentication() {
        return this.passport.authenticate(
            'saml',
            {
                successRedirect : '/',
                failureRedirect: '/auth/signin/error',
                failureFlash: true
            }
        );
    }

    /**
     * Error Handler
     * GET /auth/signin/error
     * @param req       {Object}        ExpressJS Request Object
     * @param res       {Object}        ExpressJS Response Object
     */
    Error(req, res) {
        var Page;
        Page = {
            Error: {
                Title: 'Erro na Autenticação SAML',
                Message: 'Usuário não possui permissão para acessar o sistema.',
                buttonText: "Tentar Novamente"
            }
        };

        this.Send(req, res, '500', Page, req.flash("message").toString());
    }

    /**
     * Logout Handler
     * GET /auth/signout
     * POST /auth/signout
     * @param req       {Object}        ExpressJS Request Object
     * @param res       {Object}        ExpressJS Response Object
     */
    Logout (req, res) {
        var host;
        if (req.isAuthenticated()) {
            if (req.method == 'GET') {
                host = req.headers['x-forwarded-host'] || req.headers['x-forwarded-server'] || req.headers['host'];
                req.user.nameID = req.protocol + '://' + host + '/auth/signout';
                req.user.nameIDFormat = "urn:oasis:names:tc:SAML:2.0:nameid-format:transient";
                this.passport._strategy('saml').logout(req, function (err, requestUrl) {
                    var strP = requestUrl.indexOf('&RelayState');
                    this.SetLog(req, '200', `User logged out: ${req.user._id}`, Enumerator.LogLevel.INFORMATION);
                    requestUrl = requestUrl.substring(0, strP);
                    res.redirect(requestUrl + '&RelayState=' + req.user.nameID);
                }.bind(this));
            } else {
                req.logout();
                res.redirect('http://' + this.SAML.IDP_DOMAIN + this.SAML.IDP_LOGOUT_PATH);
            }
        } else {
            res.redirect('/');
        }
    }

    /**
     * Set SAML Middleware
     * @param router    {Object}        ExpressJS Router Object
     */
    SetMiddleware(router) {
        router.use(function (req, res, next) {
            var SAMLResponse;
            if (req.body && req.body.SAMLResponse) {
                SAMLResponse = req.body.SAMLResponse;
                if (SAMLResponse[0] === '<') req.body.SAMLResponse = new Buffer(req.body.SAMLResponse, 'utf8').toString('base64');
            }

            next();
        });
    }
}

module.exports = function (router, passport) {
    return router? new AuthCoreSSOSAMLController(router, passport): AuthCoreSSOSAMLController;
};