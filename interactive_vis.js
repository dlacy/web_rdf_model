//
var const_prefixes = { bd:"http://www.bigdata.com/rdf#", bds:"http://www.bigdata.com/rdf/search#", dc:"http://purl.org/dc/elements/1.1/", fn:"http://www.w3.org/2005/xpath-functions#", foaf:"http://xmlns.com/foaf/0.1/", hint:"http://www.bigdata.com/queryHints#", owl:"http://www.w3.org/2002/07/owl#", rdf:"http://www.w3.org/1999/02/22-rdf-syntax-ns#", rdfs:"http://www.w3.org/2000/01/rdf-schema#", rooms:"http://vocab.deri.ie/rooms#", sesame:"http://www.openrdf.org/schema/sesame#", tul:"http://library.temple.edu/model#", wgs84:"http://www.w3.org/2003/01/geo/wgs84_pos#", xsd:"http://www.w3.org/2001/XMLSchema#" };

function prefixifyURI(uri, prefixes) {
    for (key in prefixes) {
        if (uri.includes(prefixes[key])) {
            return key + ":" + uri.substring(prefixes[key].length);
        }
    }
    return uri;
}
// Unique nodes
var unique_nodes = [];
var unique_links = [];

//
var groups = {"http://library.temple.edu/model#Building": {"id": 1, "img": "http://localhost/web_rdf/assets/icons/building.png"},
          "http://library.temple.edu/model#Space": {"id": 2, "img": "http://localhost/web_rdf/assets/icons/space.png"},
          "http://library.temple.edu/model#Group": {"id": 3, "img": "http://localhost/web_rdf/assets/icons/group.png"},
          "http://library.temple.edu/model#Person": {"id": 4, "img": "http://localhost/web_rdf/assets/icons/person.png"},
          "http://library.temple.edu/model#inSpace": {"id": 5, "img": "http://localhost/web_rdf/assets/icons/space.png"},
          "http://library.temple.edu/model#inGroup": {"id": 6, "img": "http://localhost/web_rdf/assets/icons/group.png"},
          "http://library.temple.edu/model#inBuilding": {"id": 7, "img": "http://localhost/web_rdf/assets/icons/building.png"},
          "http://library.temple.edu/model#Buildings": {"id": 8, "img": "http://localhost/web_rdf/assets/icons/buildings.png"},
          "http://library.temple.edu/model#Spaces": {"id": 9, "img": "http://localhost/web_rdf/assets/icons/spaces.png"},
          "http://library.temple.edu/model#Groups": {"id": 10, "img": "http://localhost/web_rdf/assets/icons/groups.png"},
          "http://library.temple.edu/model#Persons": {"id": 11, "img": "http://localhost/web_rdf/assets/icons/persons.png"},
          "http://library.temple.edu/model#inSystem": {"id": 12, "img": "http://localhost/web_rdf/assets/icons/tul.png"},
          "http://library.temple.edu/model#Service": {"id": 13, "img": "http://localhost/web_rdf/assets/icons/service.png"},
          "http://library.temple.edu/model#Services": {"id": 14, "img": "http://localhost/web_rdf/assets/icons/services.png"},
          "http://library.temple.edu/model#System": {"id": 15, "img": "http://localhost/web_rdf/assets/icons/system.png"},
          "http://library.temple.edu/model#Systems": {"id": 16, "img": "http://localhost/web_rdf/assets/icons/systems.png"}
          }

var type_relationships = [];
type_relationships["http://library.temple.edu/model#Building"] = "http://library.temple.edu/model#inBuilding";
type_relationships["http://library.temple.edu/model#Space"] = "http://library.temple.edu/model#inSpace";

//	graph data store
var graph;

//	state variable for current link set
var firstLinks = false;

// rdf parser
var parser = N3.Parser();
var N3Util = N3.Util;

// sparql query
var getstmts = function(subject) {
                return `
                    CONSTRUCT { <${subject}> ?p ?o }
                    where
                    {
                    <${subject}> ?p ?o
                    }
                    `
                }

var tul_query = `
                SELECT ?s_type (COUNT(DISTINCT ?s) AS ?count )
                WHERE
                {
                ?s ?p <http://library.temple.edu/tul> .
                ?s rdf:type ?s_type .
                }
                GROUP BY ?s_type
                `
