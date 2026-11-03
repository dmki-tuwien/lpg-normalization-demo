'use client'
import {
    Button, Dialog, DialogBody, DialogFooter,
} from "@blueprintjs/core";
import {useEffect, useRef} from "react";


interface LogDialogProps {
    logs: string,
    shown: boolean,
    setShown: (val: boolean) => void,
}

/**
 * Renders the log dialog
 * @param {string[]} logs List of log entries as strings
 * @param {boolean} shown Whether the dialog is shown or not
 * @param {Function} setShown Callback function for setting the shown param
 */
export default function LogDialog({ logs, shown, setShown }: LogDialogProps) {
    const logContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }, [logs, shown]);
    
    return (
        <Dialog title="Logs"   style={{ width: "70vw", height: "70vh" }}
                icon="history" isOpen={shown} onClose={() => setShown(false)}>
            <DialogBody><div
                ref={logContainerRef}

                style={{
                   // backgroundColor: "#1e1e1e",
                  //  color: "#d4d4d4",
                  //  padding: "12px",
                 //   borderRadius: "6px",
                    height: "100%",
                    overflowY: "auto",
                //    whiteSpace: "pre-wrap",
                   // fontSize: "13px",
                 //   lineHeight: "1.5",
                }}
            >   {logs.length === 0 ? (
                "No action has been performed yet."
            ) : (

                logs.map((log, index) => <div style={{fontFamily: "monospace", marginBottom: "1ex"}} key={index}>{log}</div>)
            )}
                <div ref={bottomRef} />
            </div>
            </DialogBody>
            <DialogFooter actions={<Button intent="primary" text="Close" onClick={()=> setShown(false)} />} />
        </Dialog>
    );
}