"use strict";
var path,
    BaseController,
    Config,
    Enumerator;

path = require('path');
BaseController = require('./_BaseController');
Config = require('../config/Config');
Enumerator = require('../class/Enumerator');

class LogController extends BaseController {
    constructor (router) {
        super(null, router, 'page/log/', '/log/');
        this.Bind().get(this.Authentication.bind(this), this.GetList.bind(this));
        this.Bind(':id').get(this.Authentication.bind(this), this.Get.bind(this));
        this.Bind(':id/file/:type').get(this.Authentication.bind(this), this.GetFile.bind(this));
    }

    GetList(req, res) {
        var Page, where = {};

        if (this.Authorization(req, res)) {
            Page = {
                Pagination: {
                    ItemsPerPage: Config.Pagination.ITEMS_PER_PAGE,
                    CurrentPage: req.query.page || 1
                },
                LogLabel: [
                    {id: Enumerator.LogType.API, name: 'API'},
                    {id: Enumerator.LogType.ADMIN_UI, name: 'Área Administrativa'},
                    {id: Enumerator.LogType.FILE_ORGANIZER, name: 'Organizador de Arquivos'},
                    {id: Enumerator.LogType.PREPROCESSOR, name: 'Pré Processador'},
                    {id: Enumerator.LogType.PROCESSOR, name: 'Processador'},
                    {id: Enumerator.LogType.RESULT_SYNC, name: 'Sincronizador de Resultados'},
                    {id: Enumerator.LogType.TASK_SCHEDULER, name: 'Agendador de Tarefas'}
                ],
                LogLevel: [
                    {id: Enumerator.LogLevel.ERROR, name: 'Erro'},
                    {id: Enumerator.LogLevel.WARNING, name: 'Atenção'},
                    {id: Enumerator.LogLevel.INFORMATION, name: 'Informação'}
                ],
                Query: req.query
            };

            if (req.query.label) where['label'] = req.query.label;
            if (req.query.level) where['level'] = req.query.level;

            Page.LogLabel.forEach((label, i) => {
                if (req.query.label !== '' && req.query.label === label.id) {
                    Page.LogLabel[i]['selected'] = 'selected';
                }
            });

            Page.LogLevel.forEach((level, i) => {
                if (req.query.level !== '' && req.query.level === level.id) {
                    Page.LogLevel[i]['selected'] = 'selected';
                }
            });

            logger.getByQuery(
                where,
                Page.Pagination.ItemsPerPage,
                {timestamp: -1},
                (err, result) => {
                    if (err) this.Send(req, res, '500', null, err);
                    else {
                        Page.Log = result.data;
                        Page.Pagination.TotalItems = result.count;
                        this.Send(req, res, 'list', Page);
                    }
                },
                Page.Pagination.ItemsPerPage * (Page.Pagination.CurrentPage - 1)
            );
        }
    }

    /**
     * Get Page Handler
     * GET /log/:id
     * @param req {Object} ExpressJS Request Object
     * @param res {Object} ExpressJS Response Object
     */
    Get (req, res) {
        var Page;

        if (this.Authorization(req, res)) {
            Page = {};

            logger.getById(
                req.params.id,
                (err, doc) => {
                    if (err) this.Send(req, res, '500', null, err);
                    else if (!doc) this.Send(req, res, '404');
                    else if (!doc.meta.hasOwnProperty('resource') && !doc.meta.hasOwnProperty('detail')) res.redirect('/log/');
                    else {
                        Page.Log = doc;
                        if (Page.Log.meta.hasOwnProperty('detail')) {
                            if (Page.Log.meta.detail.image) {
                                if (Page.Log.label == Enumerator.LogType.PREPROCESSOR) {
                                    Page.Log.pre_result = `${req.params.id}/file/equalized`;
                                } else if (Page.Log.label == Enumerator.LogType.PROCESSOR) {
                                    if (doc.level == Enumerator.LogLevel.ERROR) Page.Log.result = `${req.params.id}/file/result`;
                                    Page.Log.equalized = `${req.params.id}/file/equalized`;
                                }
                            }
                        }
                        this.Send(req, res, 'detail', Page);
                    }
                }
            );
        }
    }

    GetFile(req, res) {
        if (this.Authorization(req, res)) {
            logger.getById(
                req.params.id,
                (err, doc) => {
                    var file;
                    if (err) this.Send(req, res, '500', err, err);
                    else {
                        switch (req.params.type) {
                            case 'equalized':
                                file = path.normalize(`${Config.FileResource.PATH.BASE}${Config.FileResource.DIRECTORY.EQUALIZED}/${doc.meta.detail.image}.${Enumerator.FileExtensions.PNG}`);
                                break;
                            case 'result':
                                if (Boolean(req.query.pre) == true)
                                    file = path.normalize(`${Config.FileResource.PATH.BASE}${Config.FileResource.DIRECTORY.RESULT}/${doc.meta.detail.image}_pre.${Enumerator.FileExtensions.PNG}`);
                                else
                                    file = path.normalize(`${Config.FileResource.PATH.BASE}${Config.FileResource.DIRECTORY.RESULT}/${doc.meta.detail.image}.${Enumerator.FileExtensions.PNG}`);
                                break;
                            default:
                                file = "";
                                break;
                        }

                        res.sendFile(file);
                    }
                }
            )
        }
    }
}

module.exports = function (router) {
    return router? new LogController(router): LogController;
};