var children_query = function(o) {
    query = `
            SELECT DISTINCT ?p ?type
            WHERE
            {
            ?s ?p <${o}>  .
            ?s rdf:type ?type .
            }
            `
    console.log(query);
    return query;
}

var parents_query = function(s) {
    query =  `
            SELECT DISTINCT ?p ?type
            WHERE
            {
            <${s}> ?p ?o .
            ?o rdf:type ?type .
            }
            VALUES ?type { <http://library.temple.edu/model#Space> <http://library.temple.edu/model#Group> <http://library.temple.edu/model#Building> <http://library.temple.edu/model#Person> <http://library.temple.edu/model#Service>}
            `
    console.log(query);
    return query;
}

var subject_query = function(p, o, type) {
    query = `
            select ?s ?label
            where {
              ?s ?p <${o}> .
              ?s rdf:type <${type}> .
              ?s rdfs:label ?label .
            }
            `
    console.log(query);
    return query;
}

var object_query = function(p, s, type) {
    query = `
            select ?s ?label
            where {
              <${s}> ?p ?s .
              ?s rdf:type <${type}> .
              ?s rdfs:label ?label .
            }
            `
    console.log(query);
    return query;
}

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
    icon = g.append("g").selectAll(".icon"),
    circ = g.append("g").selectAll(".circ");

//
var selectedNode;

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

d3.select("#graph-btn").on("click", function() {
	console.log(graph);
	console.log(unique_nodes);
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
	icon = icon.data(graph.nodes);
    circ = circ.data(graph.nodes);

	// EXIT
	icon.exit().remove();
    circ.exit().remove();

    simulation.force("charge", d3.forceManyBody())
        .nodes(graph.nodes)
        .on("tick", ticked);

  	simulation.force("link")
  		.links(firstLinks ? graph.links.filter(function(d) { return d.link == "hard" }) : graph.links);

	// ENTER
  	// Create new links as needed.

	link = link.enter().append("line")
		.attr("class", "link")
		.merge(link);

    // force style update for cases there lines are reused in different links
    d3.selectAll(".link").style("stroke-dasharray", function(d) {
            if (d.link === "hard") {
                return ("0, 0");
            } else {
                return ("3, 3");
            }
        })
        .style("stroke-width", function(d) {
            if (d.link === "hard") {
                return 1;
            } else {
                return .1;
            }
        })


	// Icon ENTER
	icon = icon.enter().append("svg:image")
		.attr("class", "icon")
		.attr("xlink:href", function(d) { return d.img; })
		.attr("width", "20")
        .attr("height", "20")
		.merge(icon);
    icon.append("title")
        .text(function(d) { return d.id; });

    // Circ ENTER
    circ = circ.enter().append("g").append("circle")
		.attr("class", "circ")
		.attr("r", "10")
        .on("mouseover", function(d) {

            /*
            d3.select(this)
                .transition()
                    .attr("r", "15")
                    .attr("class", "circ hover");
            */
            d3.select(this.parentNode).append("text")
                .attr("class", "label")
                .text(d.id)
                .attr("x", d.x + 5)
                .attr("y", d.y - 15);

        })
        .on("click", function(d) {

            d3.selectAll(".textbox").remove();

            d3.selectAll(".info")
                .append("foreignObject")
                    .attr("class", "textbox")
                    .attr("width", 480)
                    .attr("height", 500)
                .append("xhtml:body")
                    .style("font", "14px 'Helvetica Neue'")
                    .html(d.label + "<br/>" + d.id);

            req = d3.request("http://45.33.93.64/blazegraph/sparql")
                .header("Accept", "text/turtle")
                .header("Content-Type", "application/sparql-query")
                .response(function(xhr) {
                    return xhr.responseText;
                })
                .post(getstmts(d.id), function(data) {
                    parser.parse(data, function (error, triple, prefixes) {
                       if (triple) {
                        d3.selectAll(".info")
                            .append("foreignObject")
                                .attr("class", "textbox")
                                .attr("width", 480)
                                .attr("height", 500)
                            .append("xhtml:body")
                                .style("font", "14px 'Helvetica Neue'")
                                .html(prefixifyURI(triple.predicate, const_prefixes) + " :: " + prefixifyURI(triple.object, const_prefixes));

                       } else {
                         //console.log(prefixes);
                       }
                     });
                });

            if (d3.select(this).classed("expanded") === false) {



                if (d.entity == "node") {
                    console.log(d);
                    getContainers(d, "children");
                    getContainers(d, "parents");
                } else {
                    console.log(d);
                    //console.log(subject_query(d.p, d.o, d.type));
                    //getNodes(d, "children");
                    getNodes(d, "subject");
                    getNodes(d, "object");
                }
                d3.select(this).classed("expanded", true);
            }
        })
        .on("mouseout", function() {

            d3.selectAll(".circ").classed("hover", false)
                .transition()
                    .attr("r", "10");
            d3.select(this.parentNode).selectAll(".label").remove();
        })
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        )
		.merge(circ);

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

    circ.attr("cx", function(d) { return d.x; })
        .attr("cy", function(d) { return d.y; });

    circ.selectAll(".label")
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; });

    icon.attr("x", function(d) { return d.x - 10; })
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

