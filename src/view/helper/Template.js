'use strict';

class Template {

    /**
     * Setup Template Helper
     * @param items                     {Array}         Items
     * @param columns                   {Number}        Column number
     * @static
     */
    static SetUp (items, columns) {
        Template.Items = items;
        Template.Lines = Math.ceil(items.length / columns);
        Template.Columns = columns;
    }

    /**
     * Get Column Data
     * @static
     * @return {Array}
     */
    static get ColumnsData() {
        var columns;
        columns = [];

        for (let i = 0; i < Template.Columns; i++ ) {
            if (Template.Items.length >= Template.Lines) columns.push(Template.Items.splice(0, Template.Lines));
            else columns.push(Template.Items);
        }

        return columns;
    }

}

module.exports = Template;