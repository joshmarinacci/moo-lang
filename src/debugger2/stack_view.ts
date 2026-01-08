import {type Context, Obj, STStack} from "../obj.ts";
import {type AppState, type KeyHandler, type Mode, type ViewOutput} from "./model.ts";
import {BoxFrame, Glyphs} from "./util.ts";

export class StackState  {
    selected_index: number;
    selected_item : Obj|null
    private ctx: Context;
    constructor(ctx:Context) {
        this.ctx = ctx
        this.selected_index = 0
        this.selected_item = null
    }

    nav_next_item() {
        this.selected_index += 1
        if(this.selected_index >= this.ctx.stack.size() -1) {
            this.selected_index = this.ctx.stack.size()-1
        }
    }

    nav_prev_item() {
        this.selected_index -= 1
        if(this.selected_index < 0) this.selected_index = 0
    }

    select_item() {
        let item = this.ctx.stack.items()[this.selected_index][0];
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
export function StackViewRender(state:AppState):ViewOutput {
    let output = new BoxFrame({
        name:'Stack',
        width:state.width,
        active:state.mode === 'stack'
    })
    state.ctx.stack.items().forEach(([item,label], n) => {
        let dot = (n === state.stack.selected_index)?Glyphs.right_triangle:" "
        let max_len = state.width - 6
        let name = item.print().padEnd(20)
        let str = `${name} | ${label}`
        if(str.length > max_len) {
            str = str.substring(0,max_len)
        }
        output.addLine(`${dot} ${str}`)
    })
    if(state.stack.selected_item instanceof Obj) {
        let obj = state.stack.selected_item as Obj
        // method slot names
        obj._list_slot_names().forEach((str,index) => {
            output.addLine(`    m: ${str}`)
        })
        // data slot names
        for(let key of obj._data_slots.keys()) {
            output.addLine(`    d: ${key}`)
        }
        if(obj.parent) {
            obj.parent._list_slot_names().forEach((str,index) => {
                output.addLine(`      m: ${str}`)
            })
            for(let key of obj.parent._data_slots.keys()) {
                output.addLine(`    d: ${key}`)
            }
        }
    }
    return output.render()
}

