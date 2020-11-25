/* * * * * * * * * * * * * *
*          MapVis          *
* * * * * * * * * * * * * */


class MapVis {

    // constructor method to initialize Map object
    constructor(parentElement, geoData, usaData, pppData, selectedCategory) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.usaData = usaData;
        this.pppData = pppData;
        this.selectedCategory = selectedCategory;
        this.displayData = [];

        // parse date method
        this.parseDate = d3.timeParse("%m/%d/%Y");

        this.colors = d3.scaleLinear()
            .range(['#f9f9f9', '#008080']);

        this.initMap()
    }

    initMap() {
        let mapObject = this

        mapObject.margin = {top: 20, right: 100, bottom: 100, left: 100};
        mapObject.width = $("#" + mapObject.parentElement).width() - mapObject.margin.left - mapObject.margin.right;
        mapObject.height = $("#" + mapObject.parentElement).height() - mapObject.margin.top - mapObject.margin.bottom;

        // init drawing area
        mapObject.svg = d3.select("#" + mapObject.parentElement).append("svg")
            .attr("width", mapObject.width)
            .attr("height", mapObject.height)
            .attr('transform', `translate (${mapObject.margin.left}, ${mapObject.margin.top})`);

        mapObject.path = d3.geoPath();
        mapObject.us = mapObject.geoData;

        mapObject.viewpoint = {'width': 975, 'height': 610};
        mapObject.zoom = mapObject.width / mapObject.viewpoint.width;

        // adjust map position
        mapObject.map = mapObject.svg.append("g") // group will contain all state paths
            .attr("class", "states")
            .attr('transform', `scale(${mapObject.zoom} ${mapObject.zoom})`);

        mapObject.states = mapObject.map.selectAll(".state")
            .data(topojson.feature(mapObject.us, mapObject.us.objects.states).features)
            .enter().append("path")
            .attr('class','state')
            .attr("d", mapObject.path);
        mapObject.map.append("path")
            .datum(topojson.mesh(mapObject.us, mapObject.us.objects.states, (a, b) => a !== b))
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-linejoin", "round")
            .attr("pointer-events", "none")
            .attr("d", mapObject.path);

        // append tooltip
        mapObject.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip');

        // append legend
        mapObject.legend = mapObject.svg.append("rect")
            .attr('transform', `translate(${mapObject.width * 2.8 / 4.5}, ${mapObject.height - 40})`)
            .attr("width", 200)
            .attr("height", 20);
        mapObject.defs = mapObject.svg.append("defs");
        mapObject.linearGradient = mapObject.defs.append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        // append legend's axis
        mapObject.legendScale = d3.scaleLinear()
            .range([0,200])
        mapObject.legendAxis = d3.axisBottom()
            .scale(mapObject.legendScale)
            .ticks(3);
        mapObject.axis = mapObject.svg.append("g")
            .attr("class", "x-axis axis")
            .attr('transform', `translate(${mapObject.width * 2.8 / 4.5}, ${mapObject.height - 20})`)

        mapObject.wrangleData()

    }

    wrangleData() {
        let mapObject = this;

        // first, filter according to selectedTimeRange, init empty array
        let filteredData = [];


        filteredData = mapObject.pppData;

        // prepare covid data by grouping all rows by state
        let pppDataByState = Array.from(d3.group(filteredData, d => d.State), ([key, value]) => ({key, value}))

        // init final data structure in which both data sets will be merged into
        mapObject.stateInfo = []

        // merge
        pppDataByState.forEach( state => {

            // get full state name
            let stateName = nameConverter.getFullName(state.key)

            // init counters
            let population = 0;
            let aCount = 0;
            let bCount = 0;
            let cCount = 0;
            let dCount = 0;
            let eCount = 0;

            // look up population for the state in the census data set
            mapObject.usaData.forEach( row => {
                if(row.state === stateName){
                    population += +row["2019"].replaceAll(',', '');
                }
            })

            // calculate new cases by summing up all the entries for each state
            state.value.forEach( entry => {
                if (entry.LoanRange === "a $5-10 million") {
                    aCount++;
                }
                else if (entry.LoanRange === "b $2-5 million") {
                    bCount++;
                }
                else if (entry.LoanRange === "c $1-2 million") {
                    cCount++;
                }
                else if (entry.LoanRange === "d $350,000-1 million") {
                    dCount++;
                }
                else {
                    eCount++;
                }
            });

            let loanCount = aCount + bCount + cCount + dCount + eCount;

            // populate the final data structure
            if (stateName === "" | stateName === "American Samoa" | stateName === "Guam" | stateName === "Puerto Rico" | stateName === "US Virgin Islands"){
                return null;
            }
            else {
                mapObject.stateInfo.push(
                    {
                        state: stateName,
                        population: population,
                        loanCount: loanCount,
                        relLoanCount: (loanCount/population*100),
                        a: aCount,
                        b: bCount,
                        c: cCount,
                        d: dCount,
                        e: eCount
                    }
                )
            }

        });

        console.log('final data structure for myMapVis', mapObject.stateInfo);

        mapObject.updateMap();
    }

    findValue(stateName) {
        let mapObject = this;
        let returnValue = [];
        mapObject.stateInfo.forEach( state => {
            if (stateName === state.state) {
                returnValue = state;
            }
        })
        return returnValue;
    }

    updateMap() {
        let mapObject = this;

        // update color domain
        mapObject.colors.domain([0,
            d3.max(mapObject.stateInfo, function(d){
                return d[mapObject.selectedCategory];
            })
        ]);

        mapObject.states.style("fill", function(d, index) {
                let thisStatesInfo = mapObject.findValue (d.properties.name);
                console.log(thisStatesInfo)
                return mapObject.colors(thisStatesInfo[mapObject.selectedCategory]);
            })
            .on('mouseover', function(event, d){
                let thisStatesInfo = mapObject.findValue (d.properties.name);

                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black');

                mapObject.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                <div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                     <h3> ${thisStatesInfo.state}<h3>
                     <h4> Population: ${thisStatesInfo.population}</h4>
                     <h4> Loans (absolute): ${thisStatesInfo.loanCount}</h4>
                     <h4> Loans (relative): ${thisStatesInfo.relLoanCount}</h4>
                     <h4> $5-10 million: ${thisStatesInfo.a}</h4>  
                     <h4> $2-5 million: ${thisStatesInfo.b}</h4>
                     <h4> $1-2 million: ${thisStatesInfo.c}</h4>
                     <h4> $350,000-1 million: ${thisStatesInfo.d}</h4>
                     <h4> $150,000-350,000: ${thisStatesInfo.e}</h4>
                </div>`);
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')

                mapObject.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            });

        // draw legend axis
        mapObject.legendScale.domain([0,
            d3.max(mapObject.stateInfo, function(d){
                return d[mapObject.selectedCategory];
            })
        ]);
        mapObject.svg.select(".x-axis").call(mapObject.legendAxis);

        // append legend
        mapObject.linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", '#f9f9f9');
        mapObject.linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", '#008080');
        mapObject.legend.style("fill", "url(#linear-gradient)");

    }
}