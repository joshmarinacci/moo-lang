import {Obj, VMState} from "../obj.ts";
import type {AppState, KeyHandler, ViewOutput} from "./model.ts";
import {BoxFrame, Glyphs} from "./util.ts";

export class ContextState {
    private vm: VMState;
    selected_index: number;
    selected_item : Obj|null
    constructor(vm:VMState) {
        this.vm = vm
        this.selected_index = 0
        this.selected_item = null
    }
    nav_next_item() {
        this.selected_index += 1
        let len = this.scope_chain().length
        if(this.selected_index >= len -1) {
            this.selected_index = len -1
        }
    }
    nav_prev_item() {
        this.selected_index -= 1
        if(this.selected_index < 0) this.selected_index = 0
    }
    select_item() {
        let item = this.scope_chain()[this.selected_index]
        if(this.selected_item === item) {
            this.selected_item = null
        } else {
            this.selected_item = item
        }
    }

    scope_chain() {
        let chain:Array<Obj> = []
        let scope:Obj|null = this.vm.currentContext.scope;
        while(scope != null) {
            chain.push(scope)
            scope = scope.parent
        }
        return chain
    }
}

export function ContextViewInput(key:string, state:ContextState) {
    const stack_bindings: Record<string, KeyHandler> = {
        'j': () => state.nav_next_item(),
        'k': () => state.nav_prev_item(),
        '\r': () => state.select_item(),
        '\u001b[A': () => state.nav_prev_item(),
        '\u001b[B': () => state.nav_next_item(),
    }
    if(key in stack_bindings) {
        stack_bindings[key]()
    }
}

export function ContextViewRender(state:AppState):ViewOutput {
    let output = new BoxFrame({
        name:'Context / Scope',
        width:state.width,
        active:state.mode === 'scope'
    })

    let chain = state.scope.scope_chain();
    chain.forEach((scope,n) => {
        let dot = " "
        if(n === state.scope.selected_index) {
            dot = Glyphs.right_triangle
            if (state.scope.selected_item !== null) {
                dot = Glyphs.down_triangle
            }
        }
        output.addLine(` ${dot} ${scope.print()}`)

        if(scope == state.scope.selected_item) {
            scope._list_slot_names().forEach((name,n) => {
                let val = state.vm.currentContext.scope.lookup_slot(name) as object;
                if(val instanceof Obj) {
                    output.addLine(`      ${name} : ${val.print()}`);
                } else {
                    output.addLine(`      ${name} : ${typeof val} ${val}`)
                }
            })
        }
    })

    return output.render()
}
