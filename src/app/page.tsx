'use client'
import {
    Button, Card, H3, H4, H5, Icon, Label, Link, MenuItem, MenuDivider, Menu, SegmentedControl, Text,
    TextArea, Tooltip, Dialog, DialogBody, DialogFooter, ButtonGroup, Alert, HTMLSelect, Spinner
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
import SettingsDialog from "@/app/components/settingsDialog";
import OnboardingDialog from "@/app/components/onboardingDialog";
import {Dependency, prettyDep} from "@/app/helpers";
import Visualization from "@/app/components/visualization";
import Footer from "@/app/components/footer";
import SideBar from "@/app/components/sidebar";
import GraphView from "@/app/components/graphview";

cytoscape.use(cola);
cytoscape.use(avsdf);
cytoscape.use(automove)
cytoscape.use(fcose)




export default function Home() {
    const [database, setDatabase] = useState("neo4j");
    const [method, setMethod] = useState("graph-native");


    const [dependencies, setDependencies] = useState<string[]>([]);
    const [minCov, setMinCov] = useState<string[]>([]);

    const [perGraphMetricsAfter, setPerGraphMetricsAfter] = useState<{[key: string]: number}>({});
    const [perGraphMetricsBefore, setPerGraphMetricsBefore] = useState<{[key: string]: number}>({});
    const [perGraphMetricsGraphData, setPerGraphMetricsGraphData] = useState([]);
    const [perDepMetricsAfter, setPerDepMetricsAfter] = useState<Array<Dependency>>([]);
    const [perDepMetricsBefore, setPerDepMetricsBefore] = useState<Array<Dependency>>([]);
    const [selectedPerDepMetric, setSelectedPerDepMetric] = useState<Dependency>({name: "", category: "", metrics: {}});

    // Logs
    const [showLogs, setShowLogs] = useState<boolean>(false);
    const [logs, setLogs] = useState<string[]>([]);

    // Settings
    const [showSettings, setShowSettings] = useState<boolean>(false);
    const [useLLMs, setUseLLMs] = useState<boolean>(false);
    const [llmAPIKey, setLlmAPIKey] = useState<string>("");
    const [llmAPIModel, setLlmAPIModel] = useState<string>("");
    const [llmApiEndpointUrl, setLlmApiEndpointUrl] = useState<string>("")

    // Warning
    const [showWarning, setShowWarning] = useState<boolean>(false);
    const [warning, setWarning] = useState<string>("");

    // Error
    const [showError, setShowError] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    // Onboarding
    const [showOnboarding, setShowOnboarding] = useState<boolean>(true);

    // Scenario
    const [customScenario, setCustomScenario] = useState<boolean>(false);
    const [customScenarioCypher, setCustomScenarioCypher] = useState<string>("");
    const [availableScenarios, setAvailableScenarios] = useState([]);
    const [scenario, setScenario] = useState("");
    const [isLoadingScenario, setIsLoadingScenario] = useState<boolean>(false);
    const [loadedScenario, setLoadedScenario] = useState<boolean>(false);

    // Sidebar
    const [showMetrics, setShowMetrics] = useState<boolean>(true);

    const [isNormalizing, setIsNormalizing] = useState(false);
    const [hasBeenNormalized, setHasBeenNormalized] = useState(false);
    const [normalizationResult, setNormalizationResult] = useState([[],[]]);
    const [normalizationType, setNormalizationType] = useState<string>("graph-native")

    const [beforeVisualization, setBeforeVisualization] = useState(<div/>);
    const [afterVisualization, setAfterVisualization] = useState(<div/>);

    const [dependencyDialogOpen, setDependencyDialogOpen] = useState<boolean>(false);

    const [apiEndpoint, setApiEndpoint] = useState<string>("");

    // Connect to API
    useEffect(() => {
        setApiEndpoint(`${window.location.protocol}//${window.location.hostname}:${window.location.port === "3000" ? "8001" : `${window.location.port}/api`}`)

        const WS_PROTOCOL: "wss:"|"ws:" = window.location.protocol === "https:" ? "wss:" : "ws:";
        const LOG_WS_URL: string = `${WS_PROTOCOL}//${window.location.hostname}:${window.location.port === "3000" ? "8001" : `${window.location.port}/api`}/ws/log`;
        const logSocket = new WebSocket(LOG_WS_URL);

        logSocket.onopen = () => {
           // setStatus("open");
        };

        logSocket.onmessage = (event: MessageEvent<string>) => {
            setLogs((prev) => [...prev, event.data]);
            if (event.data.includes("ERROR")) {
                setError(event.data)
                setShowError(true);
            } else if (event.data.includes("WARNING")) {
                setWarning(event.data)
                setShowWarning(true);
            }
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

    // Fetch scenarios
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
            //    setScenario(options[0]["value"]);

            } catch (error) {
                console.error("Error fetching scenarios:", error);
                setAvailableScenarios([]);
            } finally {
            }
        };

        fetchScenarios();
    }, [database, apiEndpoint]);

    // Fetch dependencies
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

    // Fetch metrics
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

                    setBeforeVisualization(<GraphView nodes={nodes} edges={edges} deps={deps} hasBeenNormalized={hasBeenNormalized}></GraphView>)

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

    // Fetch metrics
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
        const response = await fetch(`${apiEndpoint}/${database}/normalize?method=${normalizationType}&useLlm=${useLLMs}&llmUrl=${llmApiEndpointUrl}&llmModel=${llmAPIModel}&llmKey=${llmAPIKey}`, { method: "POST", headers: {
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

        setAfterVisualization(<GraphView nodes={nodes} edges={edges} deps={deps} hasBeenNormalized={hasBeenNormalized}></GraphView>)

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
        if(!showError) {
            window.location.reload();
        }
    };


    return (
      <div>
        <NavBar onReset={reset} setShowLogs={setShowLogs} setShowSettings={setShowSettings}/>
        <main>
            <OnboardingDialog shown={showOnboarding}
                              setShown={setShowOnboarding}
                              database={database}
                              setDatabase={setDatabase}
                              customScenario={customScenario}
                              setCustomScenario={setCustomScenario}
                              minCov={minCov}
                              setMinCov={setMinCov}
                              setDependencies={setDependencies}
                              availableScenarios={availableScenarios}
                              setScenario={setScenario}
                              scenario={scenario}
                              loadScenario={load_scenario}
                              customScenarioCypher={customScenarioCypher}
                              setCustomScenarioCypher={setCustomScenarioCypher}
            />
            <LogDialog logs={logs}
                       shown={showLogs}
                       setShown={setShowLogs}/>
            <SettingsDialog useLLMs={useLLMs}
                            setUseLLMs={setUseLLMs}
                            llmAPIKey={llmAPIKey}
                            setLlmAPIKey={setLlmAPIKey}
                            llmAPIModel={llmAPIModel}
                            setLlmAPIModel={setLlmAPIModel}
                            llmApiEndpointUrl={llmApiEndpointUrl}
                            setLLMAPIEndpointUrl={setLlmApiEndpointUrl}
                            shown={showSettings}
                            setShown={setShowSettings}/>
            <Alert intent={"warning"}
                   icon="warning-sign"
                   isOpen={showWarning}
                   onConfirm={()=>setShowWarning(!showWarning)}>
                {warning}
            </Alert>
            <Alert intent={"danger"}
                   icon="error"
                   confirmButtonText={STRINGS.alert.errorButton}
                   isOpen={showError}
                   onConfirm={()=>setShowError(!showError)}
                   onClosed={()=>window.location.reload()}>
                {error}
            </Alert>

            <div id={"before"}>
                {!loadedScenario && !isLoadingScenario ?
                    <div id={"afterNormalizationText"}>
                        Please load a scenario to get started.
                    </div> :
                    isLoadingScenario ?
                    <div id={"afterNormalizationText"}>
                Loading scenario ... <Spinner/>
            </div> :
                    <div className={"deps"}>
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
                </div>
                }

                {loadedScenario ?
                <div className={"vis"} hidden={!loadedScenario}>
                     {beforeVisualization}
                </div> :
                <div/>
                }
            </div>
            <div id={"normalizeControl"}>
                <ButtonGroup>
                <Button icon="play" fill={true} disabled={hasBeenNormalized || !loadedScenario} loading={isNormalizing} text="Normalize using" style={{width: '155px'}} onClick={() => normalize()} />
                    <HTMLSelect defaultValue={normalizationType} disabled={hasBeenNormalized || !loadedScenario || isNormalizing} style={{width:'245px'}} onChange={(event) => setNormalizationType(event.currentTarget.value)}>
                        <option value={"graph-native"} label={"Graph-Native Normalization"}/>
                        <option value={"lp"} label={"L:P Normalization"}/>
                        <option value={"structural"} label={"Structural Normalization (EGNF)"}/>

                    </HTMLSelect>
                </ButtonGroup>
            </div>
            <div id={"after"}>
                {!hasBeenNormalized ?
                    <div id={"afterNormalizationText"}>
                        After normalization, results will be shown here.
                    </div> :
                        <div className={"deps"}>
                            <H4>After Normalization</H4>
                            <Label><div style={{width: "fit-content", display: 'flex', alignItems: 'center'}}><Tooltip content="As part of the normalization process, the dependencies of the minimal cover have been transformed.">
                                        <span>Dependencies after normalization <Icon icon="small-info-sign" />
                                        </span>
                            </Tooltip></div>
                                <ul>
                                    {(normalizationResult === undefined || normalizationResult[0] === undefined || normalizationResult[0].length == 0) ?
                                        <li><i>None</i></li> :

                                    normalizationResult[0].map((dep, index) => (
                                        <li key={index}>{prettyDep(dep)}</li>
                                    ))
                                    }
                                </ul></Label>

                            {normalizationType != "structural" ?
                            <Label><div style={{width: "fit-content", display: 'flex', alignItems: 'center'}}>
                                <Tooltip content="Lists the transformations applied as part of the normalization process.">
                                        <span>Applied transformations <Icon icon="small-info-sign" />
                                        </span>
                                </Tooltip>

                                {/*<Tooltip content="External link: Definitions of the transformations that can be performed during normalization."><Link href="https://dmki-tuwien.github.io/" target="_blank"> <Icon icon="share" size={12}/> </Link></Tooltip>*/}
                            </div>
                                <ul>
                                    {(normalizationResult === undefined || normalizationResult[0] === undefined || normalizationResult[0].length == 0) ?
                                        <li><i>None</i></li> :
                                    normalizationResult[1].map((transf, index) => (
                                        <li key={index}>{transf}&nbsp;<Link href="https://dmki-tuwien.github.io/grana-grano/transformations" target="_blank"> <Icon icon="share" size={12}/> </Link></li>                                ))}

                                </ul></Label> :
                                <span/>
                            }
                            <p>Normalization took {normalizationResult[2]} seconds.</p>
                        </div>
                }
                {hasBeenNormalized ?
                        <div className={"vis"} style={{height: "50%"}}>
                            {afterVisualization}
                        </div> : <div/>
            }
            </div>



        </main>
            <SideBar showMetrics={showMetrics}
                     setShowMetrics={setShowMetrics}
                     loadedScenario={loadedScenario}
                     perGraphMetricsGraphData={perGraphMetricsGraphData}
                     perDepMetricsBefore={perDepMetricsBefore}
                     perDepMetricsAfter={perDepMetricsAfter}
                     selectedPerDepMetric={selectedPerDepMetric}
                     setSelectedPerDepMetric={setSelectedPerDepMetric}
                     hasBeenNormalized={hasBeenNormalized}
            />
            <Footer/>
      </div>
  );
}
