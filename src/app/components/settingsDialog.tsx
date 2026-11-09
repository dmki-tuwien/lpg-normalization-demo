'use client';

import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter, FormGroup, InputGroup, Label,
    Section, Switch,

} from "@blueprintjs/core";
import { STRINGS } from "../strings";

interface SettingsDialogProps {
    useLLMs: boolean;
    setUseLLMs: (val: boolean) => void;
    llmAPIKey: string;
    setLlmAPIKey: (val: string) => void;
    llmAPIModel: string;
    setLlmAPIModel: (val: string) => void;
    llmApiEndpointUrl: string;
    setLLMAPIEndpointUrl: (val: string) => void;
    shown: boolean;
    setShown: (val: boolean) => void;
}


export default function SettingsDialog({ useLLMs, setUseLLMs, llmAPIKey, setLlmAPIKey, llmAPIModel, setLlmAPIModel, llmApiEndpointUrl, setLLMAPIEndpointUrl, shown, setShown }: SettingsDialogProps) {
    return (
        <Dialog
            title={STRINGS.settings.dialogTitle}
            style={{ width: "500px", height: "350px" }}
            icon="history"
            isOpen={shown}
            onClose={() => setShown(false)}
        >
            <DialogBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <Section title={
                    <div style={{marginBottom: "-10px", marginLeft: "-10px"}}><Switch id={"useLLms"} onChange={()=>setUseLLMs(!useLLMs)} defaultChecked={useLLMs}>{STRINGS.settings.useLLMs}</Switch></div>
                }>
                    <div style={{margin: "10px"}}>
                        <FormGroup>
                            <Label>{STRINGS.settings.llmApiEndpoint}
                                <InputGroup disabled={!useLLMs} defaultValue={llmApiEndpointUrl} onValueChange={(val)=>setLLMAPIEndpointUrl(val)}></InputGroup>
                            </Label>
                            <Label>{STRINGS.settings.llmApiModel}
                                <InputGroup disabled={!useLLMs} defaultValue={llmAPIModel} onValueChange={(val)=>setLlmAPIModel(val)}></InputGroup>
                            </Label>
                            <Label>{STRINGS.settings.llmApiToken}
                                <InputGroup type={"password"} disabled={!useLLMs} defaultValue={llmAPIKey} onValueChange={(val)=>setLlmAPIKey(val)}></InputGroup>
                            </Label>
                        </FormGroup>
                    </div>
                </Section>
            </DialogBody>
            <DialogFooter
                actions={<Button intent="primary" text={STRINGS.settings.dialogClose} onClick={() => setShown(false)} />}
            />
        </Dialog>
    );
}