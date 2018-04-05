var Util = {
    CSS: {
        hasClass: function (elem, className) {
            return new RegExp(' ' + className + ' ').test(' ' + elem.className + ' ');
        },
        addClass: function (elem, className) {
            if (!Util.CSS.hasClass(elem, className)) {
                elem.className += ' ' + className;
            }
        },
        removeClass: function (elem, className) {
            var newClass = ' ' + elem.className.replace( /[\t\r\n]/g, ' ') + ' ';
            if (Util.CSS.hasClass(elem, className)) {
                while (newClass.indexOf(' ' + className + ' ') >= 0 ) {
                    newClass = newClass.replace(' ' + className + ' ', ' ');
                }
                elem.className = newClass.replace(/^\s+|\s+$/g, '');
            }
        },
        swapClass: function (elem, className) {
            if (Util.CSS.hasClass(elem, className)) Util.CSS.removeClass(elem, className);
            else Util.CSS.addClass(elem, className);
        }
    }
};
