var groups = {"http://library.temple.edu/model#Building": {"id": 1, "img": "assets/icons/building.png", "r": 40},
          "http://library.temple.edu/model#Space": {"id": 2, "img": "assets/icons/space.png", "r": 20},
          "http://library.temple.edu/model#Group": {"id": 3, "img": "assets/icons/group.png", "r": 15},
          "http://library.temple.edu/model#Person": {"id": 4, "img": "assets/icons/person.png", "r": 8},
          "http://library.temple.edu/model#inSpace": {"id": 5, "img": "assets/icons/space.png", "r": 20},
          "http://library.temple.edu/model#inGroup": {"id": 6, "img": "assets/icons/group.png", "r": 15},
          "http://library.temple.edu/model#inBuilding": {"id": 7, "img": "assets/icons/building.png", "r": 40},
          "http://library.temple.edu/model#Buildings": {"id": 8, "img": "assets/icons/buildings.png", "r": 40},
          "http://library.temple.edu/model#Spaces": {"id": 9, "img": "assets/icons/spaces.png", "r": 20},
          "http://library.temple.edu/model#Groups": {"id": 10, "img": "assets/icons/groups.png", "r": 15},
          "http://library.temple.edu/model#Persons": {"id": 11, "img": "assets/icons/persons.png", "r": 8},
          "http://library.temple.edu/model#inSystem": {"id": 12, "img": "assets/icons/tul.png", "r": 50},
          "http://library.temple.edu/model#Service": {"id": 13, "img": "assets/icons/service.png", "r": 20},
          "http://library.temple.edu/model#Services": {"id": 14, "img": "assets/icons/services.png", "r": 20},
          "http://library.temple.edu/model#System": {"id": 15, "img": "assets/icons/system.png", "r": 50},
          "http://library.temple.edu/model#Systems": {"id": 16, "img": "assets/icons/systems.png", "r": 50}
          }
//http://localhost/web_rdf/
//
var getRelationships = function(uri) {
    query = `
        select  ?s ?p ?o ?s_type ?s_label ?o_type ?o_label
        where
        {
        { ?s ?p <${uri}> .
          ?s rdf:type ?s_type .
          ?s rdfs:label ?s_label . }
          UNION { <${uri}> ?p ?o .
          ?o rdf:type ?o_type .
          ?o rdfs:label ?o_label .  }
        }
        VALUES ?p { <http://library.temple.edu/model#inSpace> <http://library.temple.edu/model#inGroup> <http://library.temple.edu/model#inBuilding> <http://library.temple.edu/model#inSystem> }
        `;
    console.log(query);
    return query;
}

var width = 960,
    height = 500,
    maxRadius = 12;

var n = 200, // total number of circles
    m = groups.length; // number of distinct clusters

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
var unique_nodes = [];

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

//add encompassing group for the zoom
var g = svg.append("g")
    .attr("class", "everything");

//add zoom capabilities
var zoom_handler = d3.zoom()
    .on("zoom", zoom_actions);

zoom_handler(svg);

var circle = g.selectAll("circle");
var icon = g.selectAll("icon");
var handle = g.selectAll("handle");

