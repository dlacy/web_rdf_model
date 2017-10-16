
//	graph data store
var graph;

//	state variable for current link set
var firstLinks = false;

var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

//add encompassing group for the zoom
var g = svg.append("g")
    .attr("class", "everything");

//add zoom capabilities
var zoom_handler = d3.zoom()
    .on("zoom", zoom_actions);

zoom_handler(svg);

//	d3 color scheme
var color = d3.scaleOrdinal(d3.schemeCategory10);

// elements for data join
var link = g.append("g").selectAll(".link"),
	node = g.append("g").selectAll(".node"),
    image = g.append("g").selectAll(".icon");

//	simulation initialization
// This configuration is also pretty good
/*
var simulation = d3.forceSimulation()
	.force("link", d3.forceLink()
	    .id(function(d) { return d.id; }))
	.force("charge", d3.forceManyBody()
	    .strength(function(d) { return -500;}))
	.force("center", d3.forceCenter(width / 2, height / 2));
*/

var simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody())
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(20).strength(
    function(d){
        if ( d.link == "hard" ) {
            return .5;
        } else {
            return 0;
        }
    }
    ))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .on("tick", ticked);



//	button event handling
d3.select("#switch-btn").on("click", function() {
	firstLinks = !firstLinks;
	update();
});

//	follow v4 general update pattern
function update() {
  	// Update link set based on current state
	// DATA JOIN

    link = link.data(firstLinks ? graph.links.filter(function(d) { return d.link == "hard" }) : graph.links);

	// EXIT
  	// Remove old links
	link.exit().remove();

	// DATA JOIN
	node = node.data(graph.nodes);

	// EXIT
	node.exit().remove();

    simulation.force("charge", d3.forceManyBody())
        .nodes(graph.nodes)
        .on("tick", ticked);

  	simulation.force("link")
  		.links(firstLinks ? graph.links.filter(function(d) { return d.link == "hard" }) : graph.links);

	// ENTER
  	// Create new links as needed.

	link = link.enter().append("line")
		.attr("class", "link")
		.style("stroke-dasharray", function(d) {

            if (d.link == "hard") {
                return ("0, 0");
            } else {
                return ("3, 3");
            }
        })
        .style("stroke-width", function(d) {
            if (d.link == "hard") {
                return 1;
            } else {
                return .1;
            }
        })
		.merge(link);



	// ENTER
	node = node.enter().append("svg:image")
		.attr("class", "icon")
		.attr("xlink:href", function(d) { return d.img; })
		.attr("width", "20")
        .attr("height", "20")
		.call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended)
        )
		.merge(node);
    node.append("title")
        .text(function(d) { return d.id; });



// TODO: This tightens up the bundle.
/*
        .force("x", d3.forceX(width / 2))
        .force("y", d3.forceY(height / 2))
*/
  	simulation.alphaTarget(0.3).restart();
}



function ticked() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
/*
  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
*/
  node.attr("x", function(d) { return d.x - 10; })
       .attr("y", function(d) { return d.y - 10; });
}

//Zoom functions
function zoom_actions(){
    g.attr("transform", d3.event.transform)
}

function dragstarted(d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

//	load and save data
d3.json("node_link_model.json", function(err, g) {
	if (err) throw err;

	graph = g;

	update();
});
