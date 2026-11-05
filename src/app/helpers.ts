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