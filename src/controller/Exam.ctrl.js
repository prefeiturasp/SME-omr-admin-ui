"use strict";
var async = require('async'),
    BaseController = require('./_BaseController'),
    Enumerator = require('../class/Enumerator'),
    Config = require('../config/Config'),
    ExamBO = require('../lib/omr-base/business/Exam.bo.js'),
    TemplateBO = require('../lib/omr-base/business/Template.bo');

class ExamController extends BaseController {

    /**
     * Exam Controller
     * @class ExamController
     * @extends BaseController
     */
    constructor(router) {
        super(ExamBO, router, 'page/exam/', '/aggregation/:aggregation_id/exam/');
        this.Bind().get(this.Authentication.bind(this), this.GetList.bind(this));
        this.Bind(':id').get(this.Authentication.bind(this), this.Get.bind(this));
        this.Bind('/exam/:id', true).get(this.Authentication.bind(this), this.Get.bind(this));
    }

    /**
     * Get List Page Handler
     * GET /aggregation/:aggregation_id/exam
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
                ExamType: [],
                Query: req.query,
                AggregationId: req.params.aggregation_id
            };

            var where = {};
            if (req.query.processStatus) where['processStatus'] = req.query.processStatus;

            Page.ProcessStatus = [];
            Page.ProcessStatus.push( { _id: Enumerator.ProcessStatus.RAW, name: 'Aguardando'} );
            Page.ProcessStatus.push( { _id: Enumerator.ProcessStatus.PRE_PROCESSING, name: 'Identificando'} );
            Page.ProcessStatus.push( { _id: Enumerator.ProcessStatus.PENDING, name: 'Pendente'} );
            Page.ProcessStatus.push( { _id: Enumerator.ProcessStatus.PROCESSING, name: 'Corrigindo'} );
            Page.ProcessStatus.push( { _id: Enumerator.ProcessStatus.SUCCESS, name: 'Sucesso'} );
            Page.ProcessStatus.push( { _id: Enumerator.ProcessStatus.ERROR, name: 'Erro'} );
            Page.ProcessStatus.push( { _id: Enumerator.ProcessStatus.WARNING, name: 'Atenção'} );

            Page.ProcessStatus.forEach((status) => {
                if (status._id == req.query.processStatus) status.selected = 'selected';
            });

            this.BO.GetByQuery(
                where,
                null,
                Page.Pagination.ItemsPerPage,
                '-creationDate',
                function (err, result) {
                    if (err) this.Send(req, res, '500', null, err);
                    else {
                        Page.Exam = result.data;
                        Page.Pagination.TotalItems = result.count;

                        this.Send(req, res, 'list', Page);
                    }
                }.bind(this),
                '_aggregation',
                req.params.aggregation_id,
                null,
                null,
                Page.Pagination.ItemsPerPage * (Page.Pagination.CurrentPage - 1)
            );
        }
    }

    /**
     * Get Page Handler
     * GET /aggregation/:aggregation_id/exam/:id
     * @param req {Object} ExpressJS Request Object
     * @param res {Object} ExpressJS Response Object
     */
    Get (req, res) {
        var Page, queue;

        if (this.Authorization(req, res)) {
            Page = {};

            this.BO.GetById(
                req.params.id,
                function (err, doc) {
                    if (err) this.Send(req, res, '500', null, err);
                    else if (!doc) this.Send(req, res, '404');
                    else {
                        if (doc.processStatus == Enumerator.ProcessStatus.SUCCESS || doc.processStatus == Enumerator.ProcessStatus.WARNING || doc.processStatus == Enumerator.ProcessStatus.ERROR) {
                            queue = [];
                            Page.Exam = doc;

                            queue.push((callback) => {
                                var Template = new TemplateBO();
                                Template.GetById(
                                    doc._aggregation._template.ref,
                                    (err, template) => {
                                        if (err) callback(err);
                                        else {
                                            Page.Template = template;
                                            callback();
                                        }
                                    }
                                );
                            });

                            queue.push((callback) => {
                                logger.getByQuery(
                                    {
                                        'detail.image': req.params.id
                                    },
                                    null, null,
                                    (err, logs) => {
                                        if (err) callback(err);
                                        else {
                                            Page.Logs = logs;
                                            callback();
                                        }
                                    }
                                );
                            });

                            async.parallel(queue, (err) => {
                                if (err) this.Send(req, res, '500', null, err);
                                else this.Send(req, res, 'detail', Page);
                            })
                        } else res.redirect(`/aggregation/${req.params.aggregation_id || doc._aggregation._id}/exam/`);
                    }
                }.bind(this),
                null,
                null,
                '_aggregation',
                '_template'
            );
        }
    }
}

module.exports = function (router) {
    return router? new ExamController(router): ExamController;
};