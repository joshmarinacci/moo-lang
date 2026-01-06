import {type Context} from "../obj.ts";
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

    console.log("scope is " + state.ctx.scope.print())
    output.addLine(state.ctx.scope.print())
    console.log("scope is " + state.ctx.scope._list_slot_names().join(", "));
    for(let name of state.ctx.scope._list_slot_names()) {
        output.addLine(`   ${name} : ${state.ctx.scope.lookup_slot(name).print()}`);
    }

    return output.render()
}
