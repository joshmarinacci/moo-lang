import process from "node:process";

export function clear_screen() {
    process.stdout.write("\x1Bc");
}