"use strict";
const async = require('async');
const Agenda = require('agenda');
const Crypto = require('../lib/omr-base/class/Cryptography');
const BaseController = require('./_BaseController');
const Config = require('../config/Config');
const Enumerator = require('../class/Enumerator');
const AggregationBO = require('../lib/omr-base/business/Aggregation.bo');
const ExamBO = require('../lib/omr-base/business/Exam.bo');
const agenda = new Agenda({
    db: {
        address: Config.Cryptography.DISABLED?
            Config.MongoDB:
            Crypto.decrypt(Config.MongoDB),
        collection: 'Scheduler'
    }
});

class TaskManagerController extends BaseController {

    /**
     * TaskManager Controller
     * @class TaskManagerController
     * @extends BaseController
     */
    constructor(router) {
        super(null, router, 'page/taskmanager/', '/taskmanager/');
        this.Bind().get(this.Authentication.bind(this), this.Get.bind(this));
        this.Bind().post(this.Authentication.bind(this), this.Post.bind(this));
    }

    /**
     * Get Page Handler
     * GET /taskmanager/
     * @param req {Object} ExpressJS Request Object
     * @param res {Object} ExpressJS Response Object
     */
    Get(req, res) {
        if (this.Authorization(req, res)) {
            let Page = {
                Aggregation: [],
                Task: []
            };

            Promise.all([
                TaskManagerController.getRunningAggregation(),
                TaskManagerController.getScheduledTasks()
            ])
            .then((result) => {
                if (result[0]) Page.Aggregation = result[0];
                if (result[1]) Page.Task = result[1];

                this.Send(req, res, 'index', Page);
            })
            .catch((err) => {
                this.Send(req, res, '500', null, err);
            })
        }
    }

    /**
     * Post Page Handler
     * POST /taskmanager/
     * @param req {Object} ExpressJS Request Object
     * @param res {Object} ExpressJS Response Object
     */
    Post(req, res) {
        if (this.Authorization(req, res)) {
            if (req.body.processStatus.match(Enumerator.ProcessStatus._regex)) {
                let queue = [
                    (callback) => {
                        let aggregation = new AggregationBO();
                        let where = { _id: req.body._id, processStatus: req.body.processStatus };

                        if (req.body.processStatus === `${Enumerator.ProcessStatus.PRE_PROCESSING}`) {
                            aggregation.UpdateByQuery(where, {processStatus: 0}, null, callback);
                        } else {
                            aggregation.UpdateByQuery(where, {processStatus: 2}, null, callback);
                        }
                    },
                    (callback) => {
                        let exam = new ExamBO();
                        let where = { _aggregation: req.body._id, processStatus: req.body.processStatus };

                        if (req.body.processStatus === `${Enumerator.ProcessStatus.PRE_PROCESSING}`) {
                            exam.UpdateByQuery(where, {processStatus: 0}, {multi: true}, callback);
                        } else {
                            exam.UpdateByQuery(where, {processStatus: 2}, {multi: true}, callback);
                        }
                    }
                ];

                async.parallel(queue, (err) => {
                    if (err) this.Send(req, res, '500', null, err);
                    else res.redirect('/taskmanager/');
                });
            } else {
                this.Send(req, res, '500', null, new Error('Invalid processStatus'));
            }
        }
    }

    /**
     * Get running aggregations
     * @return {Promise}
     * @static
     */
    static getRunningAggregation() {
        return new Promise((resolve, reject) => {
            let aggregation = new AggregationBO();
            aggregation.GetByQuery({
                processStatus: {
                    $in: [
                        Enumerator.ProcessStatus.DOWNLOADING,
                        Enumerator.ProcessStatus.PRE_PROCESSING,
                        Enumerator.ProcessStatus.PROCESSING
                    ]
                }
            }, null, null, 'processStatus: -1', (err, data) => {
                if (err) reject(err);
                else if (data.length) {
                    let exam = new ExamBO();
                    let queue = [];
                    data.forEach((ag, i) => {
                        queue.push((callback) => {
                            var statusList;
                            if (ag.processStatus == Enumerator.ProcessStatus.PRE_PROCESSING || ag.processStatus == Enumerator.ProcessStatus.DOWNLOADING) {
                                statusList = [
                                    Enumerator.ProcessStatus.RAW,
                                    Enumerator.ProcessStatus.PRE_PROCESSING
                                ]
                            } else {
                                statusList = [
                                    Enumerator.ProcessStatus.PENDING,
                                    Enumerator.ProcessStatus.PROCESSING
                                ]
                            }
                            exam.GetCount(
                                {
                                    _aggregation: ag._id,
                                    processStatus: { $in: statusList }
                                },
                                (err, count) => {
                                    if (err) callback(err);
                                    else {
                                        if (!data[i].hasOwnProperty('exam')) data[i].exam = {};
                                        data[i].exam.running = count;
                                        callback(null);
                                    }
                                }
                            );
                        });
                        queue.push((callback) => {
                            exam.GetByQuery({sent: false, _aggregation: ag._id}, 'alterationDate', 1, '-alterationDate', (err, doc) => {
                                if (err) callback(err);
                                else if (doc.length) {
                                    if (!data[i].hasOwnProperty('exam')) data[i].exam = {};
                                    data[i].exam.alterationDate = doc[0].alterationDate;
                                    callback(null);
                                } else callback(null);
                            }, undefined, undefined, undefined, undefined, undefined, true);
                        });
                    });

                    async.series(queue, (err) => {
                        if (err) reject(err);
                        else resolve(data);
                    })
                } else {
                    resolve();
                }
            }, undefined, undefined, undefined, undefined, undefined, true);
        });
    }

    /**
     * Get scheduled tasks
     * @return {Promise}
     * @static
     */
    static getScheduledTasks() {
        return new Promise((resolve, reject) => {
            agenda.jobs({}, (err, jobs) => {
                if (err) reject(err);
                else resolve(jobs);
            })
        });
    }
}

module.exports = function (router) {
    return router? new TaskManagerController(router): TaskManagerController;
};