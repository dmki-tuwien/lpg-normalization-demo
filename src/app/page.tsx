'use client'
import {
    Button, Card, H3, H4, H5, Icon, Label, Link, MenuItem, MenuDivider, Menu, SegmentedControl, Text,
    TextArea, Tooltip, Dialog, DialogBody, DialogFooter, ButtonGroup
} from "@blueprintjs/core";
import {Select} from "@blueprintjs/select";
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import automove from 'cytoscape-automove';
import avsdf from 'cytoscape-avsdf';
import fcose from 'cytoscape-fcose';
import { BarChart } from '@mui/x-charts/BarChart';
import NavBar from "@/app/components/navbar";

import {useEffect, useRef, useState} from "react";
import {STRINGS} from "@/app/strings";
import LogDialog from "@/app/components/logDialog";

cytoscape.use(cola);
cytoscape.use(avsdf);
cytoscape.use(automove)
cytoscape.use(fcose)

interface Dependency {
    name: string;
    category: string;
    metrics: {[key: string]: number};
}

function prettyDep(text: string): string {
    const arrowMap: Record<string, string> = {
        '->': '→',
        '<-': '←',
        '=>': ' ⇒ ',
        '-': '-',
        '::': ' :: ',
        ':': ' : ',
        '&': ' & ',
        ',': ' , '
    };

    return text.replace(/->|<-|=>|-|::|:|&|,/g, (match) => arrowMap[match]);
}

