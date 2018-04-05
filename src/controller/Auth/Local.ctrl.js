"use strict";
var BaseController,
    Enumerator;

BaseController = require('../_BaseController');
Enumerator = require('../../class/Enumerator');

class AuthLocalController extends BaseController {

    /**
     * Local Authentication Controller
     * @param router
     * @param passport
     * @constructor
     */
    constructor (router, passport) {
        super(null, router, 'page/', '/auth/');
        this.passport = passport;
        this.Bind('signin').get(AuthLocalController.Authentication, this.Get.bind(this));
        this.Bind('signin').post(this.Login);
        this.Bind('signout').get(this.Logout.bind(this));
    }

    /**
     * Authentication Middleware
     * @static
     * @return {Function}
     */
    static Authentication(req, res, next) {
        if (!req.isAuthenticated())
            return next();

        res.redirect('/');
    }

    /**
     * Login Page Handler
     * GET /auth/signin
     * @param req       {Object}        ExpressJS Request Object
     * @param res       {Object}        ExpressJS Response Object
     */
    Get(req, res) {
        var Page;
        Page = {
            errorMessage: req.flash('message').toString()? 'Usuário ou senha são inválidos.': ''
        };

        this.Send(req, res, 'signin', Page);
    }

    /**
     * Login Handler
     * POST /auth/signin
     * @return {Function}
     */
    get Login() {
        return this.passport.authenticate(
            'local',
            {
                successRedirect : '/',
                failureRedirect : '/auth/signin',
                failureFlash : true
            }
        )
    }

    /**
     * Logout Handler
     * GET /auth/signout
     * @param req       {Object}        ExpressJS Request Object
     * @param res       {Object}        ExpressJS Response Object
     */
    Logout (req, res) {
        if (req.isAuthenticated()) {
            this.SetLog(req, '200', `User logged out: ${req.user._id}`, Enumerator.LogLevel.INFORMATION);
            req.logout();
        }
        res.redirect('/auth/signin');
    }
}

module.exports = function (router, passport) {
    return router? new AuthLocalController(router, passport): AuthLocalController;
};