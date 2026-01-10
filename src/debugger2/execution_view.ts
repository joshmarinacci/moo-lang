import util from "node:util";
import {execute_op} from "../bytecode.ts";
import type {AppState, ViewOutput} from "./model.ts";
import {BoxFrame, Header} from "./util.ts";
import {type Ast, AstToString} from "../ast.ts";

function step(state:AppState) {
    if (state.ctx.pc >= state.ctx.bytecode.length) {
        state.messages.push('we are done')
        state.ctx.running = false
        return
    }
    let op = state.ctx.bytecode[state.ctx.pc]
    let arg = op[1]
    let name = op[0]
    let val = util.inspect(arg,{depth:1})
    if(arg && 'block-literal' == arg.type) {
        val = AstToString(arg as Ast)
    }
    state.messages.push(`${name} : ${val}`)
    let ret = execute_op(op, state.ctx)
}
export function run(state:AppState) {
    while(state.ctx.running) {
        step(state)
    }
}

export function ExecutionViewInput(key: string, state: AppState) {
    if (key === ' ') {
        step(state)
    }
    if (key === 'r') {
        // run
        state.ctx.running = true
        run(state)
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
    return output.render()
}
