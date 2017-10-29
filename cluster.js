var width = 960,
    height = 500,
    maxRadius = 12;

var n = 200, // total number of circles
    m = 14; // number of distinct clusters

var color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(d3.range(m));

// The largest node for each cluster.
var clusters = new Array(m);

/*
var nodes = d3.range(n).map(function() {
  var i = Math.floor(Math.random() * m),
      r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius,
      d = {cluster: i, radius: r};
  if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = d;
  return d;
});
*/
//	load and save data
var graph;
var nodes = [];

d3.json("node_link_model.json", function(err, g) {
	if (err) throw err;
	graph = g;
	for (node in graph.nodes) {
	    //i = Math.floor(Math.random() * m);
	    //r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius;
	    i = graph.nodes[node].group;
	    //r = graph.nodes[node].group;
	    r = 20;
        graph.nodes[node].cluster = i;
        graph.nodes[node].radius = r;
        nodes = graph.nodes;
        if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = graph.nodes[node];
    }
    console.log(nodes);
    update();
});


var forceCollide = d3.forceCollide()
    .radius(function(d) { return d.radius + 1.5; })
    .iterations(1);

var simulation = d3.forceSimulation()
    .force("center", d3.forceCenter())
    .force("collide", forceCollide)
    .force("gravity", d3.forceManyBody(30))
    .force("x", d3.forceX().strength(.7))
    .force("y", d3.forceY().strength(.7))
    .on("tick", tick);

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append('g')
    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

var circle = svg.selectAll("circle");

function update() {

    simulation.force("charge", d3.forceManyBody())
        .nodes(nodes)
        .force("cluster", forceCluster)
        .on("tick", tick);

    circle = circle.data(nodes)
        .enter().append("circle")
            .attr("r", function(d) { return d.radius; })
            .style("fill", function(d) { return color(d.cluster); });
}


//    TODO: Update for v4
//    .call(force.drag);

function tick() {
    console.log("tick")
  circle
      .attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

function forceCluster(alpha) {
    console.log("forceCluster")
    console.log(nodes.length)
  for (var i = 0, n = nodes.length, node, cluster, k = alpha * 1; i < n; ++i) {
    node = nodes[i];
    console.log(node);
    cluster = clusters[node.cluster];
    console.log("cluster" + cluster);
    node.vx -= (node.x - cluster.x) * k;
    node.vy -= (node.y - cluster.y) * k;
  }
}