export default function Home() {
    const [database, setDatabase] = useState("neo4j");
    const [method, setMethod] = useState("graph-native");


    const [dependencies, setDependencies] = useState([]);
    const [minCov, setMinCov] = useState([]);

    const [perGraphMetricsAfter, setPerGraphMetricsAfter] = useState<{[key: string]: number}>({});
    const [perGraphMetricsBefore, setPerGraphMetricsBefore] = useState<{[key: string]: number}>({});
    const [perGraphMetricsGraphData, setPerGraphMetricsGraphData] = useState([]);
    const [perDepMetricsAfter, setPerDepMetricsAfter] = useState<Array<Dependency>>([]);
    const [perDepMetricsBefore, setPerDepMetricsBefore] = useState<Array<Dependency>>([]);
    const [selectedPerDepMetric, setSelectedPerDepMetric] = useState<Dependency>({name: "", category: "", metrics: {}});
   // const [s]

    const [showLogs, setShowLogs] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const [availableScenarios, setAvailableScenarios] = useState([]);
    const [scenario, setScenario] = useState("");
    const [isLoadingScenario, setIsLoadingScenario] = useState(false);
    const [loadedScenario, setLoadedScenario] = useState(false);

    const [isNormalizing, setIsNormalizing] = useState(false);
    const [hasBeenNormalized, setHasBeenNormalized] = useState(false);
    const [normalizationResult, setNormalizationResult] = useState([[],[]]);

    const [beforeVisualization, setBeforeVisualization] = useState(<div/>);
    const [afterVisualization, setAfterVisualization] = useState(<div/>);

    const [dependencyDialogOpen, setDependencyDialogOpen] = useState<boolean>(false);

    const [apiEndpoint, setApiEndpoint] = useState<string>("");

    useEffect(() => {
        setApiEndpoint(`${window.location.origin}${window.location.port === 3000 ? "" : "/api"}`)
        setApiEndpoint(`http://127.0.0.1:8001`)

        const WS_PROTOCOL = window.location.protocol === "https:" ? "wss:" : "ws:";
        const LOG_WS_URL = `${WS_PROTOCOL}//${window.location.hostname}:8001/ws/log`;
        const logSocket = new WebSocket(LOG_WS_URL);

        logSocket.onopen = () => {
           // setStatus("open");
        };

        logSocket.onmessage = (event: MessageEvent<string>) => {
            setLogs((prev) => [...prev, event.data]);
        };

        logSocket.onerror = () => {
         //   setStatus("error");
        };

        logSocket.onclose = () => {
         //   setStatus("closed");
        };

        // Cleanup: close connection when the component unmounts
        return () => {
            logSocket.close();
        };

    }, []);



    useEffect(() => {
        const fetchScenarios = async () => {
            try {
                const response = await fetch(`${apiEndpoint}/${database}/scenarios`);
                if (!response.ok) throw new Error("Failed to fetch");

                const data = await response.json();
                const options = data.map((item: any) => ({
                    label: item.name || item,
                    value: item.id || item,
                    category: item.category || item
                }));

                setAvailableScenarios(options);
                setScenario(options[0]["value"]);

            } catch (error) {
                console.error("Error fetching scenarios:", error);
                setAvailableScenarios([]);
            } finally {
            }
        };

        fetchScenarios();
    }, [database, apiEndpoint]);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const response = await fetch(`${apiEndpoint}/${database}/scenarios/${scenario}/dependencies`);
                if (!response.ok) throw new Error("Failed to fetch");

                const data = await response.json();

                setDependencies(data)

            } catch (error) {
                console.error("Error fetching scenarios:", error);
            } finally {
            }
        };

        if (!hasBeenNormalized && scenario !== "") {fetchDependencies()}

        const fetchMinimalCover = async () => {
            try {
                const response = await fetch(`${apiEndpoint}/${database}/scenarios/${scenario}/minimal_cover`);
                if (!response.ok) throw new Error("Failed to fetch");

                const data = await response.json();

                setMinCov(data)

            } catch (error) {
                console.error("Error fetching scenarios:", error);
            } finally {
            }
        };

        if (!hasBeenNormalized && scenario !== "") {fetchMinimalCover()}
    }, [database, scenario, hasBeenNormalized, loadedScenario]);

    useEffect(() => {
        const fetchPerGraphMetrics = async () => {
            try {
                const response = await fetch(`${apiEndpoint}/${database}/statistics/graph`);
                if (!response.ok) throw new Error("Failed to fetch");

                const data = await response.json();

                if (!hasBeenNormalized) {
                    setPerGraphMetricsBefore(data)
                    const nodes_res = await fetch(`${apiEndpoint}/${database}/visualize/nodes`);
                    const nodes = await nodes_res.json();
                    const edges_res = await fetch(`${apiEndpoint}/${database}/visualize/edges`);
                    const edges = await edges_res.json();
                    const deps_res = await fetch(`${apiEndpoint}/${database}/visualize/dependencies`,  { method: "POST", headers: {
                            "Content-Type": "application/json",
                        }, body: JSON.stringify(minCov) });
                    const deps = await deps_res.json();

                    if (!response.ok) throw new Error("Failed to fetch");

                    setBeforeVisualization(<GraphView nodes={nodes} edges={edges} deps={deps}></GraphView>)

                }
                if (hasBeenNormalized) {setPerGraphMetricsAfter(data)}


            } catch (error) {
                console.error("Error fetching scenarios:", error);
            } finally {
            }
        };

        if (loadedScenario && scenario !== "") {fetchPerGraphMetrics()}

        const fetchPerDepMetrics = async () => {
            try {
                if (!hasBeenNormalized) {
                    const response = await fetch(`${apiEndpoint}/${database}/statistics/dependencies`,  { method: "POST", headers: {
                            "Content-Type": "application/json",
                        }, body: JSON.stringify(minCov) });
                    if (!response.ok) throw new Error("Failed to fetch");

                    const data = await response.json();

                    const mappedData = Object.entries(data).map(([name, metrics]) => ({
                        name,
                        category: "Before Normalization",
                        metrics,
                    }))

                    setPerDepMetricsBefore(mappedData)

                    setSelectedPerDepMetric(mappedData[0])
                }
                if (hasBeenNormalized) {
                    const response = await fetch(`${apiEndpoint}/${database}/statistics/dependencies`,  { method: "POST", headers: {
                            "Content-Type": "application/json",
                        }, body: JSON.stringify(normalizationResult[0]) });
                    if (!response.ok) throw new Error("Failed to fetch");

                    const data = await response.json();
                    const mappedData = Object.entries(data).map(([name, metrics]) => ({
                        name,
                        category: "After Normalization",
                        metrics,
                    }))

                    setPerDepMetricsAfter(mappedData)
                }


            } catch (error) {
                console.error("Error fetching scenarios:", error);
            } finally {
            }
        };

        if (loadedScenario && scenario !== "") {fetchPerDepMetrics()}

    }, [database, scenario, hasBeenNormalized, loadedScenario, dependencies]);

    useEffect(() => {
        const keys = Object.keys(perGraphMetricsBefore);

        let dataset = 0
        if (hasBeenNormalized) {
            dataset = keys.map(key => ({
                label: key,
                before: (perGraphMetricsBefore?.[key]) ?? 0,
                after: (perGraphMetricsAfter?.[key]) ?? 0
            }));
        }
        else {
            dataset = keys.map(key => ({
                label: key,
                before: (perGraphMetricsBefore?.[key]) ?? 0,
            }));
        }
        setPerGraphMetricsGraphData(dataset);
    }, [perGraphMetricsBefore, perGraphMetricsAfter])


    const load_scenario = async () => {
        try {
            setIsLoadingScenario(true);
            const response = await fetch(`${apiEndpoint}/${database}/scenarios/load?id=${scenario}`,  { method: "POST" });
            if (!response.ok) throw new Error("Failed to fetch");

            setIsLoadingScenario(false);



            setLoadedScenario(true);
        } catch (error) {
            console.error("Error fetching scenarios:", error);
            setAvailableScenarios([]);
        } finally {
        }
    };

    const normalize = async () => {
        setIsNormalizing(true);
        const response = await fetch(`${apiEndpoint}/${database}/normalize?method=${method}`, { method: "POST", headers: {
                "Content-Type": "application/json",
            }, body: JSON.stringify(minCov) })
        const data = await response.json();

        const nodes_res = await fetch(`${apiEndpoint}/${database}/visualize/nodes`);
        const nodes = await nodes_res.json();
        const edges_res = await fetch(`${apiEndpoint}/${database}/visualize/edges`);
        const edges = await edges_res.json();
        const deps_res = await fetch(`${apiEndpoint}/${database}/visualize/dependencies`,  { method: "POST", headers: {
                "Content-Type": "application/json",
            }, body: JSON.stringify(data[0])});
        const deps = await deps_res.json();

        setAfterVisualization(<GraphView nodes={nodes} edges={edges} deps={deps}></GraphView>)

        setHasBeenNormalized(true);
        setIsNormalizing(false);
        setNormalizationResult(data)
    }

    const reset = async () => {
        setLoadedScenario(false);
        setPerGraphMetricsAfter([]);
        setPerGraphMetricsBefore([]);
        setPerDepMetricsAfter([]);
        setPerDepMetricsBefore([]);
        setHasBeenNormalized(false);
        setNormalizationResult([[],[]]);
        await fetch(`${apiEndpoint}/reset`, { method: "POST" });
    };

    const GraphView = ({ nodes = [], edges = [], deps = []}) => {
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
                    style={{ width: '100%', height: '50em' }}
                    stylesheet={stylesheet}
                    cy={(cy) => { cyRef.current = cy;}}
                    layout={{ name: 'null' }}
                    headless={false}
                /> ) : (<div/>)}
            </div>
        );
    };


    return (
      <div>
        <NavBar onReset={reset} setShowLogs={setShowLogs}/>
        <main>
            <LogDialog logs={logs} shown={showLogs} setShown={setShowLogs}/>
            <div className="wrapper" id="scenarios">
                <Card>
                    <H3>Configuration</H3>
                    <Label><div style={{width: "fit-content", display: 'flex', alignItems: 'center'}}>
                        Normalization method
                        <span>&nbsp;</span>
                        <Tooltip content="External link: Details on the available normalization methods"><Link href="https://dmki-tuwien.github.io/grana-grano/methods" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>
                    </div>
                        <SegmentedControl
                            id="select-method"
                            options={[
                                {
                                    label: "Graph-Native",
                                    value: "graph-native",
                                },
                                {
                                    label: "L:P",
                                    value: "lp",
                                },
                                {
                                    label: "Structural",
                                    value: "structural",
                                },
                            ]}
                            defaultValue={method}
                            disabled={isLoadingScenario || loadedScenario}
                            fill={true}
                            onValueChange={(newValue) => setMethod(newValue)}
                        />
                    </Label>

                    <Label>Graph store
                    <SegmentedControl
                        id="select-database"
                        options={[
                            {
                                label: "Neo4j",
                                value: "neo4j",
                            },
                            {
                                label: "Memgraph",
                                value: "memgraph",
                            },
                        ]}
                        defaultValue={database}
                        disabled={isLoadingScenario || loadedScenario}
                        fill={true}
                        onValueChange={(newValue) => setDatabase(newValue)}
                    />
                    </Label>

                    <div>
                        <Label>
                            <div style={{width: "fit-content", display: 'flex', alignItems: 'center'}}>
                                <Tooltip content="A normalization scenario combines a graph loaded into a graph store with a set of dependencies.">
                                    <span>Scenario <Icon icon="small-info-sign" />
                                    </span>
                                </Tooltip>
                                <span>&nbsp;</span>
                                <Tooltip content="External link: Details on the available scenarios"><Link href="https://dmki-tuwien.github.io/grana-grano/scenarios" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>
                            </div>
                            <Select
                                filterable={false}
                                disabled={isLoadingScenario || loadedScenario}
                                fill={true}
                                items={availableScenarios}
                                itemRenderer={(scen, { handleClick }) => (
                                    <MenuItem
                                        active={scenario === scen.value}
                                        key={scen.value}
                                        onClick={handleClick}
                                        text={scen.label}
                                    />
                                )}
                                popoverProps={{
                                    placement: "bottom",
                                }}
                                itemListRenderer={({ items, itemsParentRef, renderItem }) => {
                                    let lastCategory = "";
                                    let menuItems = [];
                                    if (items.length > 0) {
                                        menuItems = items.map((scen, index) => {
                                            const elements = [];

                                            // If category changes, push a Divider/Header
                                            if (scen.category !== lastCategory) {
                                                elements.push(
                                                    <MenuDivider key={`header-${scen.category}`} title={scen.category} />
                                                );
                                                lastCategory = scen.category;
                                            }

                                            elements.push(renderItem(scen, index));
                                            return elements;
                                        });
                                    }


                                    return <Menu ulRef={itemsParentRef}>{menuItems}</Menu>;
                                }}
                                onItemSelect={(scen) => setScenario(scen.value)}
                                itemsEqual="name"               >
                                <Button fill={true}
                                        disabled={isLoadingScenario || loadedScenario}
                                        alignText={"left"} text={<Text ellipsize={true} tagName="div" style={{ maxWidth: "310px" }}>{availableScenarios.find(s => s.value === scenario)?.label || "Loading scenarios …"}</Text>} endIcon="double-caret-vertical"></Button>
                            </Select>
                        </Label>
                    </div>
                    <Button id="button-load" icon="import" fill={true} loading={isLoadingScenario} disabled={loadedScenario} onClick={() => load_scenario()}>Load</Button>
                    <br/>
                    <div hidden={!loadedScenario} >
                    <Button  icon="play" fill={true} disabled={hasBeenNormalized} loading={isNormalizing} text="Normalize" onClick={() => normalize()} />
                    </div>
                </Card>
            </div>
            <div className="wrapper" id="dependencies" hidden={!loadedScenario}>
                <Card >
                <H3>Dependencies and Transformations</H3>
                    <div style={{ minHeight:"220px" }}>
                        <H4>Before Normalization</H4>

                        <Label><div style={{width: "fit-content", display: 'flex', alignItems: 'center'}}>
                            <Tooltip content="The original set of dependencies as provided by the definition of the selected scenario.">
                                    <span>Provided dependencies <Icon icon="small-info-sign" />
                                    </span>
                            </Tooltip>
                             
                            <Tooltip content="External link: Definition of the syntax used to formulate dependencies."><Link href="https://dmki-tuwien.github.io/grana-grano/dependencies" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>
                        </div>
                            <ul>

                                {dependencies.map((dep, _) => (
                                    <li key={dep}>{prettyDep(dep)}</li>
                                ))}
                                { dependencies.length == 0 && <li><i>None</i></li> }

                            </ul></Label>

                        <Button onClick={() => setDependencyDialogOpen(true)} icon={"edit"} disabled={hasBeenNormalized}>Edit dependencies</Button>
                        <Dialog title="Edit dependencies" icon="edit" isOpen={dependencyDialogOpen} onClose={()=>setDependencyDialogOpen(false)} isCloseButtonShown={false}>
                            <DialogBody>
                                <Label>Minimal Cover used for normalization
                                    <TextArea style={{width: "100%", height: "10em"}} disabled={hasBeenNormalized || isNormalizing} value={minCov.join("\n")} onChange={(e) => {setMinCov(e.currentTarget.value.split("\n")); setDependencies(e.currentTarget.value.split("\n"))}}></TextArea></Label>
                            </DialogBody>
                            <DialogFooter actions={<Button intent="primary" text="Close" onClick={()=>setDependencyDialogOpen(false)} />} />

                        </Dialog>
                    </div>
                    <div hidden={!hasBeenNormalized}>
                        <H4>After Normalization</H4>
                        <Label><div style={{width: "fit-content", display: 'flex', alignItems: 'center'}}><Tooltip content="As part of the normalization process, the dependencies of the minimal cover have been transformed.">
                                    <span>Transformed dependencies <Icon icon="small-info-sign" />
                                    </span>
                        </Tooltip></div>
                            <ul>

                                    {normalizationResult[0].map((dep, index) => (
                                        <li key={index}>{prettyDep(dep)}</li>
                                    ))}
                                    { normalizationResult[0].length == 0 && <li><i>None</i></li> }

                            </ul></Label>
                        <Label><div style={{width: "fit-content", display: 'flex', alignItems: 'center'}}>
                            <Tooltip content="Lists the transformations applied as part of the normalization process.">
                                    <span>Applied transformations <Icon icon="small-info-sign" />
                                    </span>
                            </Tooltip>
                             
                            {/*<Tooltip content="External link: Definitions of the transformations that can be performed during normalization."><Link href="https://dmki-tuwien.github.io/" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>*/}
                        </div>
                            <ul>

                                {normalizationResult[1].map((transf, index) => (
                                    <li key={index}>{transf}&nbsp;<Link href="https://dmki-tuwien.github.io/grana-grano/transformations" target="_blank"> <Icon icon="share" size={12}/> </Link></li>                                ))}

                            </ul></Label>
                        <p>Normalization took {normalizationResult[2]} seconds.</p>
                    </div>
                </Card>
            </div>
            <div className="wrapper" id="metrics">
                <Card hidden={!loadedScenario}>
                    <H3>Metrics</H3>
                    <H4>Per-graph Metrics 
                        <Tooltip content="Metrics that are calculated before and after normalization on the whole graph of the loaded scenario."><Icon icon="small-info-sign"/></Tooltip>
                         
                        <Tooltip content="External link: Metric definitions"><Link href="https://dmki-tuwien.github.io/grana-grano/metrics#per-graph-metrics" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>
                    </H4>
                    <BarChart
                        dataset={perGraphMetricsGraphData}

                        xAxis={[
                            {
                                id: 'categories',
                                scaleType: 'band',
                                label: "Metric",
                                dataKey: 'label',
                                valueFormatter: (label, context) => {
                                    if (context.location === 'tick') {
                                        if (label.length > 9) {
                                            return `${label.slice(0, 7)}…`
                                        }
                                        return label
                                    } else {
                                        return label;
                                    }
                                }
                            },
                        ]}
                        yAxis={[
                            {
                                scaleType: 'symlog',
                                label: 'Value (Symlog Scale)',
                            },
                        ]}
                        series={[
                            {
                                dataKey: 'before',
                                label: 'Before Normalization',
                                color: '#1976d2',
                                valueFormatter: (value) => (value ?? 0).toString(),
                            },
                            {
                                dataKey: 'after',
                                label: 'After Normalization',
                                color: '#dc004e',
                                valueFormatter: (value) => (value ?? 0).toString(),
                            },
                        ]}
                        height={300}
                    />



                <div hidden={perDepMetricsBefore.length == 0}>
                    <H4>Per-dependency Metrics 
                        <Tooltip content="Metrics that are calculated before and after normalization on each dependency of the loaded scenario."><Icon icon="small-info-sign"/></Tooltip>
                         
                        <Tooltip content="External link: Metric definitions"><Link href="https://dmki-tuwien.github.io/grana-grano/metrics#per-dependency-metrics" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>
                    </H4>
                    <div>
                        <Label>Dependency
                        <div style={{ position: "relative" }}>
                        <Select<Dependency>
                            filterable={false}
                            fill={true}
                            items={perDepMetricsBefore.concat(perDepMetricsAfter)}
                            itemRenderer={(dependency, { handleClick }) => (
                                <MenuItem
                                    active={selectedPerDepMetric?.name === dependency.name}
                                    key={dependency.name}
                                    onClick={handleClick}
                                    text={prettyDep(dependency.name)}
                                />
                            )}
                            popoverProps={{
                                placement: "bottom",
                            }}
                            itemListRenderer={({ items, itemsParentRef, renderItem }) => {
                                let lastCategory = "";
                                let menuItems = [];
                                if (items.length > 0) {
                                    menuItems = items.map((dependency, index) => {
                                        const elements = [];

                                        // If category changes, push a Divider/Header
                                        if (dependency.category !== lastCategory) {
                                            elements.push(
                                                <MenuDivider key={`header-${dependency.category}`} title={dependency.category} />
                                            );
                                            lastCategory = dependency.category;
                                        }

                                        elements.push(renderItem(dependency, index));
                                        return elements;
                                    });
                                }


                                return <Menu ulRef={itemsParentRef}>{menuItems}</Menu>;
                            }}
                            onItemSelect={(dependency) => setSelectedPerDepMetric(dependency)}
                            itemsEqual="name"
                        >
                            <Button fill={true} alignText={"left"} text={<Text ellipsize={true} tagName="div" style={{ maxWidth: "310px" }}>{selectedPerDepMetric ? prettyDep(selectedPerDepMetric.name) : ""}</Text>} endIcon="double-caret-vertical"></Button>
                        </Select>
                        </div>
                        </Label>
                        <BarChart
                            dataset={Object.entries(selectedPerDepMetric ? selectedPerDepMetric.metrics : {}).map(([label, value]) => ({
                                label,
                                value,
                            }))}
                            hideLegend={true}
                            xAxis={[
                                {
                                    id: 'categories',
                                    scaleType: 'band',
                                    label: "Metric",
                                    dataKey: 'label',
                                    valueFormatter: (label, context) => {
                                        if (context.location === 'tick') {
                                            if (label.length > 10) {
                                                return `${label.slice(0, 7)}…`
                                            }
                                            return label
                                        } else {
                                            return label;
                                        }
                                    }
                                },
                            ]}
                            yAxis={[
                                {
                                    scaleType: 'symlog',
                                    label: 'Value (Symlog Scale)',
                                },
                            ]}
                            series={[
                                {
                                    dataKey: 'value',
                                    label: 'Value',
                                    color: '#1C6E42',
                                    valueFormatter: (value) => (value ?? 0).toString(),
                                },
                            ]}
                            height={300}
                        />
                    </div>
                </div>

                </Card>
            </div>
            <div className="wrapper" id="visualization">
            <div hidden={!loadedScenario}>
                <Card >
                    <H3>Original Graph</H3>

                    {beforeVisualization}
                </Card>
            </div>
            <div hidden={!hasBeenNormalized}>
                <Card >
                    <H3>Normalized Graph</H3>

                    {afterVisualization}
                </Card>
            </div>

            </div>
            <div hidden={!loadedScenario}>
                <Card >
                    <H5>Legend</H5>
                    <ul id={"legend"}>
                        <li key={"legend-node"}><div style={{
                            display: "inline-block",
                            width: "30px",
                            height:"15px",
                            border: "solid",
                            marginInlineEnd: "5px",
                            backgroundColor: "#FBB360",
                            borderWidth: "1px",
                            borderColor: "#935610",
                            borderRadius: "6px",
                            verticalAlign: "text-bottom"
                        }}>
                        </div>Node</li>
                        <li key={"legend-edge"}><div style={{
                            display: "inline-block",
                            width: "15px",
                            height:"1px",
                            border: "solid",
                            borderWidth: "1px",
                            borderColor: "#738091",
                            borderRadius: "6px",
                            verticalAlign: "middle"
                        }}>
                        </div><div style={{
                            display: "inline-block",
                            width: "30px",
                            height:"15px",
                            border: "solid",
                            backgroundColor: "#ffffff",
                            borderWidth: "1px",
                            borderColor: "#738091",
                            borderRadius: "6px",
                            verticalAlign: "text-bottom"
                        }}>
                        </div><div style={{
                            display: "inline-block",
                            width: "15px",
                            height:"1px",
                            border: "solid",
                            marginInlineEnd: "5px",
                            borderWidth: "1px",
                            borderColor: "#738091",
                            borderRadius: "6px",
                            verticalAlign: "middle"
                        }}>
                        </div>Edge</li>
                        <li key={"legend-dependency"}><div style={{
                            display: "inline-block",
                            width: "25px",
                            height:"8px",
                            borderTop: "dashed",
                            marginInlineEnd: "5px",
                            borderTopWidth: "2px",
                            borderTopColor: "#000000",
                            verticalAlign: "text-bottom"
                        }}></div>Dependency</li>
                        <li key={"legend-disclaimer"}>If more than 50 nodes are visualized, individual properties are not shown for performance reasons.</li>
                    </ul>


                </Card>
            </div>
        </main>
          <footer>
              ©&nbsp;{STRINGS.common.year}&nbsp;-&nbsp;
              <a href={"https://johannes.schrott.onl"} target={"__blank"}>Johannes Schrott</a>,&nbsp;
              <a href={"https://dmki-tuwien.github.io"} target={"__blank"}>DMKI Lab</a>,&nbsp;
              <a href={"https://tuwien.ac.at"} target={"__blank"}>TU Wien</a>
          </footer>
      </div>
  );
}
