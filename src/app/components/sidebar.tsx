import {
    Button,
    H4,
    Icon,
    Label,
    Link,
    Menu,
    MenuDivider,
    MenuItem,
    SegmentedControl,
    Text,
    Tooltip
} from "@blueprintjs/core";
import {BarChart} from "@mui/x-charts/BarChart";
import {Select} from "@blueprintjs/select";
import {prettyDep} from "@/app/helpers";

interface SideBarProps {
    showMetrics: boolean
    setShowMetrics: (val: boolean) => void;
    loadedScenario: boolean;
    perGraphMetricsGraphData: never;
    perDepMetricsBefore: never;
    perDepMetricsAfter: never;
    selectedPerDepMetric: never;
    setSelectedPerDepMetric: (val: never) => void;
    hasBeenNormalized: boolean;
}

/**
 * Renders the navigation bar containing the application logo, a reset button, and a link to the web apps user documentation.
 * @param {Function} onReset Callback function for the reset button.
 * @param {Function} showLogs Callback function for the show logs button.
 * @return {JSX.Element} The rendered navigation bar component.
 */
export default function SideBar({ showMetrics, setShowMetrics, loadedScenario, perGraphMetricsGraphData, perDepMetricsAfter, perDepMetricsBefore, selectedPerDepMetric, hasBeenNormalized }: SideBarProps) {
    return (
<aside>
    <SegmentedControl
        id="select-sidebar"
        options={[
            {
                label: "Metrics",
                value: "metrics",
            },
            {
                label: "Anomalies",
                value: "anomalies",
            }
        ]}
        defaultValue={showMetrics ? "metrics" : "anomalies"}
        disabled={!loadedScenario}
        fill={true}
        onValueChange={(val) => setShowMetrics(val === "metrics")}
    />
    <div id="metrics" hidden={!loadedScenario || !showMetrics} style={{paddingTop: "20px"}}>
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
                     //   console.log(perGraphMetricsGraphData)
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
            height={280}
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

                                if (menuItems.length > 0) {
                                    return <Menu ulRef={itemsParentRef}>{menuItems}</Menu>;
                                }
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
                    height={280}
                />
            </div>
        </div>

    </div>
    <div id="anomalies" hidden={!loadedScenario || showMetrics}  style={{paddingTop: "20px"}}>
        <p>The dependencies listed below lead to anomalies.</p>
        <p>Before normalization:</p>
        {perDepMetricsBefore.filter((m)=>m.metrics.MaxRedPot!=1||m.metrics.AvgRedPot!=1||m.metrics.Minimality!=1).length==0 ?
            <ul><li><i>No anomalies present.</i></li></ul> :
        <ul>
            {perDepMetricsBefore.filter((m)=>m.metrics.MaxRedPot!=1||m.metrics.AvgRedPot!=1||m.metrics.Minimality!=1).map((m)=><li key={`anomalyBefore${m.name}`}>{m.name}</li>)}
        </ul>
        }

        <div hidden={!hasBeenNormalized}>
            <p>After normalization:</p>
        {perDepMetricsAfter.filter((m)=>m.metrics.MaxRedPot!=1||m.metrics.AvgRedPot!=1||m.metrics.Minimality!=1).length==0 ?
            <ul><li><i>No anomalies present.</i></li></ul> :
            <ul>
                {perDepMetricsAfter.filter((m)=>m.metrics.MaxRedPot!=1||m.metrics.AvgRedPot!=1||m.metrics.Minimality!=1).map((m)=><li key={`anomalyBefore${m.name}`}>{m.name}</li>)}
            </ul>
        }
        </div>
        {console.log(perDepMetricsBefore.concat(perDepMetricsAfter))}
    </div>
</aside>);}