function getContainers(d, direction) {
    if (direction == "children") {
        query = children_query(d.id);
    } else {
        query = parents_query(d.id);
    }
    console.log(d);
    req2 = d3.request("http://45.33.93.64/blazegraph/sparql")
        .header("Accept", "application/json")
        .header("Content-Type", "application/sparql-query")
        .response(function(xhr) {
            return xhr.responseText;
        })
        .post(query, function(data) {
            sparql_response = JSON.parse(data);
            results = sparql_response.results.bindings;
            new_nodes = [];
            new_links = [];
            console.log(results);
            for (k in results) {
                //console.log(results[k]);
                s_type = results[k].type.value;
                //count = results[k].count.value;
                //console.log(s_type);
                //console.log(count);
                id = d.id + "::" + s_type;

                new_nodes[id] = {
                    "id": id,
                    "group": 1,
                    "type": s_type,
                    "img": groups[s_type + "s"].img,
                    "label": id,
                    "o": d.id,
                    "entity": "container",
                    "p": "http://library.temple.edu/model#inSystem"
                };
                new_links[id] = {
                    "source": d.id,
                    "target": id,
                    "value": 1,
                    "link": "hard"
                };
            }
            for (new_node in new_nodes) {
                if (!unique_nodes[new_nodes[new_node].id]) {
                    unique_nodes[new_nodes[new_node].id] = new_nodes[new_node];
                    graph.nodes.push(new_nodes[new_node]);

                }
            }
            for (new_link in new_links) {
                graph.links.push(new_links[new_link]);
            }
            //console.log(graph);
            update();
        });
}

function getNodes(d, direction) {
    if (direction == "object") {
        query = subject_query(d.p, d.o, d.type);
    } else {
        query = object_query(d.p, d.o, d.type);
    }
    req3 = d3.request("http://45.33.93.64/blazegraph/sparql")
        .header("Accept", "application/json")
        .header("Content-Type", "application/sparql-query")
        .response(function(xhr) {
            return xhr.responseText;
        })
        .post(query, function(data) {
            //console.log(data);
            sparql_response = JSON.parse(data);
            results = sparql_response.results.bindings;
            console.log(results);
            new_nodes = [];
            new_links = [];
            for (k in results) {
                s = results[k].s.value;
                s_label = results[k].label.value;
                //console.log(s);
                //console.log(s_label);
                id = d.id + "::" + s;

                new_nodes[s] = {
                    "id": s,
                    "group": 1,
                    "type": d.type,
                    "img": groups[d.type].img,
                    "count": 0,
                    "label": s_label,
                    "o": s,
                    "entity": "node",
                    "p": ""
                };
                new_links[id] = {
                    "source": d.id,
                    "target": s,
                    "value": 1,
                    "link": "hard"
                };
            }

            for (new_node in new_nodes) {
                if (!unique_nodes[new_nodes[new_node].id]) {
                    unique_nodes[new_nodes[new_node].id] = new_nodes[new_node];
                    graph.nodes.push(new_nodes[new_node]);

                }
            }
            for (new_link in new_links) {
                graph.links.push(new_links[new_link]);
            }

            //console.log(graph);
            update();
        });
}

//	load and save data
d3.json("node_link_model.json", function(err, g) {
	if (err) throw err;

	graph = g;

    graph = {
    "nodes": [
        {
            "id": "http://library.temple.edu/tul",
            "group": 12,
            "img": "http://localhost/web_rdf/assets/icons/tul.png",
            "type": "http://library.temple.edu/model#System",
            "label": "Temple University Libraries",
            "entity": "node"
        }
    ],
    "links": []
    }

	update();

});
