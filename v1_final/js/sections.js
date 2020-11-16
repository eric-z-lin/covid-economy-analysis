/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */
function scrollVis(salesData, salesConfigs) {
  // constants to define the size
  // and margins of the vis area.
  var width = 600;
  var height = 520;
  var margin = { top: 30, left: 20, bottom: 40, right: 10 };

  // Keep track of which visualization
  // we are on and which was the last
  // index activated. When user scrolls
  // quickly, we want to call all the
  // activate functions that they pass.
  var lastIndex = -1;
  var activeIndex = 0;

  // Sizing for the grid visualization
  var squareSize = 6;
  var squarePad = 2;
  var numPerRow = width / (squareSize + squarePad);

  // main svg used for visualization
  var svg = null;

  // d3 selection that will be used
  // for displaying visualizations
  var g = null;

  // We will set the domain when the
  // data is processed.
  // @v4 using new scale names
  var xBarScale = d3.scaleLinear()
    .range([0, width]);

  // The bar chart display is horizontal
  // so we can use an ordinal scale
  // to get width and y locations.
  // @v4 using new scale type
  var yBarScale = d3.scaleBand()
    .paddingInner(0.08)
    .domain([0, 1, 2])
    .range([0, height - 50], 0.1, 0.1);

  // Color is determined just by the index of the bars
  var barColors = { 0: '#008080', 1: '#399785', 2: '#5AAF8C' };

  // @v4 using new scale name
  var xHistScale = d3.scaleLinear()
    .domain([0, 30])
    .range([0, width - 20]);

  // @v4 using new scale name
  var yHistScale = d3.scaleLinear()
    .range([height, 0]);

  // The color translation uses this
  // scale to convert the progress
  // through the section into a
  // color value.
  // @v4 using new scale name
  var coughColorScale = d3.scaleLinear()
    .domain([0, 1.0])
    .range(['#008080', 'red']);


  // You could probably get fancy and
  // use just one axis, modifying the
  // scale, but I will use two separate
  // ones to keep things easy.
  // @v4 using new axis name
  // var xAxisBar = d3.axisBottom()
  //   .scale(xBarScale);

  // @v4 using new axis name
  // var xAxisHist = d3.axisBottom()
  //   .scale(xHistScale)
  //   .tickFormat(function (d) { return d + ' min'; });

  // When scrolling to a new section
  // the activation function for that
  // section is called.
  var activateFunctions = [];
  // If a section has an update function
  // then it is called while scrolling
  // through the section with the current
  // progress through the section.
  var updateFunctions = [];

  let x_gdp, y_gdp;

  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function (selection) {
    selection.each(function (rawData) {
      console.log('raw', rawData);
      // create svg and give it a width and height
      svg = d3.select(this).selectAll('svg').data([wordData]);
      var svgE = svg.enter().append('svg');
      // @v4 use merge to combine enter and existing selection
      svg = svg.merge(svgE);

      svg.attr('width', width + margin.left + margin.right);
      svg.attr('height', height + margin.top + margin.bottom);

      svg.append('g');


      // this group element will be used to contain all
      // other elements.
      g = svg.select('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // perform some preprocessing on raw data
      var wordData = getWords(rawData['wordData']);
      // filter to just include filler words
      var fillerWords = getFillerWords(wordData);

      // get the counts of filler words for the
      // bar chart display
      var fillerCounts = groupByWord(fillerWords);
      // set the bar scale's domain
      var countMax = d3.max(fillerCounts, function (d) { return d.value;});
      xBarScale.domain([0, countMax]);

      // get aggregated histogram data

      var histData = getHistogram(fillerWords);
      // set histogram's domain
      var histMax = d3.max(histData, function (d) { return d.length; });
      yHistScale.domain([0, histMax]);

      let salesData = rawData["salesData"];
      let configs = rawData["configs"];
      let gdpData = rawData["gdpData"];

      setupVis(wordData, fillerCounts, histData, salesData, configs, gdpData);

      setupSections();
    });
  };

  function generateSalesLine(svg, data, configs) {
    // define scales and axes
    let x = d3.scaleTime()
        .range([50, width]);
    let y = d3.scaleLinear()
        .range([height, margin.top]);
    let xAxis = d3.axisBottom()
        .scale(x);
    let yAxis = d3.axisLeft()
        .scale(y);

    // append axes
    svg.append("g")
        .attr("class", "x-axis axis")
        .attr("id", "sales-xaxis")
        .attr("transform", "translate(0," + height + ")");
    svg.append("g")
        .attr("class", "y-axis axis")
        .attr("id", "sales-yaxis")
        .attr("transform", "translate(50,0)");

    // create tooltip
    let tooltip = d3.select("#vis")
        .append("div")
        .attr("class", "d3-tip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden");

    // create linepath and line arrays
    let linepath = [];
    let line = [];

    // iterate over configs to create linepaths and lines for each product
    configs.forEach(function(product, index) {
      linepath[index] = d3.line()
          .x(d => x(d.month))
          .y(d => y(d[product]));
      line[index] = svg.append("path")
          .attr("class", "salesline");
    });

    // update domains
    x.domain(d3.extent(salesData, d => d.month));
    y.domain([0, 110000])

    // draw lines
    configs.forEach(function (product, index) {
      line[index]
          .datum(salesData)
          // display product name when mouseover
          .on("mouseover", function (event, d) {
            tooltip
                .style("left", event.x - 300 + "px")
                .style("top", event.y - 100 + "px")
                .style("visibility", "visible")
                .html(product);
          })
          .on("mouseout", function () {
            tooltip.style("visibility", "hidden");
          })
          .transition()
          .duration(800)
          .attr("fill", "none")
          .attr("stroke-width", 3)
          .attr("stroke", "#008080")
          .attr("d", linepath[index])
    })

    // update x axis
    svg.select(".x-axis")
        .transition()
        .duration(800)
        .call(xAxis);

    // update y axis
    svg.select(".y-axis")
        .transition()
        .duration(800)
        .call(yAxis);

    // Hide
    svg.select('.x-axis')
        .transition().duration(500)
        .style('opacity', 0);
    svg.select('.y-axis')
        .transition().duration(500)
        .style('opacity', 0);
    svg.selectAll('.salesline')
        .transition().duration(500)
        .attr('stroke-width', 0);
  }

  function generateGDPBar(svg, gdpData){
    // define scales and axes
    x_gdp = d3.scaleBand()
        .domain(d3.map(gdpData, d => d.Date))
        .range([40, width])
        .padding(0.2);
    y_gdp = d3.scaleLinear()
        .domain([18.0, 22.0])
        .range([height, margin.top]);
    let xAxis_gdp = d3.axisBottom()
        .scale(x_gdp)
        .tickValues([dateParserGDP('09-2019'), dateParserGDP('12-2019'), dateParserGDP('03-2020'), dateParserGDP('06-2020')])
        .tickFormat(dateFormatter);
    let yAxis_gdp = d3.axisLeft()
        .scale(y_gdp);

    // append axes
    svg.append("g")
        .attr("class", "gdp-x-axis axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis_gdp);
    svg.append("g")
        .attr("class", "gdp-y-axis axis")
        .attr("transform", "translate(40,0)")
        .call(yAxis_gdp);

    // create tooltip
    let tooltip1 = d3.select("#vis")
        .append("div")
        .attr("class", "d3-tip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden");

    // draw bars
    svg.selectAll(".bar-gdp")
        .data(gdpData)
        .enter().append("rect")
        .on("mouseover", function (event, d) {
          d3.select(this)
              .attr("fill", "#004949");
          tooltip1
              .style("left", event.x - 300 + "px")
              .style("top", event.y - 100 + "px")
              .style("visibility", "visible")
              .html(d.GDP);
        })
        .on("mouseout", function () {
          d3.select(this)
              .attr("fill", "#008080");
          tooltip1.style("visibility", "hidden");
        })
        .attr("class", "bar-gdp")
        .attr("x", d => x_gdp(d.Date))
        .attr("y", d => y_gdp(d.GDP))
        .attr("width", x_gdp.bandwidth())
        .attr("height", d => height - y_gdp(d.GDP))
        .attr("fill", barColors[0]);

    // Hide
    svg.select('.gdp-x-axis')
        .transition()
        .duration(0)
        .style('opacity', 0);
    svg.select('.gdp-y-axis')
        .transition()
        .duration(0)
        .style('opacity', 0);
    svg.selectAll('.bar-gdp')
        .style('opacity', 0);
  }

  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param wordData - data object for each word.
   * @param fillerCounts - nested data that includes
   *  element for each filler word type.
   * @param histData - binned histogram data
   */
  var setupVis = function (wordData, fillerCounts, histData, salesData, configs, gdpData) {
    // axis
    g.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')');
    g.select('.x.axis').style('opacity', 0);

    // title
    g.append('text')
      .attr('class', 'title covid-title')
      .attr('x', width / 2)
      .attr('y', height / 3)
      .text('COVID-19');

    g.append('text')
      .attr('class', 'sub-title covid-title')
      .attr('x', width / 2)
      .attr('y', (height / 3) + (height / 5))
      .text('Recession');

    g.selectAll('.covid-title')
      .attr('opacity', 0);

    // credits
    g.append('text')
        .attr('class', 'title credits-title')
        .attr('x', width / 2)
        .attr('y', height / 3)
        .text('Take Action');
    g.append('text')
        .attr('class', 'sub-text credits-title')
        .attr('x', width / 2)
        .attr('y', (height / 3) + (height / 5))
        .text('Support local businesses!');
    g.selectAll('.credits-title')
        .attr('opacity', 0);

    // count filler word count title
    g.append('text')
      .attr('class', 'title count-title highlight')
      .attr('x', width / 2)
      .attr('y', height / 3)
      .text('200 Million');

    g.append('text')
      .attr('class', 'sub-title count-title')
      .attr('x', width / 2)
      .attr('y', (height / 3) + (height / 5))
      .text('Daily Zoom Users');

    g.selectAll('.count-title')
      .attr('opacity', 0);

    // square grid
    // @v4 Using .merge here to ensure
    // new and old data have same attrs applied
    var squares = g.selectAll('.square').data(wordData, function (d) { return d.word; });
    var squaresE = squares.enter()
      .append('rect')
      .classed('square', true);
    squares = squares.merge(squaresE)
      .attr('width', squareSize)
      .attr('height', squareSize)
      .attr('fill', '#fff')
      .classed('fill-square', function (d) { return d.filler; })
      .attr('x', function (d) { return d.x;})
      .attr('y', function (d) { return d.y;})
      .attr('opacity', 0);

    // barchart
    // Using .merge here to ensure
    // new and old data have same attrs applied
    var bars = g.selectAll('.bar').data(fillerCounts);
    var barsE = bars.enter()
      .append('rect')
      .attr('class', 'bar');
    bars = bars.merge(barsE)
      .attr('x', 0)
      .attr('y', function (d, i) { return yBarScale(i);})
      .attr('fill', function (d, i) { return barColors[i]; })
      .attr('width', 0)
      .attr('height', yBarScale.bandwidth());

    // var barText = g.selectAll('.bar-text').data(fillerCounts);
    // barText.enter()
    //   .append('text')
    //   .attr('class', 'bar-text')
    //   .text(function (d) { return d.key + '…'; })
    //   .attr('x', 0)
    //   .attr('dx', 15)
    //   .attr('y', function (d, i) { return yBarScale(i);})
    //   .attr('dy', yBarScale.bandwidth() / 1.2)
    //   .style('font-size', '110px')
    //   .attr('fill', 'white')
    //   .attr('opacity', 0);

    // histogram
    // @v4 Using .merge here to ensure
    // new and old data have same attrs applied

    // var hist = g.selectAll('.hist').data(histData);
    // var histE = hist.enter().append('rect')
    //   .attr('class', 'hist');
    // hist = hist.merge(histE).attr('x', function (d) { return xHistScale(d.x0); })
    //   .attr('y', height)
    //   .attr('height', 0)
    //   .attr('width', xHistScale(histData[0].x1) - xHistScale(histData[0].x0) - 1)
    //   .attr('fill', barColors[0])
    //   .attr('opacity', 0);
    generateGDPBar(svg, gdpData);



    generateSalesLine(svg, salesData, salesConfigs);

  };

  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  var setupSections = function () {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = showTitle;
    activateFunctions[1] = showFillerTitle;
    activateFunctions[2] = showGrid;
    activateFunctions[3] = highlightGrid;
    activateFunctions[4] = showHistPart;
    activateFunctions[5] = showHistAll;
    activateFunctions[6] = showConsumption;
    activateFunctions[7] = showBar;
    activateFunctions[8] = showCredits;

    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    // for (var i = 0; i < 9; i++) {
    //   updateFunctions[i] = function () {};
    // }
    // updateFunctions[7] = updateCough;
  };

  /**
   * ACTIVATE FUNCTIONS
   *
   * These will be called their
   * section is scrolled to.
   *
   * General pattern is to ensure
   * all content for the current section
   * is transitioned in, while hiding
   * the content for the previous section
   * as well as the next section (as the
   * user may be scrolling up or down).
   *
   */

  /**
   * showTitle - initial title
   *
   * hides: count title
   * (no previous step to hide)
   * shows: intro title
   *
   */
  function showTitle() {
    g.selectAll('.count-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.covid-title')
      .transition()
      .duration(600)
      .attr('opacity', 1.0);
  }

  /**
   * showFillerTitle - filler counts
   *
   * hides: intro title
   * hides: square grid
   * shows: filler count title
   *
   */
  function showFillerTitle() {
    g.selectAll('.covid-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.square')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.count-title')
      .transition()
      .duration(600)
      .attr('opacity', 1.0);
  }

  /**
   * showGrid - square grid
   *
   * hides: filler count title
   * hides: filler highlight in grid
   * shows: square grid
   *
   */
  function showGrid() {
    g.selectAll('.count-title')
      .transition()
      .duration(0)
      .attr('opacity', 0);

    g.selectAll('.square')
      .transition()
      .duration(600)
      .delay(function (d) {
        return 5 * d.row;
      })
      .attr('opacity', 1.0)
      .attr('fill', '#ddd');
  }

  /**
   * highlightGrid - show fillers in grid
   *
   * hides: histchart, text and axis
   * shows: square grid and highlighted
   *  filler words. also ensures squares
   *  are moved back to their place in the grid
   */
  function highlightGrid() {
    // g.selectAll('.hist')
    //     .transition()
    //     .duration(600)
    //     .attr('height', function () { return 0; })
    //     .attr('y', function () { return height; })
    //     .style('opacity', 0);
    svg.select('.gdp-x-axis')
        .transition().duration(500)
        .style('opacity', 0);
    svg.select('.gdp-y-axis')
        .transition().duration(500)
        .style('opacity', 0);
    svg.selectAll('.bar-gdp')
        .transition()
        .duration(600)
        .style('opacity', 0);


    g.selectAll('.square')
      .transition()
      .duration(0)
      .attr('opacity', 1.0)
      .attr('fill', '#ddd');

    // use named transition to ensure
    // move happens even if other
    // transitions are interrupted.
    g.selectAll('.fill-square')
      .transition('move-fills')
      .duration(800)
      .attr('x', function (d) {
        return d.x;
      })
      .attr('y', function (d) {
        return d.y;
      });

    g.selectAll('.fill-square')
      .transition()
      .duration(800)
      .attr('opacity', 1.0)
      .attr('fill', function (d) { return d.filler ? '#008080' : '#ddd'; });
  }


  /**
   * showHistPart - shows the first part
   *  of the histogram of filler words
   *
   * hides: grid
   * hides: last half of histogram
   * shows: first half of histogram
   *
   */
  function showHistPart() {
    // switch the axis to histogram one
    // showAxis(xAxisHist);
    // hide
    g.selectAll('.square')
        .transition()
        .duration(800)
        .attr('opacity', 0);

    g.selectAll('.fill-square')
        .transition()
        .duration(800)
        .attr('x', 0)
        .attr('y', function (d, i) {
          return yBarScale(i % 3) + yBarScale.bandwidth() / 2;
        })
        .transition()
        .duration(0)
        .attr('opacity', 0);

    // Show
    svg.select('.gdp-x-axis')
        .transition().duration(500)
        .style('opacity', 1);
    svg.select('.gdp-y-axis')
        .transition().duration(500)
        .style('opacity', 1);

    // here we only show a bar if
    // it is before the 15 minute mark
    g.selectAll('.bar-gdp')
      .transition()
      .duration(600)
      .style('opacity', function (d) { return (d.Date < dateParserGDP('04-2020')) ? 1.0 : 1e-6; });
    svg.selectAll(".bar-gdp")
      .transition()
      .duration(600)
      .attr('y', function (d) { return (d.Date < dateParserGDP('04-2020')) ? (y_gdp(d.GDP)) : height; })
      .attr('height', function (d) { return (d.Date < dateParserGDP('04-2020')) ? height - (y_gdp(d.GDP)) : 0; })
      .style('opacity', function (d) { return (d.Date < dateParserGDP('04-2020')) ? 1.0 : 1e-6; });

  }

  /**
   * showHistAll - show all histogram
   *
   * hides: barchart
   * (previous step is also part of the
   *  histogram, so we don't have to hide
   *  that)
   * shows: all histogram bars
   *
   */
  function showHistAll() {
    // ensure the axis to histogram one
    // showAxis(xAxisHist);
    // Hide sales line
    svg.select('.x-axis')
        .transition().duration(500)
        .style('opacity', 0);
    svg.select('.y-axis')
        .transition().duration(500)
        .style('opacity', 0);
    svg.selectAll('.salesline')
        .transition().duration(500)
        .attr('stroke-width', 0);

    // named transition to ensure
    // color change is not clobbered
    // g.selectAll('.hist')
    //   .transition('color')
    //   .duration(500)
    //   .style('fill', '#008080');
    //
    // g.selectAll('.hist')
    //   .transition()
    //   .duration(1200)
    //   .attr('y', function (d) { return yHistScale(d.length); })
    //   .attr('height', function (d) { return height - yHistScale(d.length); })
    //   .style('opacity', 1.0);
    svg.selectAll(".bar-gdp")
        .transition()
        .duration(1200)
        .attr('y', function (d) { return y_gdp(d.GDP); })
        .attr('height', function (d) { return height - (y_gdp(d.GDP)); })
        .style('opacity', 1.0);

  }

  /**
   * showConsumption
   *
   * hides: everything
   * shows: Sophie's histogram
   *
   */
  function showConsumption() {
    svg.select('.gdp-x-axis')
        .transition().duration(500)
        .style('opacity', 0);
    svg.select('.gdp-y-axis')
        .transition().duration(500)
        .style('opacity', 0);
    svg.selectAll('.bar-gdp')
        .transition()
        .duration(600)
        .style('opacity', 0);

    // Show line graph
    // Sophie's sales line visualization
    svg.select('.x-axis')
        .transition().duration(500)
        .style('opacity', 1);
    svg.select('.y-axis')
        .transition().duration(500)
        .style('opacity', 1);
    svg.selectAll('.salesline')
        .transition().duration(500)
        .attr('stroke-width', 1);
  }

  /**
   * showBar - barchart
   *
   * hides: square grid
   * hides: histogram
   * shows: barchart
   *
   */
  function showBar() {
    // ensure bar axis is set
    // showAxis(xAxisBar);
    // Hide
    svg.select('.x-axis')
        .transition().duration(500)
        .style('opacity', 0);
    svg.select('.y-axis')
        .transition().duration(500)
        .style('opacity', 0);
    svg.selectAll('.salesline')
        .transition().duration(500)
        .attr('stroke-width', 0);
    g.selectAll('.credits-title')
        .transition()
        .duration(600)
        .attr('opacity', 0.0);

    g.selectAll('.bar')
        .transition()
        .delay(function (d, i) { return 300 * (i + 1);})
        .duration(600)
        .attr('width', function (d) { return xBarScale(d.value); });

    g.selectAll('.bar-text')
        .transition()
        .duration(600)
        .delay(1200)
        .attr('opacity', 1);
  }

  /**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param axis - the axis to show
   *  (xAxisHist or xAxisBar)
   */
  function showAxis(axis) {
    g.select('.x.axis')
      .call(axis)
      .transition().duration(500)
      .style('opacity', 1);
  }

  /**
   * hideAxis - helper function
   * to hide the axis
   *
   */
  function hideAxis() {
    g.select('.x.axis')
      .transition().duration(500)
      .style('opacity', 0);
  }


  function showCredits() {
    // Hide
    hideAxis();
    g.selectAll('.bar')
        .transition()
        .duration(600)
        .attr('width', 0);
    g.selectAll('.bar-text')
        .transition()
        .duration(0)
        .attr('opacity', 0);

    // Show
    g.selectAll('.credits-title')
        .transition()
        .duration(600)
        .attr('opacity', 1.0);
  }

  /**
   * UPDATE FUNCTIONS
   *
   * These will be called within a section
   * as the user scrolls through it.
   *
   * We use an immediate transition to
   * update visual elements based on
   * how far the user has scrolled
   *
   */



  /**
   * DATA FUNCTIONS
   *
   * Used to coerce the data into the
   * formats we need to visualize
   *
   */

  /**
   * getWords - maps raw data to
   * array of data objects. There is
   * one data object for each word in the speach
   * data.
   *
   * This function converts some attributes into
   * numbers and adds attributes used in the visualization
   *
   * @param rawData - data read in from file
   */
  function getWords(rawData) {
    console.log(rawData);
    return d3.map(rawData, function (d, i) {
      // is this word a filler word?
      d.filler = (d.filler === '1') ? true : false;
      // time in seconds word was spoken
      d.time = +d.time;
      // time in minutes word was spoken
      d.min = Math.floor(d.time / 60);

      // positioning for square visual
      // stored here to make it easier
      // to keep track of.
      d.col = i % numPerRow;
      d.x = d.col * (squareSize + squarePad);
      d.row = Math.floor(i / numPerRow);
      d.y = d.row * (squareSize + squarePad);
      return d;
    });
  }

  /**
   * getFillerWords - returns array of
   * only filler words
   *
   * @param data - word data from getWords
   */
  function getFillerWords(data) {
    return data.filter(function (d) {return d.filler; });
  }

  /**
   * getHistogram - use d3's histogram layout
   * to generate histogram bins for our word data
   *
   * @param data - word data. we use filler words
   *  from getFillerWords
   */
  function getHistogram(data) {
    // only get words from the first 30 minutes
    var thirtyMins = data.filter(function (d) { return d.min < 30; });
    // bin data into 2 minutes chuncks
    // from 0 - 31 minutes
    // @v4 The d3.histogram() produces a significantly different
    // data structure then the old d3.layout.histogram().
    // Take a look at this block:
    // https://bl.ocks.org/mbostock/3048450
    // to inform how you use it. Its different!
    return d3.histogram()
      .thresholds(xHistScale.ticks(10))
      .value(function (d) { return d.min; })(thirtyMins);
  }

  /**
   * groupByWord - group words together
   * using nest. Used to get counts for
   * barcharts.
   *
   * @param words
   */
  function groupByWord(words) {
    return d3.rollup(words, v => v.length, d=>d.word);
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function (index) {
    activeIndex = index;
    var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
    scrolledSections.forEach(function (i) {
      activateFunctions[i]();
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  // chart.update = function (index, progress) {
  //   updateFunctions[index](progress);
  // };

  // return chart function
  return chart;
};

/**
 * Get Data
 * sales.csv
 * gdp.csv
 *
 */
// Function to convert date objects to strings or reverse
// takes a date -> string
let dateFormatter = d3.timeFormat("%b %Y");

// takes a string -> date
let dateParser = d3.timeParse("%A, %B%e, %Y");
let dateParserGDP = d3.timeParse("%m-%Y");
let salesData, gdpData, wordData;
// names of columns
let all_configs = ["All other gen. merchandise stores", "Automobile and other motor vehicle dealers",
  "Automotive parts, acc., and tire stores", "Beer, wine and liquor stores", "Building mat. and garden equip. and supplies dealers",
  "Building mat. and supplies dealers", "Clothing and clothing access. stores", "Clothing stores", "Department stores",
  "Electronic shopping and mail order houses", "Electronics and appliance stores", "Food and beverage stores",
  "Food services and drinking places", "Fuel dealers", "Furniture and home furnishings stores",
  "Furniture, home furn, electronics, and appliance stores", "Gasoline stations", "General merchandise stores", "Grocery stores",
  "Health and personal care stores", "Jewelry stores", "Men's clothing stores", "Miscellaneous stores retailers", "Motor vehicle and parts dealers",
  "Nonstore retailers", "Other general merchandise stores", "Pharmacies and drug stores", "Retail and food services sales, total",
  "Shoe stores", "Sporting goods, hobby, musical instrument, and book stores", "Warehouse clubs and superstores", "Women's clothing stores"]

let some_configs = ["Motor vehicle and parts dealers", "Electronics and appliance stores",
  "Food and beverage stores", "Beer, wine and liquor stores",
  "Gasoline stations", "Clothing stores", "Sporting goods, hobby, musical instrument, and book stores",
  "General merchandise stores", "Grocery stores", "Warehouse clubs and superstores", "Electronic shopping and mail order houses",
  "Food services and drinking places"]




/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(wordData, salesData, gdpData, configs) {
  // create a new plot and
  // display it
  var plot = scrollVis(salesData, configs);
  let allData = {
    'wordData': wordData,
    'salesData': salesData,
    'gdpData': gdpData,
    'configs': configs
  }
  d3.select('#vis')
    .datum(allData)
    .call(plot);

  // setup scroll functionality
  var scroll = scroller()
    .container(d3.select('#graphic'));

  // pass in .step selection as the steps
  scroll(d3.selectAll('.step'));

  // setup event handling
  scroll.on('active', function (index) {
    // highlight current step text
    d3.selectAll('.step')
      .style('opacity', function (d, i) { return i === index ? 1 : 0.1; });

    // activate current section
    plot.activate(index);
  });

  // scroll.on('progress', function (index, progress) {
  //   plot.update(index, progress);
  // });
}

Promise.all([
  d3.csv("data/sales.csv"),
  d3.csv("data/gdp_clean.csv"),
  d3.tsv("data/words.tsv"),
]).then(function(files) {
  // files[0] will contain file1.csv
  // files[1] will contain file2.csv
  console.log(files[0])
  console.log(files[1])

  salesData = files[0];
  gdpData = files[1];
  wordData = files[2];  // Dummy data used in tutorial

  // convert string to date
  salesData.forEach(function(row){
    row.month = dateParser(row.month);
    some_configs.forEach(function(d) {
      row[d] = +row[d];
    })
  });

  gdpData.forEach(function(row){
    row.Date = dateParserGDP(row.Date);
    row.GDP = +row.GDP;
  });

  display(wordData, salesData, gdpData, some_configs);

}).catch(function(err) {
  // handle error here
  console.log("Couldn't load data", err)
})

// load data and display
// d3.tsv('data/words.tsv', display);
