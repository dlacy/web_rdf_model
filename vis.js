var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var simulation = d3.forceSimulation()
    .force("charge", d3.forceManyBody())
    .force("link", d3.forceLink().id(function(d) { return d.id; }).distance(20).strength(
    function(d){
        console.log(d);
        console.log(hard_link(d.target.id));
        console.log(d.id);
        if (hard_link(d.target.id)) {
            return .5;
        } else {
            return 0;
        }
    }
    ))
    .force("x", d3.forceX(width / 2))
    .force("y", d3.forceY(height / 2))
    .on("tick", ticked);

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node"),
    image = svg.selectAll(".icon");


function hard_link(link) {
    if (link == "http://library.temple.edu/model#Space" || link == "http://library.temple.edu/model#Group" || link == "http://library.temple.edu/model#Person") {
        return true;
    }
    return false;
}

function drawGraph() {

    simulation.nodes(data.nodes);
    simulation.force("link").links(data.links);

    link = link
    .data(data.links)
    .enter().append("line")
        .attr("class", "link")
        .style("stroke-dasharray", function(d) {
            if (hard_link(d.target.id)) {
                return ("0, 0");
            } else {
                return ("3, 3");
            }
        })
        .style("stroke-width", function(d) {
            if (hard_link(d.target.id)) {
                return 1;
            } else {
                return .25;
            }
        })
        ;

    image = image
    .data(data.nodes)
    .enter().append("svg:image")
        .attr("class", "icon")
        .attr("xlink:href", function(d) { return d.img; })
        .attr("width", "20")
        .attr("height", "20")
    .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));
    image.append("title")
        .text(function(d) { return d.id; });

    /*
    node = node
    .data(data.nodes)
    .enter().append("circle")
        .attr("class", "node")
        .attr("r", 2)
        .style("fill", function(d) { return d.id; })
    .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

    node.append("title")
        .text(function(d) { return d.id; });
    */
}


drawGraph();


function ticked() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });
  /*
  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
  */
  image.attr("x", function(d) { return d.x - 10; })
      .attr("y", function(d) { return d.y - 10; });
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