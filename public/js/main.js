$(main);

function main() {
    var data = {
        "xScale": "ordinal",
        "yScale": "linear",
        "type": "bar",
        "main": [
            {
            "className": ".pizza",
            "data": [
                {
                "x": "Pepperoni",
                "y": 12
            },
            {
                "x": "Cheese",
                "y": 8
            }
            ]
        }
        ],
        "comp": [
            {
            "className": ".pizza",
            "type": "line-dotted",
            "data": [
                {
                "x": "Pepperoni",
                "y": 10
            },
            {
                "x": "Cheese",
                "y": 4
            }
            ]
        }
        ]
    };

    var chart = new xChart('bar', data, '#myChart');
}
