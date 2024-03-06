// assign the access token
mapboxgl.accessToken =
    'pk.eyJ1IjoiamFrb2J6aGFvIiwiYSI6ImNpcms2YWsyMzAwMmtmbG5icTFxZ3ZkdncifQ.P9MBej1xacybKcDN_jehvw';

// declare the map object
let map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/dark-v10',
    zoom: 6, // starting zoom
    minZoom: 5,
    center: [-123, 47] // starting center
});

// declare the coordinated chart as well as other variables.
let diplomaChart = null,
    population = {},
    percentDiplomas = 0;

// create a few constant variables.
const grades = [5, 10, 20],
    colors = ['rgb(208,209,230)', 'rgb(103,169,207)', 'rgb(1,108,89)'],
    radii = [5, 15, 20];

// create the legend object and anchor it to the html element with id legend.
const legend = document.getElementById('legend');

//set up legend grades content and labels
let labels = ['<strong>Percent No Diploma</strong>'], vbreak;

//iterate through grades and create a scaled circle and label for each
for (var i = 0; i < grades.length; i++) {
    vbreak = grades[i];
    // you need to manually adjust the radius of each dot on the legend
    // in order to make sure the legend can be properly referred to the dot on the map.
    dot_radii = 2 * radii[i];
    labels.push(
        '<p class="break"><i class="dot" style="background:' + colors[i] + '; width: ' + dot_radii +
        'px; height: ' +
        dot_radii + 'px; "></i> <span class="dot-label" style="top: ' + dot_radii / 2 + 'px;">' + vbreak +
        '</span></p>');

}
const source =
    '<p style="text-align: right; font-size:10pt">Source: <a href="https://geo.wa.gov/datasets/d4a6f3c1a45d48b9b31de9ebaf5af4ee_0/explore?location=47.237631%2C-120.811974%2C8.00"">Washington Geospatial Open Data Portal</a></p>';

// join all the labels and the source to create the legend content.
legend.innerHTML = labels.join('') + source;



