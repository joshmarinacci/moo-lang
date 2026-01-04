import {type ByteCode, type ByteOp, type Context} from "../obj.ts";
import {type KeyHandler, type Mode, type ViewOutput} from "./model.ts";

export class BytecodeState {
    bytecode: ByteCode;
    selected_index: number;
    constructor(bytecode: Array<ByteOp>) {
        this.bytecode = bytecode
        this.selected_index = 0
    }

    nav_next_item() {
        this.selected_index = Math.min(this.selected_index+1,this.bytecode.length-1)
    }

    nav_prev_item() {
        this.selected_index = Math.max(this.selected_index-1,0)
    }
}

export function handle_bytecode_input(key:string, bytecode_state:BytecodeState) {
    const bytecode_bindings:Record<string, KeyHandler> = {
        'j':() => {
            bytecode_state.nav_next_item()
        },
        'k':() => {
            bytecode_state.nav_prev_item()
        },
    }
    if(key in bytecode_bindings) {
        bytecode_bindings[key]()
    }
}


export function render_bytecode_view(bytecode_state: BytecodeState, ctx:Context, active_mode:Mode):ViewOutput {
    let output = []
    if(active_mode === 'bytecode') {
        output.push("======= bytecode =======")
    } else {
        output.push('------- bytecode -------')
    }
    bytecode_state.bytecode.forEach((op,n)=>{
        let prefix = '    ';
        if(n == bytecode_state.selected_index) {
            prefix = '  * '
        }
        output.push(`${prefix}${op[0]} ${op[1]}`)
    })
    return output
}
