'use strict';
var BaseEnumerator = require('../lib/omr-base/class/Enumerator');

class Enumerator extends BaseEnumerator {

    /**
     * Get Authentication Type
     * @return {Object}         Authentication Type
     */
    static get AuthenticationType() {
        return {
            LOCAL: 0,
            CORESSO_SAML: 1,
            _regex: /0|1/
        };
    }
}

module.exports = Enumerator;