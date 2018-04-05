"use strict";
//TODO Controller Class Refactor for Web Based Interface
var async = require('async'),
    BaseController = require('./_BaseController'),
    Enum = require('../class/Enumerator'),
    Config = require('../config/Config'),
    AggregationBO = require('../lib/omr-base/business/Aggregation.bo.js'),
    GroupBO = require('../lib/omr-base/business/Group.bo'),
    ExamBO = require('../lib/omr-base/business/Exam.bo');

class AggregationController extends BaseController {

    /**
     * Aggregation Controller
     * @class AggregationController
     * @extends BaseController
     */
    constructor(router) {
        super(AggregationBO, router, 'page/aggregation/', '/aggregation/');
        this.Bind().get(this.Authentication.bind(this), this.GetList.bind(this));
        this.Bind(':id').get(this.Authentication.bind(this), this.Get.bind(this));
    }

    /**
     * Get List Page Handler
     * GET /aggregation
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
                Query: req.query
            };

            var where = {};
            if (req.query.processStatus) where['processStatus'] = req.query.processStatus;
            if (req.query.group_0) where['_group._0'] = req.query.group_0;
            if (req.query.group_1) where['_group._1'] = req.query.group_1;

            var Group = new GroupBO();
            Group.GetByQuery(null, null, null, null, function (err, data) {
                var g = {
                    group_0: [],
                    group_1: [],
                    group_2: []
                };

                //TODO: Set Error Log
                if (err) Aggregationthis.Send(req, res, '500', null, err);
                else {
                    var gInfo;

                    data.forEach(function (e) {
                        gInfo = {_id: e._id, name: e.name};
                        if (req.query['group_' + e.type] == e._id) gInfo['selected'] = 'selected';
                        g['group_' + e.type].push(gInfo);
                    });

                    Page.Group0 = g.group_0;
                    Page.Group1 = g.group_1;
                    Page.Group2 = g.group_2;

                    Page.ProcessStatus = [];
                    Page.ProcessStatus.push( { _id: Enum.ProcessStatus.RAW, name: 'Aguardando'} );
                    Page.ProcessStatus.push( { _id: Enum.ProcessStatus.DOWNLOADING, name: 'Baixando'} );
                    Page.ProcessStatus.push( { _id: Enum.ProcessStatus.PRE_PROCESSING, name: 'Identificando'} );
                    Page.ProcessStatus.push( { _id: Enum.ProcessStatus.PENDING, name: 'Pendente'} );
                    Page.ProcessStatus.push( { _id: Enum.ProcessStatus.PROCESSING, name: 'Corrigindo'} );
                    Page.ProcessStatus.push( { _id: Enum.ProcessStatus.UPLOADING, name: 'Enviando'} );
                    Page.ProcessStatus.push( { _id: Enum.ProcessStatus.ERROR, name: 'Erro'} );
                    Page.ProcessStatus.push( { _id: Enum.ProcessStatus.FINISHED, name: 'Finalizado'} );

                    Page.ProcessStatus.forEach((status) => {
                        if (status._id == req.query.processStatus) status.selected = 'selected';
                    });

                    this.BO.GetByQuery(
                        where,
                        null,
                        Page.Pagination.ItemsPerPage,
                        '-creationDate',
                        (err, result) => {
                            if (err) this.Send(req, res, '500', null, err);
                            else {
                                Page.Aggregation = result.data;
                                Page.Pagination.TotalItems = result.count;
                                this.Send(req, res, 'list', Page);
                            }
                        },
                        null,
                        null,
                        null,
                        null,
                        Page.Pagination.ItemsPerPage * (Page.Pagination.CurrentPage - 1)
                    );
                }
            }.bind(this));
        }
    }

    /**
     * Get Page Handler
     * GET /aggregation/:id
     * @param req {Object} ExpressJS Request Object
     * @param res {Object} ExpressJS Response Object
     */
    Get(req, res) {
        var Page;

        if (this.Authorization(req, res)) {
            Page = {};

            this.BO.GetById(
                req.params.id,
                (err, doc) => {
                    if (err) this.Send(req, res, '500', null, err);
                    else if (!doc) this.Send(req, res, '404');
                    else {
                        Page.Aggregation = doc;
                        this.Send(req, res, 'detail', Page);
                    }
                },
                null,
                null,
                '_group._0 _group._1 _group._2 _group._3 _template.ref',
                'type name alternatives questions qrCode'
            );
        }
    }
}

module.exports = function (router) {
    return router? new AggregationController(router): AggregationController;
};