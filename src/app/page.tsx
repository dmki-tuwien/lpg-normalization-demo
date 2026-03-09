'use client'
import {
    Alignment,
    AnchorButton,
    Button, Card, H3, H4, H5, HTMLSelect, Label,
    Navbar,
    NavbarDivider,
    NavbarGroup,
    NavbarHeading, SegmentedControl,
    TextArea
} from "@blueprintjs/core";
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import avsdf from 'cytoscape-avsdf';
import { BarChart } from '@mui/x-charts/BarChart';


import {useEffect, useState} from "react";

cytoscape.use(cola);
cytoscape.use(avsdf);



export default function Home() {
    const [database, setDatabase] = useState("neo4j");

    const [dependencies, setDependencies] = useState([]);
    const [minCov, setMinCov] = useState([]);

    const [perGraphMetricsAfter, setPerGraphMetricsAfter] = useState<{[key: string]: number}>({});
    const [perGraphMetricsBefore, setPerGraphMetricsBefore] = useState<{[key: string]: number}>({});
    const [perGraphMetricsGraphData, setPerGraphMetricsGraphData] = useState([]);
    const [perDepMetricsAfter, setPerDepMetricsAfter] = useState<{[key: string]: number}>({});
    const [perDepMetricsBefore, setPerDepMetricsBefore] = useState<{[key: string]: number}>({});


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

                    setPerDepMetricsBefore(data)
                }
                if (hasBeenNormalized) {
                    const response = await fetch(`http://localhost:8000/${database}/statistics/dependencies`,  { method: "POST", headers: {
                            "Content-Type": "application/json",
                        }, body: JSON.stringify(normalizationResult[0]) });
                    if (!response.ok) throw new Error("Failed to fetch");

                    const data = await response.json();
                    setPerDepMetricsAfter(data)
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
        setHasBeenNormalized(false);
        setNormalizationResult([[],[]]);
        await fetch(`http://localhost:8000/reset`, { method: "POST" });
    };

    const GraphView = ({ nodes = [], edges = []}) => {
        // 1. Define your graph data (Elements)

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

        const elements = [...cy_nodes, ...cy_edges];


        // 2. Define visual styles
        const stylesheet = [
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 3,
                    'line-color': '#5F6B7C',
                    'target-arrow-color': '#5F6B7C',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            }
        ];

        let layoutName = "cola";

        if (nodes.length > 20) {
            layoutName = "circle";
        }

        return (
            <div>
                <CytoscapeComponent
                    elements={elements}
                    style={{ width: '100%', height: '50em' }}
                    stylesheet={stylesheet}
                    layout={{ name: layoutName, animate: false }}
                />
            </div>
        );
    };

    return (
      <div>
        <nav>
            <Navbar fixedToTop>
                <NavbarGroup align={Alignment.START}>
                    <NavbarHeading>LPG Normalization</NavbarHeading>
                    <NavbarDivider/>
                    <Button className="bp6-minimal" icon="reset" text="Reset" onClick={() => reset()} />
                </NavbarGroup>
                <NavbarGroup align={Alignment.END}>
                    <AnchorButton className="bp6-minimal" icon="help" text="Documentation" href="https://dmki-tuwien.github.io/lpg-normalization" target="_blank"/>
                </NavbarGroup>
            </Navbar>
        </nav>
        <main>
            <div className="wrapper" id="scenarios">
                <Card>
                    <H3>Scenario</H3>
                    <Label>Database
                    <SegmentedControl
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

                    <Label>Scenario
                        <HTMLSelect id="Scenario" disabled={isLoadingScenario || loadedScenario} options={availableScenarios} onChange={(e) => setScenario(e.currentTarget.value)} value={scenario}>Scenario</HTMLSelect>
                    </Label>
                    <Button icon="import" fill={true} loading={isLoadingScenario} disabled={loadedScenario} onClick={() => load_scenario()}>Load</Button>
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
                    <Label>All
                    <TextArea disabled={hasBeenNormalized || isNormalizing} value={dependencies.join("\n")}></TextArea></Label>

                        <Label>Minimal Cover
                        <TextArea disabled={hasBeenNormalized || isNormalizing} value={minCov.join("\n")}></TextArea></Label>
                    </div>
                    <div hidden={!hasBeenNormalized}>
                        <H4>After Normalization</H4>
                        <Label>Dependencies<br/>
                            <ul>

                                    {normalizationResult[0].map((dep, index) => (
                                        <li key={index}>{dep}</li>
                                    ))}

                            </ul></Label>
                        <Label>Applied Transformations
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
                    <H4>Per-graph Metrics</H4>
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
                    <H4>Per-dependency Metrics</H4>
                        <H5>Before Normalization</H5>

                        <ul>
                            {Object.entries(perDepMetricsBefore).map(([key, value]) => (
                                <li><b>{key}</b>
                                    <ul>
                                        {Object.entries(value).map(([key2, value2]) => (
                                            <li><b>{key2}: </b>{value2}</li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div hidden={!hasBeenNormalized}>
                        <H5>After Normalization</H5>

                        <ul>
                            {Object.entries(perDepMetricsAfter).map(([key, value]) => (
                                <li><b>{key}</b>
                                    <ul>
                                        {Object.entries(value).map(([key2, value2]) => (
                                            <li><b>{key2}: </b>{value2}</li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Card>
            </div>
            <div className="wrapper" id="visualization">
            <div hidden={!loadedScenario}>
                <Card >
                    {beforeVisualization}
                </Card>
            </div>
            <div hidden={!hasBeenNormalized}>
                <Card >
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
