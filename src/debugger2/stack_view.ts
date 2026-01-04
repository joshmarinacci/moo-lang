import {Obj, STStack} from "../obj.ts";
import {type KeyHandler, type Mode, type ViewOutput} from "./model.ts";
import {Header} from "./util.ts";
import {it} from "node:test";

export class StackState  {
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
        let item = this.stack.items()[this.selected_index][0];
        if(this.selected_item === item) {
            this.selected_item = null
        } else {
            this.selected_item = item
        }
    }
}

export function StackViewInput(key:string, stack_state:StackState) {
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
export function StackViewRender(stack_state:StackState, active_mode:Mode):ViewOutput {
    let output = []
    output.push(...Header("stack",active_mode=="stack"))
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

