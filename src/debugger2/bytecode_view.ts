import {type ByteCode, type ByteOp, type Context, VMState} from "../obj.ts";
import {type AppState, type KeyHandler, type Mode, type ViewOutput} from "./model.ts";
import {BoxFrame, Glyphs, Header} from "./util.ts";
import {type Ast, AstToString} from "../ast.ts";

export class BytecodeState {
    selected_index: number;
    private vm: VMState;
    constructor(vm:VMState) {
        this.vm = vm
        this.selected_index = 0
    }

    nav_next_item() {
        this.selected_index = Math.min(this.selected_index+1,this.vm.currentContext.bytecode.length-1)
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
    output.addLine('label: ' + state.vm.currentContext.label)
    let len = state.vm.currentContext.bytecode.length
    state.vm.currentContext.bytecode.forEach((op,n)=>{
        if(len > 10) {
            if (n < state.vm.currentContext.pc - 5) {
                return
            }
            if(n > state.vm.currentContext.pc+5 && n > 10) {
                return
            }
        }
        let sel = ' '
        if(n == state.bytecode.selected_index) {
            sel = Glyphs.right_triangle
        }
        let active = ' '
        if(n === state.vm.currentContext.pc) {
            active = Glyphs.black_circle
        }
        let name = op[0]
        let value = op[1]
        // @ts-ignore
        if(value && value.type == 'block-literal') {
            value = AstToString(value as Ast)
        }
        output.addLine(`  ${sel} ${active} ${n.toString().padStart(2,'0')} ${name}: ${value}`)
    })
    return output.render()
}
