// Function to convert date objects to strings or reverse
// takes a date -> string
let dateFormatter = d3.timeFormat("%b %Y");

// takes a string -> date
let dateParser = d3.timeParse("%A, %B%e, %Y");

// global sales data
let data;

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

let salesLine = [];

d3.csv = function (csv) {
	
}
// load data
d3.csv("data/sales.csv").then(csv=>{

	// convert string to date
	csv.forEach(function(row){
		row.month = dateParser(row.month);
		some_configs.forEach(function(d) {
			row[d] = +row[d];
		})
	});

	data = csv;

	// create sales lines
	salesLine = new SalesLine("sales", data, some_configs);
});

// get category that user selects
let selectedCategory = $('#categorySelector').val();

function categoryChange() {
	selectedCategory = $('#categorySelector').val();
	console.log(selectedCategory);
	salesLine.wrangleData();
}