function update() {
	// EXIT
	//icon.exit().remove();

    simulation.force("charge", d3.forceManyBody())
        .nodes(nodes)
        .force("cluster", forceCluster)
        .on("tick", tick);

    circle = circle.data(nodes)
        .enter().append("circle")
        .classed("inactive", true)
        .attr("r", function(d) { return d.radius; })
        .style("fill", function(d) { if (d.active === 1) { return color(d.cluster); } else { return "#CCCCCC"; }})
        .merge(circle)
            .attr("r", function(d) { return d.radius; })
            .style("fill", function(d) { if (d.active === 1) { return color(d.cluster); } else { return "#CCCCCC"; }});
	icon = icon.data(nodes)
	    .enter().append("svg:image")
            .attr("class", "icon")
            .attr("xlink:href", function(d) { return d.img; })
            .attr("width", function(d) { return d.radius; })
            .attr("height", function(d) { return d.radius; })
            .merge(icon)
                .attr("width", function(d) { return d.radius; })
                .attr("height", function(d) { return d.radius; });


    // TODO: Figure out how to create handle using "g" nodes
    handle = handle.data(nodes)
        .enter().append("circle")
        .attr("r", function(d) { return d.radius; })
        .style("fill", function(d) { return color(d.cluster); })
        .style("opacity", 0)
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        )
        .on("click", function(d) {
            for (key in nodes) {
                nodes[key].active = 0;
                nodes[key].group = 0;
                nodes[key].cluster = 0;
                nodes[key].radius = 2;
            }
            key = getNodeKey(d.id);
            if (key) {
                nodes[key].group = groups[nodes[key].type].id;
                nodes[key].active = 1;
                nodes[key].cluster = groups[nodes[key].type].id;
                nodes[key].radius = groups[nodes[key].type].r;
            }

            req = d3.request("http://45.33.93.64/blazegraph/sparql")
            .header("Accept", "application/json")
            .header("Content-Type", "application/sparql-query")
            .response(function(xhr) {
                return xhr.responseText;
            })
            .post(getRelationships(d.id), function(data) {
                //console.log(data);
                sparql_response = JSON.parse(data);
                results = sparql_response.results.bindings;
                new_nodes = [];
                new_links = [];
                //console.log(results);
                for (k in results) {
                    new_node = results[k];
                    if (new_node.s) {
                        id = new_node.s.value;
                        label = new_node.s_label.value;
                        type = new_node.s_type.value;
                    } else {
                        id = new_node.o.value;
                        label = new_node.o_label.value;
                        type = new_node.o_type.value
                    }
                    //console.log(id);
                    //console.log(label);
                    //console.log(type);

                    i = groups[type].id;
                    r = groups[type].r;

                    new_nodes[id] = {
                        "id": id,
                        "group": groups[type].id,
                        "type": type,
                        "img": groups[type].img,
                        "label": label,
                        "radius": r,
                        "cluster": i,
                        "active": 1
                    };
                    //updated_node = nodes.filter(function(d) { return d.id == id });
                    //nodes.splice(updated_node, 1)

                    key = getNodeKey(id);
                    if (key) {
                        nodes[key] = new_nodes[id];
                    }

                    //console.log(new_nodes[id]);
                    if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = new_nodes[id];
                }
                for (new_node in new_nodes) {
                    if (!unique_nodes[new_nodes[new_node].id]) {
                        unique_nodes[new_nodes[new_node].id] = new_nodes[new_node];
                        nodes.push(new_nodes[new_node]);
                   }
                }
                update();
            });
        })
        .merge(handle);
    handle.append("title")
            .text(function(d) { return d.id; });

    console.log(nodes);
    console.log(clusters);
}

function tick() {
    circle
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    handle
        .attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    icon
        .attr("x", function(d) { return (d.x - (d.radius/2)); })
        .attr("y", function(d) { return (d.y - (d.radius/2)); });
}

function forceCluster(alpha) {

  for (var i = 0, n = nodes.length, node, cluster, k = alpha * 1; i < n; ++i) {
    node = nodes[i];
    if (node.id == "http://library.temple.edu/tul") {
        //console.log(node);
    }
    cluster = clusters[node.cluster];
    node.vx -= (node.x - cluster.x) * k;
    node.vy -= (node.y - cluster.y) * k;
  }
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

graph = {
    "nodes": [
        {
            "id": "http://library.temple.edu/tul",
            "group": 0,
            "img": "assets/icons/tul.png",
            "type": "http://library.temple.edu/model#System",
            "label": "Temple University Libraries",
            "entity": "node",
            "radius": 30,
            "cluster": 0,
            "active": 0
        }
    ],
    "links": []
}

function getNodeKey(id) {
    for (key in nodes) {
        if (nodes[key].id == id) {
            return key;
        }
    }
    return null;
}
for (node in graph.nodes) {
    //i = Math.floor(Math.random() * m);
    //r = Math.sqrt((i + 1) / m * -Math.log(Math.random())) * maxRadius;
    i = graph.nodes[node].group;
    //r = graph.nodes[node].group;
    r = graph.nodes[node].r;
    //graph.nodes[node].cluster = i;
    //graph.nodes[node].radius = r;
    nodes = graph.nodes;
    unique_nodes[nodes[node].id] = nodes[node];
    if (!clusters[i] || (r > clusters[i].radius)) clusters[i] = nodes[node];
    clusters[15] = nodes[node];
    //clusters[0] = {"active": 0, "radius": 20, "cluster": 0, "index": 0};
}

update();
