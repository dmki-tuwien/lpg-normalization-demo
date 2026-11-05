'use client';

import {
    Button, Card, Classes,
    Dialog,
    DialogBody,
    DialogFooter, DialogStep, FormGroup, HTMLSelect, Icon, InputGroup, Label, Link, MenuDivider, MultistepDialog,
    Panel,
    Section, SegmentedControl, Switch, TextArea, Tooltip,

} from "@blueprintjs/core";
import { STRINGS } from "../strings";
import Image from "next/image";
import logo from '../../../public/logo.png';
import {prettyDep} from "@/app/helpers";


interface OnboardingDialogProps {
    shown: boolean;
    setShown: (val: boolean) => void;
    database: string;
    setDatabase: (val: string) => void;
    customScenario: boolean;
    setCustomScenario: (val: bool) => void;
    minCov: string[];
    setMinCov: (val: string[]) => void;
    setDependencies: (val: string[]) => void;
    availableScenarios: [];
    setScenario: (val: string) => void;
    scenario: string;
    loadScenario: () => Promise<void>;
}


export default function OnboardingDialog({  shown, setShown, database, setDatabase, customScenario, setCustomScenario, minCov, setMinCov, setDependencies, availableScenarios, setScenario, scenario, loadScenario }: OnboardingDialogProps) {
    const scenariosDropdownOptions = [];
    let lastCategory = "";
    scenariosDropdownOptions.push(
        <option key={"default"} disabled={true} value={"default"} label={"Select a scenario…"}/>
    );
    availableScenarios.forEach((scenario) => {
        if (scenario.category !== lastCategory) {
            scenariosDropdownOptions.push(
                <optgroup label={scenario.category} />
            );
            lastCategory = scenario.category;
        }
        scenariosDropdownOptions.push(
            <option key={scenario.value} label={scenario.label} value={scenario.value}/>
        );
    });

    return (
        <MultistepDialog canOutsideClickClose={false} canEscapeKeyClose={false} isCloseButtonShown={false} isOpen={shown} finalButtonProps={{
            text: "Load scenario",
            intent: "primary",
            icon: "tick",
            onClick: ()=>{setShown(!shown); loadScenario();},
        }}>
            <DialogStep
                id="welcome"
                title={STRINGS.onboarding.welcomeShort}
                panel={
                    <div className={Classes.DIALOG_BODY} style={{ height: "320px"}}>
                        <Card>
                        <div style={{textAlign: "center", marginBottom: 60}}>
                            <Image src={logo} alt={"dd"} height={80}/>
                            <p style={{fontSize: "30px"}}>{STRINGS.onboarding.welcomeLong}</p>
                            <p>ADD DESCRIPTIVE TEXT</p>
                        </div>

                        <Label>{STRINGS.onboarding.graphStoreLabel}
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
                                fill={true}
                                onValueChange={(val) => setDatabase(val)}
                            />
                        </Label>
                        </Card>
                    </div>

                }
            />
            <DialogStep
                id="scenario"
                title={STRINGS.onboarding.scenarioShort}
                panel={
                    <div className={Classes.DIALOG_BODY} style={{ height: "320px" }}>
                        <Card>
                            <FormGroup>
                            <Label>{STRINGS.onboarding.scenarioType} <Link href="https://dmki-tuwien.github.io/grana-grano/methods" target="_blank"> <Icon icon="share" size={12}/> </Link>
                                <SegmentedControl
                                    id={"select-scenario-type"}
                                    options={[
                                        {
                                            label: "Predefined",
                                            value: "predefined",
                                        },
                                        {
                                            label: "Custom",
                                            value: "custom",
                                        },
                                    ]}
                                    defaultValue={!customScenario ? "predefined" : "custom"}
                                    fill={true}
                                    onValueChange={(val) => setCustomScenario(val == "custom")}
                                />
                            </Label>
                            </FormGroup>
                            <FormGroup>
                            {!customScenario ?
                                <div><HTMLSelect fill={true} defaultValue={scenario == "" ? "default" : scenario} onChange={(event) => setScenario(event.currentTarget.value)} placeholder={"Select a scenario…"}>
                                    {scenariosDropdownOptions}
                                </HTMLSelect></div>
                            :
                                <div>
                                    <Label>Cypher statements for loading an LPG
                                <TextArea fill={true}></TextArea>
                                    </Label>

                                </div>
                            }
                            </FormGroup>
                            {(!customScenario && minCov.length != 0) || customScenario ?
                            <FormGroup>
                            <Label>Dependencies
                            <TextArea id={"dependencies"} fill={true} value={minCov.join("\n")} onChange={(e) => {setMinCov(e.currentTarget.value.split("\n")); setDependencies(e.currentTarget.value.split("\n"))}}></TextArea>
                            </Label>
                            </FormGroup> : <span/>
                            }
                        </Card>
                    </div>
                }
            />
            <DialogStep
                id="summary"
                title="Summary"
                panel={
                    <div className={Classes.DIALOG_BODY} style={{ height: "320px" }}>
                        <p>You selected to load
                            {customScenario ? <span> a <b>custom scenario</b></span> : <span> the scenario <b>{availableScenarios.find((s) => s.value === scenario)?.label}</b></span>} into <b>{database == "neo4j" ? "Neo4j" : "Memgraph"}</b>.</p>
                        <p style={{marginTop: "25px"}}>The following <b>dependencies</b> will be considered in the normalization scenario:</p>
                        <ul>
                        {minCov.map((dep, _) => (
                            <li key={dep}>{prettyDep(dep)}</li>
                        ))}
                        </ul>
                    </div>
                }
            />
        </MultistepDialog>
    );
}