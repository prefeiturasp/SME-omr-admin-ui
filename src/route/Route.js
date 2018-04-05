"use strict";
var Config,
    Enumerator;
Config = require('../config/Config');
Enumerator = require('../class/Enumerator');

module.exports = function(router, passport) {
    if (Config.Auth.TYPE == Enumerator.AuthenticationType.LOCAL) require('../controller/Auth/Local.ctrl')(router, passport);
    else if (Config.Auth.TYPE == Enumerator.AuthenticationType.CORESSO_SAML) require('../controller/Auth/CoreSSOSAML.ctrl')(router, passport);

    require('../controller/Dashboard.ctrl')(router);
    require('../controller/Template.ctrl')(router);
    require('../controller/Aggregation.ctrl')(router);
    require('../controller/Exam.ctrl')(router);
    require('../controller/Log.ctrl')(router);
    require('../controller/TaskManager.ctrl')(router);
    require('../controller/Error404.ctrl')(router);
};
