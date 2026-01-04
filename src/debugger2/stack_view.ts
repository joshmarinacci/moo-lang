import {compile_bytecode} from "../bytecode.ts";
import {parse} from "../parser.ts";
import {type Context, Obj, STStack} from "../obj.ts";
import {make_standard_scope} from "../standard.ts";
import {NumObj} from "../number.ts";
import {BytecodeState, render_bytecode_view} from "./bytecode_view.ts";
import process from "node:process";
import {type KeyHandler, type Mode, type ViewOutput} from "./model.ts";
import {l} from "./model.ts";

export class StackState {
    stack: STStack;
    selected_index: number;
    selected_item : Obj|null
    constructor(stack: STStack) {
        this.stack = stack
        this.selected_index = 0
        this.selected_item = null
    }

    nav_next_item() {
        this.selected_index += 1
        if(this.selected_index >= this.stack.size() -1) {
            this.selected_index = this.stack.size()-1
        }
    }

    nav_prev_item() {
        this.selected_index -= 1
        if(this.selected_index < 0) this.selected_index = 0
    }

    select_item() {
        this.selected_item = this.stack.items()[this.selected_index][0];
    }
}

export function print_stack_view(stack_state:StackState, ctx: Context, active_mode:Mode):ViewOutput {
    let output = []
    if(active_mode === 'stack') {
        output.push("======= stack =======")
    } else {
        output.push('------- stack -------')
    }
    stack_state.stack.items().forEach(([item,label], n) => {
        let dot = (n === stack_state.selected_index)?"*":" "
        output.push(`  ${dot} ${item.print()} ${label}`)
    })
    if(stack_state.selected_item instanceof Obj) {
        let obj = stack_state.selected_item as Obj
        obj._list_slot_names().forEach((str,index) => {
            output.push(`    ${str}`)
        })
        if(obj.parent) {
            obj.parent._list_slot_names().forEach((str,index) => {
                output.push(`       ${str}`)
            })
        }
    }
    return output
}

export function handle_stackview_input(key:string, stack_state:StackState) {
    const stack_bindings: Record<string, KeyHandler> = {
        'j': () => {
            stack_state.nav_next_item()
        },
        'k': () => {
            stack_state.nav_prev_item()
        },
        '\r': () => {
            stack_state.select_item()
        },
        '\u001b[A': () => {
            stack_state.nav_prev_item()
        },
        '\u001b[B': () => {
            stack_state.nav_next_item()
        },
        // '\u001b[D': () => {
        //     stack_state.nav_up_target()
        // }
    }
    if(key in stack_bindings) {
        stack_bindings[key]()
    }
}
