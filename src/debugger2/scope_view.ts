import {type Context, Obj} from "../obj.ts";
import type {AppState, ViewOutput} from "./model.ts";
import {BoxFrame} from "./util.ts";

export class ContextState {
    private ctx: Context;
    constructor(ctx: Context) {
        this.ctx = ctx
    }
}

export function ContextViewInput(key:string, scope_state:ContextState) {
}

export function ContextViewRender(state:AppState):ViewOutput {
    let output = new BoxFrame({
        name:'Context',
        width:state.width,
        active:state.mode === 'scope'
    })

    output.addLine(state.ctx.scope.print())
    for(let name of state.ctx.scope._list_slot_names()) {
        let val = state.ctx.scope.lookup_slot(name);
        if(val instanceof Obj) {
            output.addLine(`   ${name} : ${val.print()}`);
        } else {
            output.addLine(`   ${name} : ${typeof val}`)
        }
    }

    return output.render()
}
