import util from "node:util";
import {execute_op} from "../bytecode.ts";
import type {AppState, ViewOutput} from "./model.ts";
import {BoxFrame} from "./util.ts";
import {type Ast, AstToString} from "../ast.ts";
import {VMState} from "../obj.ts";
import {type View} from "./view.ts";

export class ExecutionState {
    vm: VMState;
    show_input: boolean;
    current_input: string;
    constructor(vm:VMState) {
        this.vm = vm;
        this.show_input = false
        this.current_input = ""
    }
}

function step(state:AppState) {
    let ctx = state.vm.currentContext;
    if (ctx.pc >= ctx.bytecode.length) {
        state.messages.push('we are done')
        state.vm.running = false
        return
    }
    let op = ctx.bytecode[ctx.pc]
    let arg = op[1]
    let name = op[0]
    let val = util.inspect(arg,{depth:1})
    // @ts-ignore
    if(arg && 'block-literal' == arg.type) {
        val = AstToString(arg as Ast)
    }
    // state.messages.push(`${name} : ${val}`)
    let ret = execute_op(state.vm)
}
export function run(state:AppState) {
    while(state.vm.running) {
        step(state)
    }
}

function runTo(state: AppState, num: number) {
    while(state.vm.currentContext.pc < num) {
        step(state)
    }
}

function skipOver(state: AppState) {
    let target_pc = state.vm.currentContext.pc +1
    let target_label = state.vm.currentContext.label
    while(state.vm.currentContext.pc !== target_pc || state.vm.currentContext.label != target_label) {
        step(state)
    }
}


const INPUT:View<AppState> = {
    input:(key,state) => {
        if(key.charCodeAt(0) === 13) {
            state.execution.show_input = false
            let num = parseInt(state.execution.current_input)
            state.execution.current_input = ""
            runTo(state,num);
        } else {
            state.execution.current_input += key
        }
    },
    render:(state) => {
        let output = []
        output.push('--------')
        output.push("to line: " + state.execution.current_input)
        output.push('--------')
        return output
    }
}
function ConsoleViewRender(state:AppState):ViewOutput {
    let output:ViewOutput = []
    let log = state.messages
    let len = state.messages.length
    if(len > 10) log = log.slice(len-10)
    let max_len = state.width - 4
    log.forEach(msg => {
        msg = msg.replaceAll(/\n/g,'')
        if(msg.length > max_len) {
            msg = msg.substring(0,max_len)
        }
        output.push(' ' + msg)
    })
    let extra = 10 - len
    for(let i=0; i<extra; i++) {
        output.push('  ')
    }
    return output
}

function show_input(state: AppState) {
    state.execution.show_input = true
}

function runToEnd(state: AppState) {
    state.vm.running = true
    run(state)
}


export const EXECUTION:View<AppState> = {
    input: (key, state) => {
        if (key === ' ') return step(state)
        if (key === 'r') return runToEnd(state)
        if (key === 's') return skipOver(state)
        if (state.execution.show_input) return INPUT.input(key, state)
        if (key === 'g') return show_input(state);
    },
    render:(state) => {
        let output = new BoxFrame({
            name:"Execution",
            width: state.width,
            active: state.mode === 'execution'
        })
        output.addLine('space:step r:run g: go s:skip over ')
        output.addAll(ConsoleViewRender(state))
        output.addLine(`menu: q:quit`)
        if(state.execution.show_input) {
            output.addAll(INPUT.render(state))
        }
        return output.render()
    }
}

