import process from "node:process";

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