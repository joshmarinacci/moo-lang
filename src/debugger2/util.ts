import process from "node:process";
import type {ViewOutput} from "./model.ts";

const RED = '\x1b[31m'
const BLACK = '\x1b[30m'
const BLACK_BOLD = '\x1b[1;30m'
const RED_BOLD = '\x1b[1;31m'
const GREEN = '\x1b[32m';
const GREEN_BOLD = '\x1b[1;32m'
const RESET = '\x1b[0m'; // Resets all attributes

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

type Border = {
    TopLeft:string,
    Top:string,
    TopRight:string,
    Left:string,
    Center:string,
    Right:string,
    BottomLeft:string,
    Bottom:string,
    BottomRight:string,
}
type Style = {
    attribute:string,
    border: Border
}

function stringToBorder(str:string):Border {
    return {
        TopLeft: str[0],
        Top: str[1],
        TopRight: str[2],
        Left: str[3],
        Center: str[4],
        Right: str[5],
        BottomLeft: str[6],
        Bottom: str[7],
        BottomRight: str[8]
    }
}

const STYLE:Style = {
    attribute: BLACK,
    border: stringToBorder('+-+| |+-+')
}

STYLE.border = stringToBorder('┌─┐│ │└─┘')

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
        let style = STYLE
        if (this.active) {
            style = {
                attribute:BLACK_BOLD,
                border:STYLE.border
            }
        }

        let margin = Math.floor((this.width - this.name.length - 3) / 2)
        let right_pad = 0
        if(this.name.length % 2 == 0) {
            right_pad +=1
        }
        let header = style.border.TopLeft
            + style.border.Top.repeat(margin)
            + ' ' + this.name + ' '
            +style.border.Top.repeat(margin+right_pad)
            + style.border.TopRight
        output.push(`${style.attribute}${header}${RESET}`)
        this.content.forEach((str, n) => {
            let pad = Math.max(this.width - str.length - 3,0)
            output.push(`${style.attribute}${style.border.Left} ${str} ${' '.repeat(pad)}${style.border.Right}${RESET}`)
        })
        let footer = `${style.border.BottomLeft}${style.border.Bottom.repeat(this.width-1)}${style.border.BottomRight}`
        output.push(`${style.attribute}${footer}${RESET}`)
        return output
    }
}