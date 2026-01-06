import type {Context} from "../obj.ts";
import {StackState} from "./stack_view.ts";
import {BytecodeState} from "./bytecode_view.ts";
import {ContextState} from "./scope_view.ts";

export type Mode = 'bytecode'|'execution'|'stack'|'scope'
export type KeyHandler = () => void;

export type ViewOutput = Array<string>
export type AppState = {
    messages: Array<string>;
    mode: Mode,
    ctx: Context,
    stack: StackState,
    bytecode: BytecodeState,
    scope: ContextState,
    width: number,
    code:string,
}