'use strict';
var qs, url;
qs = require('querystring');
url = require('url');

class Pagination {

    /**
     * Setup Pagination Helper
     * @param currentPage               {Number}        Current Page
     * @param itemsPerPage              {Number}        Items per Page
     * @param totalItems                {Number}        Total Items
     * @param query                     {Object}        Express Query Reference
     * @static
     */
    static SetUp (currentPage, itemsPerPage, totalItems, query) {
        Pagination.CurrentPage = currentPage;
        Pagination.ItemsPerPage = itemsPerPage;
        Pagination.TotalItems = totalItems;
        Pagination.Query = query;
    }

    /**
     * Get Page First Item
     * @return {Number}
     * @static
     */
    static get FirstItem() {
        return (Pagination.CurrentPage-1) * Pagination.ItemsPerPage +1;
    }

    /**
     * Get Page Last Item
     * @return {Number}
     * @static
     */
    static get LastItem() {
        return Pagination.FirstItem + Pagination.ItemsPerPage -1 < Pagination.TotalItems? Pagination.FirstItem + Pagination.ItemsPerPage -1 : Pagination.TotalItems;
    }

    /**
     * Check if has Previews Page
     * @return {Boolean}
     * @static
     */
    static get HasPreviews () {
        return Pagination.CurrentPage > 1;
    }

    /**
     * Build Pagination Previews Link
     * @return {String}
     * @static
     */
    static get Previews() {
        var params = Pagination.Query;
        params['page'] = Number(Pagination.CurrentPage) -1;
        return '?' + qs.stringify(params);
    }

    /**
     * Check if has Next Page
     * @return {Boolean}
     * @static
     */
    static get HasNext () {
        return Pagination.CurrentPage < Pagination.TotalItems / Pagination.ItemsPerPage;
    }

    /**
     * Build Pagination Next Link
     * @return {String}
     * @static
     */
    static get Next() {
        var params = Pagination.Query;
        params['page'] = Number(Pagination.CurrentPage) +1;
        return '?' + qs.stringify(params);
    }

    /**
     * Check if has Pager
     * @return {Boolean}
     * @static
     */
    static get HasPager() {
        return Pagination.CurrentPage >=0 && Pagination.ItemsPerPage && Pagination.TotalItems
    }

}

module.exports = Pagination;