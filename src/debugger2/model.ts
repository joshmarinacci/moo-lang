import process from "node:process";

export type Mode = 'bytecode'|'execution'|'stack'
export type KeyHandler = () => void;

export const l = (...args:unknown[]) => process.stdout.write(args.join("")+"\n")

export type ViewOutput = Array<string>
