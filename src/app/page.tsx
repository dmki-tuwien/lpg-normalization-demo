'use client'
import {
    Alignment,
    AnchorButton,
    Button, Card, H3, H4, H5, HTMLSelect, Icon, Label, Link, MenuItem, MenuDivider, Menu,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    NavbarHeading, SegmentedControl, Text,
    TextArea, Tooltip
} from "@blueprintjs/core";
import {ItemListRenderer, ItemPredicate, ItemRenderer, Select} from "@blueprintjs/select";
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import automove from 'cytoscape-automove';
import avsdf from 'cytoscape-avsdf';
import { BarChart } from '@mui/x-charts/BarChart';


import {useEffect, useRef, useState} from "react";
import {getPath} from "@mui/system";

cytoscape.use(cola);
cytoscape.use(avsdf);
cytoscape.use(automove)

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
        '::': ' :: '
    };

    return text.replace(/->|<-|=>|-|::/g, (match) => arrowMap[match]);
}

export default function Home() {
    const [database, setDatabase] = useState("neo4j");

    const [dependencies, setDependencies] = useState([]);
    const [minCov, setMinCov] = useState([]);

    const [perGraphMetricsAfter, setPerGraphMetricsAfter] = useState<{[key: string]: number}>({});
    const [perGraphMetricsBefore, setPerGraphMetricsBefore] = useState<{[key: string]: number}>({});
    const [perGraphMetricsGraphData, setPerGraphMetricsGraphData] = useState([]);
    const [perDepMetricsAfter, setPerDepMetricsAfter] = useState<Array<Dependency>>([]);
    const [perDepMetricsBefore, setPerDepMetricsBefore] = useState<Array<Dependency>>([]);
    const [selectedPerDepMetric, setSelectedPerDepMetric] = useState<Dependency>({name: "", category: "", metrics: {}});
   // const [s]

    const [availableScenarios, setAvailableScenarios] = useState([]);
    const [scenario, setScenario] = useState("");
    const [isLoadingScenario, setIsLoadingScenario] = useState(false);
    const [loadedScenario, setLoadedScenario] = useState(false);

    const [isNormalizing, setIsNormalizing] = useState(false);
    const [hasBeenNormalized, setHasBeenNormalized] = useState(false);
    const [normalizationResult, setNormalizationResult] = useState([[],[]]);

    const [beforeVisualization, setBeforeVisualization] = useState(<div/>);
    const [afterVisualization, setAfterVisualization] = useState(<div/>);

    useEffect(() => {
        const fetchScenarios = async () => {
            try {
                const response = await fetch(`http://localhost:8000/${database}/scenarios`);
                if (!response.ok) throw new Error("Failed to fetch");

                const data = await response.json();
                const options = data.map((item: any) => ({
                    label: item.name || item,
                    value: item.id || item
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
    }, [database]);

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                const response = await fetch(`http://localhost:8000/${database}/scenarios/${scenario}/dependencies`);
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
                const response = await fetch(`http://localhost:8000/${database}/scenarios/${scenario}/minimal_cover`);
                if (!response.ok) throw new Error("Failed to fetch");

                const data = await response.json();

                setMinCov(data)

            } catch (error) {
                console.error("Error fetching scenarios:", error);
            } finally {
            }
        };

        if (!hasBeenNormalized && scenario !== "") {fetchMinimalCover()}

        const fetchPerGraphMetrics = async () => {
            try {
                const response = await fetch(`http://localhost:8000/${database}/statistics/graph`);
                if (!response.ok) throw new Error("Failed to fetch");

                const data = await response.json();

                if (!hasBeenNormalized) {setPerGraphMetricsBefore(data)}
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
                    const response = await fetch(`http://localhost:8000/${database}/statistics/dependencies`,  { method: "POST", headers: {
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
                    const response = await fetch(`http://localhost:8000/${database}/statistics/dependencies`,  { method: "POST", headers: {
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

    }, [database, scenario, hasBeenNormalized, loadedScenario]);

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
            const response = await fetch(`http://localhost:8000/${database}/scenarios/load?id=${scenario}`,  { method: "POST" });
            if (!response.ok) throw new Error("Failed to fetch");

            setIsLoadingScenario(false);

            const nodes_res = await fetch(`http://localhost:8000/${database}/visualize/nodes`);
            const nodes = await nodes_res.json();
            const edges_res = await fetch(`http://localhost:8000/${database}/visualize/edges`);
            const edges = await edges_res.json();

            setBeforeVisualization(<GraphView nodes={nodes} edges={edges}></GraphView>)

            setLoadedScenario(true);
        } catch (error) {
            console.error("Error fetching scenarios:", error);
            setAvailableScenarios([]);
        } finally {
        }
    };

    const normalize = async () => {
        setIsNormalizing(true);
        const response = await fetch(`http://localhost:8000/${database}/normalize`, { method: "POST", headers: {
                "Content-Type": "application/json",
            }, body: JSON.stringify(minCov) })
        const data = await response.json();

        const nodes_res = await fetch(`http://localhost:8000/${database}/visualize/nodes`);
        const nodes = await nodes_res.json();
        const edges_res = await fetch(`http://localhost:8000/${database}/visualize/edges`);
        const edges = await edges_res.json();

        setAfterVisualization(<GraphView nodes={nodes} edges={edges}></GraphView>)

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
        await fetch(`http://localhost:8000/reset`, { method: "POST" });
    };

    const GraphView = ({ nodes = [], edges = []}) => {
        // 1. Define your graph data (Elements)
        let elements = null;
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
                    id: "n" + String(edge.src) + String(edge.tgt),
                    label: edge.labels[0],
                    type: edge.labels[0],

                },
                classes: "reified_edge"
            }));
            let cy_edges1 = edges.map(edge => ({
                data: {
                    id: "eSRC" + String(edge.id),
                    source: "n" + String(edge.src),
                    target: "n" + String(edge.src) + String(edge.tgt),
                    label: edge.labels[0],
                    type: "SRC" + edge.labels[0],
                },
                classes: "src"
            }));
            let cy_edges2 = edges.map(edge => ({
                data: {
                    id: "eTGT" + String(edge.id),
                    source: "n" + String(edge.src) + String(edge.tgt),
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
                            id: `${"n" + String(node.id)}_${key}`,
                            label: `${key}: ${value}`,
                            parent: "n" + String(node.id) // This nests it inside the parent
                        },
                        classes: 'property'
                    });
                });
            });

            edges.forEach((edge) => {
                Object.entries(edge.properties).forEach(([key, value]) => {
                    elements.push({
                        data: {
                            id: `${"n" + String(edge.src) + String(edge.tgt)}_${key}`,
                            label: `${key}: ${value}`,
                            parent: "n" + String(edge.src) + String(edge.tgt) // This nests it inside the parent
                        },
                        classes: 'property'
                    });
                });
            });

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

        const cyRef = useRef<cytoscape.Core | null>(null);
        const automoveRuleRef = useRef(null);

        useEffect(() => {
            const cy = cyRef.current;
            if (!cy) return;

            if (nodes.length < 50) {
                // 1. Define the Automove Rule FIRST
                // This ensures it catches the movement from the layout
                automoveRuleRef.current = cy.automove({
                    nodesMatching: '.reified_edge',
                    reposition: 'mean',
// This tells each reified edge node to stay in the middle
                    // of its connected Course/Lecturer nodes
                    when: "manual"
                });

                // 2. Run the Main Layout (AVSDF/Circle)
                if (nodes.length < 50) {
                    const topLevelNodes = cy.nodes().filter(n => n.parent().length === 0);

                    // 2. We also need the edges connecting these top-level entities
                    const layoutCollection = topLevelNodes.union(topLevelNodes.connectedEdges());
                    const mainLayout = layoutCollection.layout({
                        name: 'avsdf',
                        nodeSeparation: 900/nodes.length,
                        animate: true, // Animation helps automove "see" the shift
                        refresh: 10,   // Frequent updates for smoothness
                        fit: true
                    });

                    mainLayout.promiseOn('layoutstop').then(() => {
                        // 3. Stack the Properties
                        cy.nodes(':parent').forEach(parent => {
                            const children = parent.children();
                            if (children.length > 0) {
                                children.layout({
                                    name: 'grid',
                                    cols: 1,
                                    condense: true,
                                    fit: false,
                                    padding: 10,
                                    boundingBox: {
                                        x1: parent.position('x') - 100,
                                        x2: parent.position('x') + 100,
                                        y1: parent.position('y') - (children.length * 20)+30,
                                        y2: parent.position('y') + (children.length * 20)
                                    }
                                }).run();
                            }
                        });

                    });

                    mainLayout.run();
                    if (automoveRuleRef.current) {
                        automoveRuleRef.current.apply();
                    }
                    setTimeout(() => {
                        automoveRuleRef.current.apply();
                        cy.fit(); // Optional: re-center view
                        cy.style().update();

                    }, 100);

                }
            } else {
                cy.layout({
                    name: 'circle',
                    animate: false,
                    fit: true
                }).run();
            }

            // Initialize automove
            // This example makes nodes with class 'follower' move with 'leader'

            return () => {
                if (automoveRuleRef.current) automoveRuleRef.current.destroy();
            };
        }, [elements]);

        // 2. Define visual styles
        const stylesheet = [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'background-color': '#FBB360',
                    'border-width': 1,
                    'border-color': '#935610',
                }
            },
            {
                selector: '.property',
                style: {
                    'shape': 'rectangle',
                    'height': 9,          // Height of your "list item"
                    'background-color': '#ffffff',
                    'background-opacity': 0,
                    'border-width': 0,
                    'text-valign': 'center',
                    'font-size': '10px',
                    'label': 'data(label)',
                    'text-margin-y': 22,
                    'grabbable': false,
                    'selectable': false
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
                    'target-arrow-scale': 4,
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
                    'text-margin-y': 24,
                }
            },
            {
                selector: '.reified_edge',
                style: {
                    'border-color': '#738091',
                    'background-color': '#ffffff',
                    'width': '0.1px',
                    'height': '0.1px',
                    'grabbable': false,
                    "selectable": false,
                }
            },
        ];


        return (
            <div>
                <CytoscapeComponent
                    elements={elements}
                    style={{ width: '100%', height: '50em' }}
                    stylesheet={stylesheet}
                    cy={(cy) => { cyRef.current = cy;}}
                    layout={{ name: 'null' }}
                />
            </div>
        );
    };

    const renderDependencyList: ItemListRenderer<Dependency> = ({ items, itemsParentRef, renderItem }) => {
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
    };

    return (
      <div>
        <nav>
            <Navbar fixedToTop>
                <NavbarGroup align={Alignment.START}>
                    <NavbarHeading>LPG-Norm</NavbarHeading>
                    <NavbarDivider/>
                    <Button className="bp6-minimal" icon="reset" text="Reset" type="reset" onClick={() => reset()} /><Tooltip content="Resets Neo4j, Memgraph, and this application."><Icon icon="small-info-sign" />
                </Tooltip>
                </NavbarGroup>
                <NavbarGroup align={Alignment.END}>
                    <AnchorButton className="bp6-minimal" endIcon="share" text="Open documentation" href="https://dmki-tuwien.github.io/lpg-normalization" target="_blank"/>
                </NavbarGroup>
            </Navbar>
        </nav>
        <main>
            <div className="wrapper" id="scenarios">
                <Card>
                    <H3>Configuration</H3>
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
                                <Tooltip content="External link: Details on the available scenarios"><Link href="https://dmki-tuwien.github.io/" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>
                            </div>
                        <HTMLSelect id="select-scenario" disabled={isLoadingScenario || loadedScenario} options={availableScenarios} onChange={(e) => setScenario(e.currentTarget.value)} value={scenario}>Scenario</HTMLSelect>
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
                    <div>
                        <H4>Before Normalization</H4>

                        <Label><div style={{width: "fit-content", display: 'flex', alignItems: 'center'}}>
                            <Tooltip content="The original set of dependencies as provided by the definition of the selected scenario.">
                                    <span>Provided dependencies <Icon icon="small-info-sign" />
                                    </span>
                            </Tooltip>
                             
                            <Tooltip content="External link: Definition of the syntax used to formulate dependencies."><Link href="https://dmki-tuwien.github.io/" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>
                        </div>
                            <ul>

                                {dependencies.map((dep, index) => (
                                    <li key={index}>{prettyDep(dep)}</li>
                                ))}

                            </ul></Label>
                        <Label>Minimal Cover
                        <TextArea disabled={hasBeenNormalized || isNormalizing} value={minCov.join("\n")}></TextArea></Label>
                        <Button>Edit minimal cover</Button>
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

                            </ul></Label>
                        <Label><div style={{width: "fit-content", display: 'flex', alignItems: 'center'}}>
                            <Tooltip content="Lists the transformations applied as part of the normalization process.">
                                    <span>Applied transformations <Icon icon="small-info-sign" />
                                    </span>
                            </Tooltip>
                             
                            <Tooltip content="External link: Definitions of the transformations that can be performed during normalization."><Link href="https://dmki-tuwien.github.io/" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>
                        </div>
                            <ul>

                                {normalizationResult[1].map((transf, index) => (
                                    <li key={index}>{transf}</li>
                                ))}

                            </ul></Label>

                    </div>
                </Card>
            </div>
            <div className="wrapper" id="metrics">
                <Card hidden={!loadedScenario}>
                    <H3>Metrics</H3>
                    <H4>Per-graph Metrics 
                        <Tooltip content="Metrics that are calculated before and after normalization on the whole graph of the loaded scenario."><Icon icon="small-info-sign"/></Tooltip>
                         
                        <Tooltip content="External link: Metric definitions"><Link href="https://dmki-tuwien.github.io/" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>
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



                <div>
                    <H4>Per-dependency Metrics 
                        <Tooltip content="Metrics that are calculated before and after normalization on each dependency of the loaded scenario."><Icon icon="small-info-sign"/></Tooltip>
                         
                        <Tooltip content="External link: Metric definitions"><Link href="https://dmki-tuwien.github.io/" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>
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
                            itemListRenderer={renderDependencyList}
                            onItemSelect={(dependency) => setSelectedPerDepMetric(dependency)}
                            itemsEqual="name"
                        >
                            <Button fill={true} alignText={"left"} text={<Text ellipsize={true} tagName="div" style={{ maxWidth: "310px" }}>{prettyDep(selectedPerDepMetric.name)}</Text>} endIcon="double-caret-vertical"></Button>
                        </Select>
                        </div>
                        </Label>
                        <BarChart
                            dataset={Object.entries(selectedPerDepMetric.metrics).map(([label, value]) => ({
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
        </main>
          <footer>
              © 2026 -
              <a href={"https://johannes.schrott.onl"} target={"__blank"}>Johannes Schrott</a>,&nbsp;
              <a href={"https://dmki-tuwien.github.io"} target={"__blank"}>DMKI Lab</a>,&nbsp;
              <a href={"https://tuwien.ac.at"} target={"__blank"}>TU Wien</a>
          </footer>
      </div>
  );
}
