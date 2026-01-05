import util from "node:util";
import {execute_op} from "../bytecode.ts";
import type {AppState, ViewOutput} from "./model.ts";
import {BoxFrame, Header} from "./util.ts";


export function ExecutionViewInput(key: string, state: AppState) {
    if (key === ' ') {
        if (state.ctx.pc >= state.ctx.bytecode.length) {
            state.messages.push('we are done')
            state.ctx.running = false
            return
        }
        let op = state.ctx.bytecode[state.ctx.pc]
        state.messages.push('executing ' + util.inspect(op))
        let ret = execute_op(op, state.ctx)
    }
    if (key === 'r') {
        // run
    }
}

function ConsoleViewRender(state:AppState):ViewOutput {
    let output = []
    output.push('- - - - - - -')
    let log = state.messages
    let len = state.messages.length
    if(len > 10) log = log.slice(len-10)
    log.forEach(msg => {
        output.push(msg)
    })
    output.push('- - - - - - -')
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

    output.addLine('')
    output.addLine(`menu: q:quit s:stack b:bytecode e:execution `)
    output.addLine("arrows: nav")
    output.addLine(`${state.mode}`)
    return output.render()
}
