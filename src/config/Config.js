"use strict";
var ConfigBase = require('../lib/omr-base/config/Config');

class Config extends ConfigBase {

    /**
     * Get Service Port Number
     * @return {Number}         Port Number
     */
    static get Port () {
        return Config.resource.APP_PORT || 8080;
    }

    /**
     * Get Auth Configuration
     * @return {Object} Auth Configuration
     */
    static get Auth () {
        return {
            TYPE: Config.resource.AUTHENTICATION_TYPE || 0,
            GLOBAL: {
                SECRET: Config.resource.APP_SECRET || '$2a$08$fHQ2QB5gR7TI2bwiztC2HucuTJ.GG0yMdPFyGtuKDgsCOvx5FxNjm',
                EXPIRATION: {
                    TOKEN: Config.resource.TOKEN_EXPIRATION || "24h",
                    REFRESH: Config.resource.REFRESH_EXPIRATION || (1000 * 60 * 60 * 24)
                }
            },
            METHOD: {
                '1': {
                    ISSUER: Config.resource.SAML_ISSUER || 'mstech-omr-admin-ui',
                    IDP_DOMAIN: Config.resource.SAML_IDP_DOMAIN || '',
                    IDP_LOGIN_PATH: Config.resource.SAML_IDP_LOGIN_PATH || '/saml/signon.aspx',
                    IDP_LOGOUT_PATH: Config.resource.SAML_IDP_LOGOUT_PATH || '/logout.ashx',
                    IDP_CERT: Config.resource.SAML_IDP_CERT || '1c72a4a44039bd4201eb007a86b00a4e3757bcfc',
                    EXTERNAL_DB: {
                        USERNAME: Config.resource.MSSQL_CORE_USERNAME || '',
                        PASSWORD: Config.resource.MSSQL_CORE_PASSWORD || '',
                        DATABASE: Config.resource.MSSQL_CORE_DATABASE || '',
                        SERVER: Config.resource.MSSQL_SERVER || ''
                    },
                    SYSTEM: Config.resource.CORESSO_SYSTEM_ID || 217,
                    GROUP: {
                        ADMINISTRATOR: Config.resource.CORESSO_ADMIN_GROUP_ID || ''
                    }
                }
            }
        }
    }

    /**
     * Get Pagination Configuration
     * @return {Object}         Pagination Configuration
     */
    static get Pagination () {
        return {
            ITEMS_PER_PAGE:     Config.resource.ITEMS_PER_PAGE || 10
        }
    }

    /**
     * Get Dashboard Configuration
     * @return {Object}         Dashboard Configuration
     */
    static get Dashboard () {
        return {
            MAX_RUNNING_ITEMS: Config.resource.MAX_DASHBOARD_RUNNING_ITEMS || 8,
            MAX_RAW_ITEMS: Config.resource.MAX_DASHBOARD_RAW_ITEMS || 4,
            MAX_PENDING_ITEMS: Config.resource.MAX_DASHBOARD_PENDING_ITEMS || 4
        }
    }
}

module.exports = Config;