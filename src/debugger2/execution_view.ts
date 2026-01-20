import util from "node:util";
import {execute_op} from "../bytecode.ts";
import type {AppState, ViewOutput} from "./model.ts";
import {BoxFrame} from "./util.ts";
import {type Ast, AstToString} from "../ast.ts";
import {VMState} from "../obj.ts";

export type View<S> = {
    input:(key:string, state:S)=>void,
    render:(state:S)=>ViewOutput,
}

export class ExecutionState {
    private vm: VMState;
    accept_input: boolean;
    current_input: string;
    constructor(vm:VMState) {
        this.vm = vm;
        this.accept_input = false
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
    state.messages.push(`${name} : ${val}`)
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


const INPUT:View<AppState> = {
    input:(key,state) => {
        if(key.charCodeAt(0) === 13) {
            state.execution.accept_input = false
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

export function ExecutionViewInput(key: string, state: AppState) {
    if (key === ' ') {
        step(state)
    }
    if (key === 'r') {
        // run
        state.vm.running = true
        run(state)
    }
    if(state.execution.accept_input) {
        INPUT.input(key,state)
    }
    if (key === 'g') {
        state.execution.accept_input = true
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
    return output
}

export function ExecutionViewRender(state: AppState):ViewOutput {
    let output = new BoxFrame({
        name:"Execution",
        width: state.width,
        active: state.mode === 'execution'
    })
    output.addLine('space:step r:run')

    output.addAll(ConsoleViewRender(state))

    output.addLine(`menu: q:quit c:context s:stack b:bytecode e:execution `)
    output.addLine(`${state.mode}`)
    output.addLine(`${state.code.trim()}`)
    if(state.execution.accept_input) {
        output.addAll(INPUT.render(state))
    }
    return output.render()
}
