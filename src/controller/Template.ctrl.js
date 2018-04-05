"use strict";
var BaseController = require('./_BaseController'),
    Config = require('../config/Config'),
    TemplateBO = require('../lib/omr-base/business/Template.bo.js'),
    Enumerator = require('../class/Enumerator');

class TemplateController extends BaseController {

    /**
     * Template Controller
     * @class TemplateController
     * @extends BaseController
     */
    constructor(router) {
        super(TemplateBO, router, 'page/template/', '/template/');
        this.Bind().get(this.Authentication.bind(this), this.GetList.bind(this));
        this.Bind(':id').get(this.Authentication.bind(this), this.Get.bind(this));
    }

    /**
     * Get List Page Handler
     * GET /template
     * @param req {Object} ExpressJS Request Object
     * @param res {Object} ExpressJS Response Object
     */
    GetList(req, res) {
        var Page;

        if (this.Authorization(req, res)) {
            Page = {
                Pagination: {
                    ItemsPerPage: Config.Pagination.ITEMS_PER_PAGE,
                    CurrentPage: req.query.page || 1
                },
                TemplateType: [],
                Query: req.query
            };
            var where = {};
            if (req.query.type) where['type'] = req.query.type;

            var sInfo, sText = ["Infantil", "Fundamental", "Médio"];
            for (let i = 0; i <= 2; i++) {
                sInfo = {_id: i, name: sText[i]};
                if (req.query.type != '' && req.query.type == i) sInfo['selected'] = 'selected';
                Page.TemplateType.push(sInfo);
            }

            this.BO.GetByQuery(
                where,
                null,
                Page.Pagination.ItemsPerPage,
                '-creationDate',
                function (err, result) {
                    if (err) this.Send(req, res, '500', null, err);
                    else {
                        Page.Template = result.data;
                        Page.Pagination.TotalItems = result.count;
                        this.Send(req, res, 'list', Page);
                    }
                }.bind(this),
                null,
                null,
                null,
                null,
                Page.Pagination.ItemsPerPage * (Page.Pagination.CurrentPage - 1)
            );
        }
    }

    /**
     * Get Page Handler
     * GET /template/:id
     * @param req {Object} ExpressJS Request Object
     * @param res {Object} ExpressJS Response Object
     */
    Get (req, res) {
        var Page;

        if (this.Authorization(req, res)) {
            Page = {};

            this.BO.GetById(
                req.params.id,
                function (err, doc) {
                    if (err) this.Send(req, res, '500', null, err);
                    else if (!doc) this.Send(req, res, '404');
                    else {
                        Page.Template = doc;
                        this.Send(req, res, 'detail', Page);
                    }
                }.bind(this)
            );
        }
    }
}

module.exports = function (router) {
    return router? new TemplateController(router): TemplateController;
};