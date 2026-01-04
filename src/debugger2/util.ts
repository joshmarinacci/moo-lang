import process from "node:process";
import type {ViewOutput} from "./model.ts";

export function clear_screen() {
    process.stdout.write("\x1Bc");
}

export function Header(stack: string, bold: boolean) {
    let ch = '-'
    if (bold) ch = '='
    return [
        `${ch.repeat(5)} ${stack} ${ch.repeat(5)}`
    ];
}

export class BoxFrame {
    private width: number;
    private name: string;
    private active: boolean;
    private content: string[];

    constructor(opts: { name: string; width: number; active: boolean }) {
        this.width = opts.width
        this.name = opts.name
        this.active = opts.active
        this.content = []
    }

    addLine(str: string) {
        this.content.push(str)
    }

    addAll(content: ViewOutput) {
        this.content.push(...content)
    }

    render(): ViewOutput {
        let output = []
        let ch = '-'
        if (this.active) {
            ch = '='
        }
        let margin = Math.floor((this.width - this.name.length - 2) / 2)
        let header = '+' + ch.repeat(margin) + ' ' + this.name + ' ' + ch.repeat(margin) + '+'
        output.push(header)
        let border = '|'
        if (this.active) {
            border = '!'
        }
        this.content.forEach((str, n) => {
            let len = str.length
            let pad = Math.max(this.width - str.length - 3,0)

            output.push(`${border} ${str} ${' '.repeat(pad)}${border}`)
        })
        let footer = '+' + ch.repeat(this.width - 1) + '+'
        output.push(footer)
        return output
    }
}