// define the asynchronous function to load geojson data.
async function geojsonFetch() {

    // Await operator is used to wait for a promise.
    // An await can cause an async function to pause until a Promise is settled.
    let response;
    response = await fetch('assets/diploma.geojson');
    diplomas = await response.json();



    //load data to the map as new layers.
    //map.on('load', function loadingData() {
    map.on('load', () => { //simplifying the function statement: arrow with brackets to define a function

        // when loading a geojson, there are two steps
        // add a source of the data and then add the layer out of the source
        map.addSource('diplomas', {
            type: 'geojson',
            data: diplomas
        });


        map.addLayer({
                'id': 'diplomas-point',
                'type': 'circle',
                'source': 'diplomas',
                'minzoom': 5,
                'paint': {
                    // increase the radii of the circle as Percent_Without_Diploma value increases
                    'circle-radius': {
                        'property': 'pctnodiploma',
                        'stops': [
                            [grades[0], radii[0]],
                            [grades[1], radii[1]],
                            [grades[2], radii[2]]
                        ]
                    },
                    // change the color of the circle as Percent_Without_Diploma value increases
                    'circle-color': {
                        'property': 'pctnodiploma',
                        'stops': [
                            [grades[0], colors[0]],
                            [grades[1], colors[1]],
                            [grades[2], colors[2]]
                        ]
                    },
                    'circle-stroke-color': 'white',
                    'circle-stroke-width': 1,
                    'circle-opacity': 0.6
                }
            },
            'waterway-label' // make the thematic layer above the waterway-label layer.
        );


        // click on each dot to view magnitude in a popup
        map.on('click', 'diplomas-point', (event) => {
            new mapboxgl.Popup()
                .setLngLat(event.features[0].geometry.coordinates)
                .setHTML(`<strong>% No Diploma:</strong> ${event.features[0].properties.Percent_Without_Diploma}`)
                .addTo(map);
        });



        // the coordinated chart relevant operations

        // found percentage of no diplomas of all counties in the displayed map view
        percentNoDiploma = calDiplomas(diplomas, map.getBounds());
        // enumerate # of percentages, though might change range
        numDiplomas = percentNoDiploma[5] + percentNoDiploma[10] + percentNoDiploma[20];
        // update content of element diploma-count
        document.getElementById("diploma-count").innerHTML = numDiplomas;

        // add "mag" to the beginning of the x variable - the magnitude, and "#" to the beginning of the y variable - the number of earthquake of similar magnitude.
        x = Object.keys(percentNoDiploma);
        x.unshift("Percent_Without_Diploma")
        y = Object.values(percentNoDiploma);
        y.unshift("#")
        console.log(x);

        // generate the chart
        diplomaChart = c3.generate({
            size: {
                height: 350,
                width: 460
            },
            data: {
                x: 'Percent_Without_Diploma',
                columns: [x, y],
                type: 'bar', // make a bar chart.
                colors: {
                    '#': (d) => {
                        return colors[d["x"]];
                    }
                },
                onclick: function (d) { // update the map and sidebar once the bar is clicked.
                    let floor = parseInt(x[1 + d["x"]]),
                        ceiling = floor + 1;
                    // combine two filters, the first is ['>=', 'mag', floor], the second is ['<', 'mag', ceiling]
                    // the first indicates all the earthquakes with magnitude greater than floor, the second indicates
                    // all the earthquakes with magnitude smaller than the ceiling.
                    map.setFilter('diplomas-point',
                        ['all',
                            ['>=', 'pctnodiploma', floor],
                            ['<', 'pctnodiploma', ceiling]
                        ]);
                }
            },
            axis: {
                x: { //magnitude
                    type: 'category',
                },
                y: { //count
                    tick: {
                        values: [200, 400, 600, 800]
                    }
                }
            },
            legend: {
                show: false
            },
            bindto: "#diploma-chart" //bind the chart to the place holder element "diploma-chart".
        });

    });



    //load data to the map as new layers.
    //map.on('load', function loadingData() {
    map.on('idle', () => { //simplifying the function statement: arrow with brackets to define a function

        percentNoDiploma = calDiplomas(diplomas, map.getBounds());
        numDiplomas = percentNoDiploma[5] + percentNoDiploma[10] + percentNoDiploma[20];
        document.getElementById("diploma-count").innerHTML = numDiplomas;


        x = Object.keys(percentNoDiploma);
        x.unshift("Percent_Without_Diploma")
        y = Object.values(percentNoDiploma);
        y.unshift("#")

        // after finishing each map reaction, the chart will be rendered in case the current bbox changes.
        diplomaChart.load({
            columns: [x, y]
        });
    });
}

// call the geojson loading function
geojsonFetch();

function calDiplomas(currentDiplomas, currentMapBounds) {
    let percentDiploma = {
        5: 0,
        10: 0,
        20: 0
    };
    currentDiplomas.features.forEach(function (d) {
        if (currentMapBounds.contains(d.geometry.coordinates)) {
            // need to double check if it rounds properly or will have to manually set a range
            let percent = d.properties.Percent_Without_Diploma;
            let roundedPercent = roundToNearest(percent, Object.keys(percentDiploma));
            percentDiploma[roundedPercent] += 1;
        }
    })
    return percentDiploma;
}

function roundToNearest(number, values) {
    let nearest = values.reduce(function(prev, curr) {
        return (Math.abs(curr - number) < Math.abs(prev - number) ? curr : prev);
    });
    return nearest;
}

// capture the element reset and add a click event to it.
const reset = document.getElementById('reset');
reset.addEventListener('click', event => {

    // this event will trigger the map fly to its origin location and zoom level.
    map.flyTo({
        zoom: 6,
        center: [-123, 47]
    });
    // also remove all the applied filters
    map.setFilter('diplomas-point', null)


});