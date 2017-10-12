import requests
import json
import pprint

pp = pprint.PrettyPrinter(indent=4)

url = 'http://45.33.93.64//blazegraph/sparql'
head = {"Accept":"application/json", "Content-type": "application/sparql-query"}

unique_nodes = {}
nodes = []
links = []

unique_nodes["http://library.temple.edu/tul"] = {"uri": "http://library.temple.edu/tul", "label": "Temple University Libraries", "type": "http://library.temple.edu/model#inSystem"}

groups = {"http://library.temple.edu/model#Building": {"id": 1, "img": "http://localhost/web_rdf/assets/icons/building.png"},
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
          "http://library.temple.edu/model#inSystem": {"id": 12, "img": "http://localhost/web_rdf/assets/icons/tul.png"}
          }

# Buildings belonging to TUL
q = "select DISTINCT ?building where\
{\
?building <http://library.temple.edu/model#inSystem> <http://library.temple.edu/tul> .\
}\
"

res = requests.post(url, data=q,  headers=head)
raw = json.loads(res.text)
entities = raw["results"]["bindings"]

for binding in entities:
    building = binding["building"]["value"]
    unique_nodes[building] = {"uri": building, "label": building, "type": "http://library.temple.edu/model#inBuilding"}
    links.append({"source": building, "target": "http://library.temple.edu/tul", "value": 1})

    #Classes belonging to a building:

    q = "select DISTINCT ?s_type where\
    {\
    ?s <http://library.temple.edu/model#inBuilding> <" + building + "> . \
      ?s <http://www.w3.org/2000/01/rdf-schema#type> ?s_type\
    }"

    res = requests.post(url, data=q,  headers=head)
    raw = json.loads(res.text)
    entities = raw["results"]["bindings"]

    for binding in entities:
        s_type = binding["s_type"]["value"]
        #building = binding["building"]["value"]
        unique_nodes[s_type] = {"uri": s_type, "label": s_type, "type": s_type + "s"}
        #unique_nodes[building] = {"uri": building, "label": building, "type": "http://library.temple.edu/model#inBuilding"}
        links.append({"source": building, "target": s_type, "value": 1})

# Get the rest

q = "select ?s ?s_label ?s_type ?p ?o ?o_label ?o_type where \
{\
?s <http://www.w3.org/2000/01/rdf-schema#type> ?s_type .\
?s <http://www.w3.org/2000/01/rdf-schema#label> ?s_label .\
?s ?p ?o .\
?o <http://www.w3.org/2000/01/rdf-schema#type> ?o_type .\
?o <http://www.w3.org/2000/01/rdf-schema#label> ?o_label .\
VALUES ?p { <http://library.temple.edu/model#inSpace> <http://library.temple.edu/model#inGroup> <http://library.temple.edu/model#inBuilding>}\
}"

res = requests.post(url, data=q,  headers=head)
raw = json.loads(res.text)
entities = raw["results"]["bindings"]

#pp.pprint(entities)



for binding in entities:
    subject = binding["s"]["value"]
    subject_label = binding["s_label"]["value"]
    s_type = binding["s_type"]["value"]
    predicate = binding["p"]["value"]
    object = binding["o"]["value"]
    object_label = binding["o_label"]["value"]
    o_type = binding["o_type"]["value"]

    unique_nodes[subject] = {"uri": subject, "label": subject_label, "type": s_type}
    unique_nodes[object] = {"uri": object, "label": object_label, "type": o_type}
    if predicate != "http://library.temple.edu/model#inBuilding":
        links.append({"source": subject, "target": object, "value": 1})
    links.append({"source": subject, "target": s_type, "value": 1})

    #links.append({"source": subject, "target": predicate, "value": 1})
    #links.append({"source": predicate, "target": object, "value": 1})
    # unique_nodes[predicate] = {"uri": predicate, "label": predicate, "type": predicate}
#pp.pprint(nodes)
#pp.pprint(links)

for node in unique_nodes:
    nodes.append({"id": unique_nodes[node]["uri"], "group": groups[unique_nodes[node]["type"]]["id"], "img": groups[unique_nodes[node]["type"]]["img"]})

#pp.pprint(nodes)

model = {"nodes": nodes, "links": links}

#pp.pprint(model)

print("var data = ")
print(json.dumps(model, indent=4))

"""
{
    "nodes": [
        {
            "id": "groot",
            "group": 1
        }
    ],
    "links": [
        {
            "source": "groot",
            "target": "about",
            "value": 1
        }
    ]
}
"""