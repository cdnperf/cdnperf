'use strict';

angular.module('cdnperfApp').controller('MainCtrl', function($scope, $http) {
    $scope.providers = [];

    $http.get('data/data.json').then(function(res) {
        $scope.providers = res.data.providers;
        // TODO: pick firstDate and lastDate too

        console.log(res.data);
    });

    /*
    $(function() {
        var val = localStorage.getItem('index');
        if(val) $('.indexUrl').attr('href', val);
    });
    */
});
