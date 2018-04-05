document.addEventListener('DOMContentLoaded', function () {
    var menuButton = document.getElementById('sideMenuButton'),
        menu = document.getElementById('sideMenu');

    menuButton.addEventListener('click', function () {
        Util.CSS.swapClass(menu, 'active');
    });
});