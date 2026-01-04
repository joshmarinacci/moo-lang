import {type ByteCode, type ByteOp, type Context, Obj, STStack} from "../obj.ts";
import {l, type Mode} from "./model.ts";

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

export function print_bytecode_view(bytecode_state: BytecodeState, ctx:Context, active_mode:Mode) {
    if(active_mode === 'bytecode') {
        l("======= bytecode =======")
    } else {
        l('------- bytecode -------')
    }
    bytecode_state.bytecode.forEach((op,n)=>{
        let prefix = '    ';
        if(n == bytecode_state.selected_index) {
            prefix = '  * '
        }
        l(`${prefix}${op[0]} ${op[1]}`)
    })
}
