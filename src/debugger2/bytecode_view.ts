import {type ByteCode, type ByteOp, type Context} from "../obj.ts";
import {type AppState, type KeyHandler, type Mode, type ViewOutput} from "./model.ts";
import {BoxFrame, Header} from "./util.ts";

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

export function BytecodeViewInput(key:string, bytecode_state:BytecodeState) {
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


export function BytecodeViewRender(state:AppState):ViewOutput {
    let output = new BoxFrame({
        name:"bytecode",
        width: state.width,
        active:state.mode==='bytecode'
    })
    state.bytecode.bytecode.forEach((op,n)=>{
        let sel = ' '
        if(n == state.bytecode.selected_index) {
            sel = '*'
        }
        let active = ' '
        if(n === state.ctx.pc) {
            active = '#'
        }
        output.addLine(`  ${sel} ${active} ${op[0]} ${op[1]}`)
    })
    return output.render()
}
