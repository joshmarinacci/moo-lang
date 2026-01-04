import process from "node:process";

export type Mode = 'bytecode'|'execution'|'stack'

export const l = (...args:unknown[]) => process.stdout.write(args.join("")+"\n")
