import {useState} from "react";

export function prettyDep(text: string): string {
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

export interface Dependency {
    name: string;
    category: string;
    metrics: {[key: string]: number};
}
