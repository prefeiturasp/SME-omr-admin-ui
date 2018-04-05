'use strict';
var SQL,
    Config,
    Enumerator,
    SAML,
    Cryptography;

Config = require('../../config/Config');
Enumerator = require('../../class/Enumerator');
SQL = require('mssql');
Cryptography = require('../../lib/omr-base/class/Cryptography');

class CoreSSO {

    /**
     * CoreSSO Database Connection
     * @param next          {Function}      Next Function in thread
     */
    constructor(next) {
        var SQLConfig;
        SAML = Config.Auth.METHOD[Enumerator.AuthenticationType.CORESSO_SAML];

        CoreSSO.decryptPassword();

        SQLConfig = {
            user: SAML.EXTERNAL_DB.USERNAME,
            password: SAML.EXTERNAL_DB.PASSWORD,
            server: SAML.EXTERNAL_DB.SERVER,
            database: SAML.EXTERNAL_DB.DATABASE
        };
        this.Connection = SQL.connect(SQLConfig, next);

        this.Connection.on('error', next);
    }

    /**
     * Decrypt Database Password
     */
    static decryptPassword() {
        try {
            if (!Config.Cryptography.DISABLED) SAML.EXTERNAL_DB.PASSWORD = Cryptography.decrypt(SAML.EXTERNAL_DB.PASSWORD);
        } catch (ex) {
            throw ex;
        }
    }

    /**
     * Get Logged User Data
     * @param usuLogin      {String}        User Login
     * @param entId         {String}        Entity ID (GUID/UUID)
     * @return {Promise}
     * @constructor
     */
    GetUserData(usuLogin, entId) {
        return new Promise(function (resolve, reject) {
            var request, query;

            query =
                `SELECT TOP 1` +
                `   USU.usu_id, ` +
                `   PES.pes_nome ` +
                `FROM SYS_Usuario AS USU ` +
                `LEFT JOIN PES_Pessoa AS PES ON (PES.pes_id = USU.pes_id) ` +
                `WHERE ` +
                `   USU.usu_login = '${usuLogin}' AND ` +
                `   USU.ent_id = '${entId}'`;

            request = this.Connection.request();
            request.query(query, function (err, users) {
                if (err) reject(err);
                else if (users.length <= 0) reject(new Error("User HAVE NO RIGHTS"));
                else resolve(users[0]);
            });
        }.bind(this));
    }

    /**
     * Get Logged User Groups by System
     * @param usuId         {String}        User ID (GUID/UUID)
     * @param sisId         {Number}        CoreSSO System ID
     * @return {Promise}
     */
    GetUserGroupsBySystem(usuId, sisId) {
        return new Promise(function (resolve, reject) {
            var request, query;

            query =
                `SELECT` +
                `   GRU.gru_id ` +
                `FROM SYS_UsuarioGrupo AS USG ` +
                `LEFT JOIN SYS_Grupo AS GRU ON (GRU.gru_id = USG.gru_id) ` +
                `WHERE ` +
                `   USG.usu_id = '${usuId}' AND ` +
                `   GRU.sis_id = ${sisId}`;

            request = this.Connection.request();
            request.query(query, function (err, groups) {
                if (err) reject(err);
                else if (groups.length <= 0) reject(new Error("User HAVE NO RIGHTS"));
                else resolve(groups);
            });
        }.bind(this));
    }

    /**
     * Get Systems that User can Access
     * @param usuId         {String}        User ID (GUID/UUID)
     * @param sisId         {Number}        CoreSSO System ID
     * @return {Promise}
     * @constructor
     */
    GetUserSystems(usuId, sisId) {
        return new Promise(function (resolve, reject) {
            var request, query;

            query =
                `SELECT DISTINCT` +
                `   SIS.sis_nome,` +
                `   SIS.sis_caminho ` +
                `FROM SYS_UsuarioGrupo AS USG ` +
                `LEFT JOIN SYS_Grupo AS GRU ON (GRU.gru_id = USG.gru_id) ` +
                `LEFT JOIN SYS_Sistema AS SIS ON (SIS.sis_id = GRU.sis_id) ` +
                `WHERE USG.usu_id = '${usuId}'` +
                `AND SIS.sis_id <> ${sisId}`;

            request = this.Connection.request();
            request.query(query, function (err, systems) {
                if (err) reject(err);
                else resolve(systems);
            });
        }.bind(this))
    }
}

module.exports = CoreSSO;