"use strict";
var async = require('async'),
    BaseController = require('./_BaseController'),
    Config = require('../config/Config'),
    Enumerator = require('../class/Enumerator'),
    AggregationBO = require('../lib/omr-base/business/Aggregation.bo');

class DashboardController extends BaseController {

    /**
     * Index Controller
     * @class DashboardController
     * @extends BaseController
     */
    constructor(router) {
        super(AggregationBO, router, 'page/', '/');
        this.Bind().get(this.Authentication.bind(this), this.Get.bind(this));
    }

    /**
     * Get Page Handler
     * GET /
     * @param req {Object} ExpressJS Request Object
     * @param res {Object} ExpressJS Response Object
     */
    Get(req, res) {
        if (this.Authorization(req, res)) {
            let Page = {};
            let queue = [
                (callback) => {
                    this.BO.GetByQuery(
                        {processStatus: {$in: [
                            Enumerator.ProcessStatus.DOWNLOADING,
                            Enumerator.ProcessStatus.PRE_PROCESSING,
                            Enumerator.ProcessStatus.PROCESSING
                        ]}},
                        null,
                        Config.Dashboard.MAX_RUNNING_ITEMS,
                        '-alterationDate',
                        (err, running) => {
                            if (err) callback(err);
                            else {
                                Page.Running = running;
                                callback();
                            }
                        },
                        null,
                        null,
                        null,
                        'type name'
                    );
                },
                (callback) => {
                    this.BO.GetByQuery(
                        {processStatus: Enumerator.ProcessStatus.RAW},
                        null,
                        Config.Dashboard.MAX_RAW_ITEMS,
                        '+alterationDate',
                        (err, raw) => {
                            if (err) callback(err);
                            else {
                                Page.Raw = raw;
                                callback();
                            }
                        }
                    );
                },
                (callback) => {
                    this.BO.GetByQuery(
                        {processStatus: Enumerator.ProcessStatus.PENDING},
                        null,
                        Config.Dashboard.MAX_PENDING_ITEMS,
                        '+alterationDate',
                        (err, pending) => {
                            if (err) callback(err);
                            else {
                                Page.Pending = pending;
                                callback();
                            }
                        }
                    );
                }
            ];

            async.parallel(queue, (err) => {
                if (err) this.Send(req, res, '500', null, err);
                else this.Send(req, res, 'dashboard', Page);
            });



        }
    }
}

module.exports = function (router) {
    return router? new DashboardController(router): DashboardController;
};