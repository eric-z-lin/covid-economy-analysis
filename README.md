# covid-economy-analysis
Harvard CS 171 Final Project

Files:

1. README.md: summarizes all of the files relating to this final project and their contents

2. Sketches.pdf: contains all of the potential visualizations that we considered while creating this final project.

3. CS171_Final_Project.pdf: contains all of the tasks completed from Weeks 8-14 (including our Process Book, Project Proposal, Team Agreement, Detailed Project Plan, Data, Sketches, Storyboard, Prototype V1, Prototype V2, and Think Aloud Study Results).

4. v2 folder:
	a. css folder:
		i. boostrap,css, bootstrap.css.map, bootstrap.min.css: css files from the online repository.
		ii. style.css: contains our groups' styling choices.
	b. data folder:
		i. census_usa.csv: census data from each of the 50 states from 2010 to 2019.
		ii. gdp_clean.csv: monthly US GDP (in $T) from Jun 2019 - Sep 2020.
		iii. mrtssales92-present.xls: monthly sales (in $M) of industries from Jan 1992 - Aug 2020.
		iv. sales.csv: cleaned version of mrtssales92-present.xls.
		v. states-10m.json: data to create a US map from the online repository.
		vi.us_map_grid.csv: lockdown status of states due to COVID-19.
		vii.words.tsv: dummy data.
		viii. ppp_data.csv: PPP given to every state from Apr 2020 - Aug 2020. 
	c. index.html: displays the text on the left hand side during scroll, see js folder for implementation of 	    visualizations.
	d. js folder: 
		i. helpers.js: stores names of states and their abbreviations.
		ii. mapVis.js: contains the map visualization of PPP data (on hover, it displays PPP information 		    by state).
		iii. scroller.js: contains the position of the scroll in order to decide which visualizations to 			     display and which visualizations to hide in the html file as the user scrolls.
		iv. sections.js: contains the code for initializing the visualizations, wrangling the data, and 			     updating the visualizations, as well as ensuring that the correct visualizations are displayed 		     and hidden at the correct locations (help from http://bost.ocks.org/mike/chart/).
	e. lib folder: 
		i. d3.js: helper libraries from the online repository.
		ii. d3.min.js: helper libraries from the online repository.
	