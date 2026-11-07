import {useEffect, useRef, useState} from "react";
import cytoscape from "cytoscape";
import {Button, ButtonGroup} from "@blueprintjs/core";
import CytoscapeComponent from "react-cytoscapejs";

export default function GraphView ({ nodes = [], edges = [], deps = [], hasBeenNormalized })  {
    // 1. Define your graph data (Elements)
    let elements = null;
    console.log(deps);
    console.log("bäs")

    if (nodes.length < 50) {
        let cy_nodes = nodes.map(node => ({
            data: {
                id: "n" + String(node.id),
                label: node.labels.join("&"),
                type: node.labels[0],
                classes: "node"
            }
        }));
        let cy_edge_nodes = edges.map(edge => ({
            data: {
                id: "re" + String(edge.id),
                label: edge.labels[0],
                type: edge.labels[0],

            },
            classes: "reified_edge"
        }));
        let cy_edges1 = edges.map(edge => ({
            data: {
                id: "eSRC" + String(edge.id),
                source: "n" + String(edge.src),
                target: "re" + String(edge.id),
                label: edge.labels[0],
                type: "SRC" + edge.labels[0],
            },
            classes: "src"
        }));
        let cy_edges2 = edges.map(edge => ({
            data: {
                id: "eTGT" + String(edge.id),
                source: "re" + String(edge.id),
                target: "n" + String(edge.tgt),
                label: edge.labels[0],
                type: "TGT" + edge.labels[0],
            },
            classes: "tgt"
        }));

        elements = [...cy_nodes, ...cy_edge_nodes, ...cy_edges1, ...cy_edges2];



        nodes.forEach((node) => {
            Object.entries(node.properties).forEach(([key, value]) => {
                elements.push({
                    data: {
                        id: `n${String(node.id)}_${key}`,
                        label: `${key}: ${value}`,
                        parent: "n" + String(node.id) // This nests it inside the parent
                    },
                    classes: 'property'
                });
            });
        });

        edges.forEach((edge) => {
            let entry = Object.entries(edge.properties).forEach(([key, value]) => {
                elements.push({
                    data: {
                        id: `${"re" + String(edge.id)}_${key}`,
                        label: `${key}: ${String(value)}`,
                        parent: "re" + String(edge.id) // This nests it inside the parent
                    },
                    classes: 'property'
                });
            });
            console.log(entry);
            return entry;
        });

        deps.forEach((edge) => {
            elements.push({
                data: {
                    id: "DEP" + String(edge[0])+ String(edge[1]),
                    source: String(edge[0]),
                    target: String(edge[1]),
                    type: "DEP",
                },
                classes: "dep"
            });
        });



        console.log(elements);




    } else {
        const cy_nodes = nodes.map(node => ({
            data: {
                id: "n"+String(node.id),
                label: node.labels.join("&"), // Use the first label as the display text
                type: node.labels[0]   // Useful for styling different node types later
            }
        }));
        const cy_edges = edges.map(edge => ({
            data: {
                id: "e"+String(edge.id), // Ensure edge IDs are unique strings
                source: "n"+String(edge.src), // Cytoscape IDs must be strings
                target: "n"+String(edge.tgt),
                label: edge.labels[0] // There is always only one type!
            }
        }));

        elements = [...cy_nodes, ...cy_edges];
    }

    const structuralElements = elements.filter(el => el.classes !== 'dep');
    const depElements = elements.filter(el => el.classes === 'dep');

    const cyRef = useRef<cytoscape.Core | null>(null);
    const automoveRuleRef = useRef(null);

    const [showGraph, setShowGraph] = useState(1);
    const [showDeps, setShowDeps] = useState(true);

    useEffect(() => {
        const cy = cyRef.current;
        if (!cy) return;

        cy.elements().remove();
        cy.add(structuralElements);

        if (nodes.length < 50) {
            // 1. Define the Automove Rule FIRST
            // This ensures it catches the movement from the layout


            const layout = cy.layout({
                name: 'fcose',
                idealEdgeLength: 150,      // Much longer edges
                nodeRepulsion: 15000,       // Stronger pushing force
                edgeElasticity: 0.1,       // Softer edges that allow more space
                gravity: 0.01,
                gravityRange: 4.0,
                randomize: true,
                animate: true,
                allowGraphExpansion: true,   // Allow the viewport to grow
                nodeDimensionsIncludeLabels: true, // Accounts for the text/labels
                uniformNodeDimensions: false,      // Important because your nodes vary in size
                numIter: 5000,              // More iterations for a more "relaxed" final state
                stop: () => {
                    // 3. THE MAGIC STEP: Add the dependencies only AFTER the layout is finished
                    // Since the layout is already 'stopped', these edges won't pull nodes around.
                    if (showDeps) {
                        cy.add(depElements);
                    }

                    // 4. Run your internal property grid layout
                    cy.nodes(':parent').forEach(parent => {
                        const children = parent.children();
                        if (children.length > 0) {
                            children.layout({
                                name: 'grid',
                                cols: 1,
                                fit: false,
                                boundingBox: {
                                    x1: parent.position('x') - 75,
                                    x2: parent.position('x') + 75,
                                    y1: parent.position('y') - (children.length * 10) + 20,
                                    y2: parent.position('y') + (children.length * 10) + 20
                                }
                            }).run();

                            automoveRuleRef.current = cy.automove({
                                nodesMatching: '.reified_edge',
                                reposition: 'mean',
// This tells each reified edge node to stay in the middle
                                // of its connected Course/Lecturer nodes
                                when: "matching"
                            });
                            //     automoveRuleRef.current.apply();
                        }
                    });
                }
            });

            layout.run();

            cy.nodes(".property").ungrabify();
            cy.nodes(".reified_edge").ungrabify();


        } else {
            cy.layout({
                name: 'circle',
                animate: false,
                fit: true
            }).run();
        }

        console.log(elements)
        // Initialize automove
        // This example makes nodes with class 'follower' move with 'leader'

        return () => {
            if (automoveRuleRef.current) automoveRuleRef.current.destroy();
        };
    }, [elements, showGraph, depElements]);

    // 2. Define visual styles
    const stylesheet = [
        {
            selector: 'node',
            style: {
                'label': 'data(label)',
                'background-color': '#FBB360',
                'border-width': 1,
                'border-color': '#935610',
                'shape': 'round-rectangle',
                'width': 60,
            }
        },
        {
            selector: '.property',
            style: {
                'shape': 'rectangle',
                'height': 12,          // Height of your "list item"
                'width': 80,
                'background-color': '#ffffff',
                'background-opacity': 0,
                'border-width': 0,
                'text-valign': 'center',
                'font-size': '10px',
                'label': 'data(label)',
            },

        },
        {
            selector: '.node',
            style: {
                'text-valign': 'top',
                'background-color': '#FBB360',
                'border-width': 1,
                'border-color': '#935610',
                'shape': 'round-rectangle',
                'padding': 50,
                'width': 60,
                'height': 12,
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#738091',
                'target-arrow-color': '#738091',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
            }
        },
        {
            selector: '.src',
            style: {
                'target-arrow-shape': 'none',
            }
        },
        {
            selector: '.tgt',
            style: {
                'target-arrow-scale': "4",
            }
        },

        {
            selector: ':parent',
            style: {
                'background-color': '#FBB360',
                'border-width': 1,
                'border-color': '#935610',
                'corner-radius': 15,
                'shape': 'round-rectangle',
                'width': 60,
            }
        },
        {
            selector: '.reified_edge',
            style: {
                'border-color': '#738091',
                'background-color': '#ffffff',
                'border-width': 1,
                'width': 1,
                'height': 1,
            }
        },
        {
            selector: '.dep',
            style: {
                'events': 'no', // Prevents the edge from triggering hover/layout events
                'width': 1,
                'line-style': 'dashed',
                'line-color': '#000000',
                'target-arrow-color': '#000000',
                'target-arrow-shape': 'triangle',
                'curve-style': 'unbundled-bezier',
                'control-point-step-size': 20, // Higher number = deeper bend
                'control-point-distance': 50, // This forces the "arc"
            }
        },
    ];


    return (
        <div>
            <ButtonGroup variant={"outlined"}>
                <Button icon="refresh" onClick={() => {
                    setShowGraph(showGraph+1);
                }
                }>Redraw</Button>
                <Button icon={"zoom-to-fit"} onClick={() => {
                    cyRef.current?.fit();
                }}>Zoom to fit graph</Button>
                <Button icon={showDeps ? "eye-open" : "eye-off"} onClick={() => setShowDeps(!showDeps)}>{showDeps ? "Hide dependencies" : "Show dependencies"}</Button>
            </ButtonGroup>
            { showGraph ? (
                <CytoscapeComponent
                    key={`${nodes.length}-${edges.length}-${deps.length}-${hasBeenNormalized}`}
                    elements={elements}
                    style={{position: "absolute", width: 'calc(100% - 520px)', left: '500', bottom: '0', height: '100%' }}
                    stylesheet={stylesheet}
                    cy={(cy) => { cyRef.current = cy;}}
                    layout={{ name: 'null' }}
                    headless={false}
                /> ) : (<div/>)}
        </div>
    );
};