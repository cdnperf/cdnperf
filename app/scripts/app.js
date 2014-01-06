'use strict';

angular.module('cdnperfApp', ['ui.router']).config(function($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider.otherwise('/');

    $locationProvider.html5Mode(true).hashPrefix('!');

    $stateProvider.state('main', {
        url: '/',
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
    });
});
