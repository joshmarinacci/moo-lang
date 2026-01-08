import process from "node:process";
import type {ViewOutput} from "./model.ts";
import {styleText} from "node:util";

export const Glyphs = {
    right_triangle: '▶',
    left_triangle:'◀',
    down_triangle:'▼',
    up_triangle:'▲',
    black_circle:'●'
}

const Colors = {
    red:31,
    green:32,
}
const Attributes = {
    off:0,
    bold:1,
    italic:3,
    reverse:7,
    plain:10,
}


const RED = `\x1b[${Colors.red}m`
const GREEN = `\x1b[${Colors.green}m`;
const PLAIN = `\x1b[${Attributes.plain}m`;
const BOLD = `\x1b[${Attributes.bold}m`
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
    attribute: PLAIN,
    border: stringToBorder('+-+| |+-+')
}
STYLE.border = stringToBorder('┌─╮│ │╰─┘')

function styleIt(style: Style, text: string) {
    return `${style.attribute}${text}${RESET}`
}

export class BoxFrame {
    private readonly width: number;
    private readonly name: string;
    private readonly active: boolean;
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
                ... STYLE,
                attribute:BOLD,
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
        output.push(styleIt(style,header))
        this.content.forEach((str, n) => {
            if(str.length > this.width - 3) {
                str = str.substring(0,this.width-7) + '...'
            }
            let pad = Math.max(this.width - str.length - 3,0)
            output.push(`${style.attribute}${style.border.Left} ${str} ${' '.repeat(pad)}${style.border.Right}${RESET}`)
        })
        let footer = `${style.border.BottomLeft}${style.border.Bottom.repeat(this.width-1)}${style.border.BottomRight}`
        output.push(`${style.attribute}${footer}${RESET}`)
        return output
    }
}