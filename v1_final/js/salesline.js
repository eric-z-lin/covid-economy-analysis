// SalesLine: Object constructor function
class SalesLine {
	constructor(parentElement, data, configs) {
		this.parentElement = parentElement;
		this.data = data;
		this.configs = configs;
		this.displayData = data;
		this.initVis();
	}

	// initialize visualization (static content)
	initVis() {
		let vis = this;

		// define margins, width, and height
		vis.margin = {top: 40, right: 40, bottom: 60, left: 200};
		vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right;
		vis.height = $('#' + vis.parentElement).height() - vis.margin.top - vis.margin.bottom;

		// define SVG drawing area
		vis.svg = d3.select("#" + vis.parentElement).append("svg")
			.attr("width", vis.width + vis.margin.left + vis.margin.right)
			.attr("height", vis.height + vis.margin.top + vis.margin.bottom)
			.append("g")
			.attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

		// define scales and axes
		vis.x = d3.scaleTime()
			.range([0, vis.width]);
		vis.y = d3.scaleLinear()
			.range([vis.height, 0]);
		vis.xAxis = d3.axisBottom()
			.scale(vis.x);
		vis.yAxis = d3.axisLeft()
			.scale(vis.y);

		// append axes
		vis.svg.append("g")
			.attr("class", "x-axis axis")
			.attr("transform", "translate(0," + vis.height + ")");
		vis.svg.append("g")
			.attr("class", "y-axis axis");

		// create tooltip
		vis.tooltip = d3.select("body")
			.append("div")
			.attr("class", "d3-tip")
			.style("position", "absolute")
			.style("z-index", "10")
			.style("visibility", "hidden");

		// create linepath and line arrays
		vis.linepath = [];
		vis.line = [];

		// iterate over configs to create linepaths and lines for each product
		vis.configs.forEach(function (product, index) {
			vis.linepath[index] = d3.line()
				.x(d => vis.x(d.month))
				.y(d => vis.y(d[product]));
			vis.line[index] = vis.svg.append("path")
				.attr("class", "salesline");
		});

		// filter, aggregate, modify data
		vis.wrangleData();
	}

	// data wrangling
	wrangleData() {
		let vis = this;

		// filter based on user selection of recession
		if (selectedCategory == "great_recession") {
			vis.displayData = vis.data.filter((value, index) => {
				return ((value.month) >= (dateParser("Monday, January 1, 2007"))) && ((value.month) <= (dateParser("Tuesday, December 1, 2009")));
			})
		} else if (selectedCategory == "covid_recession") {
			vis.displayData = vis.data.filter((value, index) => {
				return ((value.month) >= (dateParser("Sunday, December 1, 2019")));
			})
		} else {
			vis.displayData = vis.data;
		}

		// update the visualization
		vis.updateVis();
	}

	// drawing function (with D3 update sequence)
	updateVis() {
		let vis = this;

		// update domains
		vis.x.domain(d3.extent(vis.displayData, d => d.month));
		vis.y.domain([0, 110000])

		// draw lines
		vis.configs.forEach(function (product, index) {
			vis.line[index]
				.datum(vis.displayData)
				// display product name when mouseover
				.on("mouseover", function (event, d) {
					vis.tooltip
						.style("left", event.x + "px")
						.style("top", event.y + "px")
						.style("visibility", "visible")
						.html(product);
				})
				.on("mouseout", function () {
					vis.tooltip.style("visibility", "hidden");
				})
				.transition()
				.duration(800)
				.attr("fill", "none")
				.attr("stroke-width", 1.5)
				.attr("stroke", "steelblue")
				.attr("d", vis.linepath[index])
		})

		// update x axis
		vis.svg.select(".x-axis")
			.transition()
			.duration(800)
			.call(vis.xAxis);

		// update y axis
		vis.svg.select(".y-axis")
			.transition()
			.duration(800)
			.call(vis.yAxis);
	}
}