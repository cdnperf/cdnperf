'use strict';

angular.module('cdnperfApp', ['ui.router', 'angularCharts']).config(function($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode(true).hashPrefix('!');

    $stateProvider.state('main', {
        url: '/',
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        views: {
            'content': {
                templateUrl: 'views/main.html'
            },
            'controls': {
                templateUrl: 'views/controls.html'
            }
        }
    });
});
