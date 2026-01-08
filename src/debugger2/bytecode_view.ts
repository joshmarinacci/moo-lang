import {type ByteCode, type ByteOp, type Context} from "../obj.ts";
import {type AppState, type KeyHandler, type Mode, type ViewOutput} from "./model.ts";
import {BoxFrame, Glyphs, Header} from "./util.ts";

export class BytecodeState {
    selected_index: number;
    private ctx: Context;
    constructor(ctx:Context) {
        this.ctx = ctx
        this.selected_index = 0
    }

    nav_next_item() {
        this.selected_index = Math.min(this.selected_index+1,this.ctx.bytecode.length-1)
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
        name:"Bytecode",
        width: state.width,
        active:state.mode==='bytecode'
    })
    let len = state.ctx.bytecode.length
    state.ctx.bytecode.forEach((op,n)=>{
        if(len > 10) {
            if (n < state.ctx.pc - 5) {
                return
            }
            if(n > state.ctx.pc+5 && n > 10) {
                return
            }
        }
        let sel = ' '
        if(n == state.bytecode.selected_index) {
            sel = Glyphs.right_triangle
        }
        let active = ' '
        if(n === state.ctx.pc) {
            active = Glyphs.black_circle
        }
        output.addLine(`  ${sel} ${active} ${n.toString().padStart(2,'0')} ${op[0]}: ${op[1]}`)
    })
    return output.render()
}
