'use client';

import React, { useEffect, useRef, useState } from "react";
import {
    Button,
    Dialog,
    DialogBody,
    DialogFooter,
    Menu,
    MenuItem,
    TagInput,
} from "@blueprintjs/core";
import { STRINGS } from "../strings";


interface LogLevel {
    id: string;
    name: string;
}

interface LogDialogProps {
    logs: string[];
    shown: boolean;
    setShown: (val: boolean) => void;
}

const LOG_LEVELS: LogLevel[] = [
    { id: "ERROR", name: "Error" },
    { id: "WARNING", name: "Warning" },
    { id: "INFO", name: "Info" },
    { id: "QUERY", name: "Query" },
];

export default function LogDialog({ logs, shown, setShown }: LogDialogProps) {
    const logContainerRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);


    const [selectedLogLevels, setSelectedLogLevels] = useState<LogLevel[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [filteredLogs, setFilteredLogs] = useState(logs)

    const isSelected = (ll: LogLevel) =>
        selectedLogLevels.some((selected) => selected.id === ll.id);

    const handleItemToggle = (ll: LogLevel) => {
        if (isSelected(ll)) {
            setSelectedLogLevels(selectedLogLevels.filter((item) => item.id !== ll.id));
        } else {
            setSelectedLogLevels([...selectedLogLevels, ll]);
        }
    };

    const handleTagRemove = (_tag: React.ReactNode, index: number) => {
        setSelectedLogLevels(selectedLogLevels.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }, [logs, shown]);

    const filteredLevels = LOG_LEVELS.filter((ll) =>
        ll.name.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        const fl = selectedLogLevels.length === 0
            ? logs
            : logs.filter((log) =>
                selectedLogLevels.some((level) =>
                    log.toUpperCase().includes(level.id.toUpperCase())
                )
            );
        setFilteredLogs(fl)
    }, [logs, selectedLogLevels]);

    return (
        <Dialog
            title={STRINGS.logs.dialogTitle}
            style={{ width: "70vw", height: "70vh" }}
            icon="history"
            isOpen={shown}
            onClose={() => setShown(false)}
        >
            <DialogBody style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Custom Relative Container — Impossible to escape to (0, 0) */}
                <div ref={dropdownRef} style={{ position: "relative", width: "440px", marginBottom: "12px", zIndex: 20 }}>
                    <TagInput
                        fill={true}
                        values={selectedLogLevels.map((ll) => ll.name)}
                        onRemove={handleTagRemove}
                        inputValue={query}
                        onInputChange={(e) => {
                            setQuery(e.currentTarget.value);
                            setIsOpen(true);
                        }}
                        inputProps={{
                            onFocus: () => setIsOpen(true),
                            placeholder: STRINGS.logs.filterPlaceholder,
                        }}
                        rightElement={
                            selectedLogLevels.length > 0 ? (
                                <Button
                                    variant="minimal"
                                    icon="cross"
                                    onClick={() => setSelectedLogLevels([])}
                                />
                            ) : undefined
                        }
                    />

                    {isOpen && (
                        <div
                            style={{
                                position: "absolute",
                                top: "calc(100% + 4px)",
                                left: 0,
                                width: "180px",
                                maxHeight: "220px",
                                overflowY: "auto",
                                backgroundColor: "var(--bp-menu-background-color, #ffffff)",
                                borderRadius: "4px",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                zIndex: 100,
                            }}
                        >
                            <Menu>
                                {filteredLevels.length === 0 ? (
                                    <MenuItem disabled={true} text="No results." />
                                ) : (
                                    filteredLevels.map((ll) => (
                                        <MenuItem
                                            key={ll.id}
                                            icon={isSelected(ll) ? "tick" : "blank"}
                                            text={ll.name}
                                            shouldDismissPopover={false}
                                            onClick={() => handleItemToggle(ll)}
                                        />
                                    ))
                                )}
                            </Menu>
                        </div>
                    )}
                </div>

                <div
                    ref={logContainerRef}
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        minHeight: 0,
                    }}
                >
                    {filteredLogs.length === 0 ? (
                        "No logs available."
                    ) : (
                        filteredLogs.map((log, index) => (
                            <div style={{ fontFamily: "monospace", marginBottom: "1ex" }} key={index}>
                                {log}
                            </div>
                        ))
                    )}
                    <div ref={bottomRef} />
                </div>
            </DialogBody>
            <DialogFooter
                actions={<Button intent="primary" text={STRINGS.logs.dialogClose} onClick={() => setShown(false)} />}
            />
        </Dialog>
    );
}