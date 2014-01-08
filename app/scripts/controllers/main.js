'use strict';

angular.module('cdnperfApp').controller('MainCtrl', function($scope, $http) {
    $scope.providers = [];
    $scope.uptimes = {
        series: ['Sales', 'Income', 'Expense', 'Laptops', 'Keyboards'],
        data : [
            {
                x: 'Sales',
                y: [100,500, 0],
                tooltip: 'this is tooltip'
            },
            {
                x: 'Not Sales',
                y: [300, 100, 100]
            },
            {
                x: 'Tax',
                y: [351]
            },
            {
                x: 'Not Tax',
                y: [54, 0, 879]
            }
        ]
    };
    $scope.chartConfig = {
        labels: false,
        title : 'Not Products',
        legend : {
            display: true,
            position: 'left'
        }
    };

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
