import process from "node:process"
import {make_standard_scope} from "./standard.ts";
import {type Context, STStack} from "./obj.ts";
import {compile_bytecode, execute_op} from "./bytecode.ts";
import {parse} from "./parser.ts";
import {NumObj} from "./number.ts";
import {BytecodeState, BytecodeViewInput, BytecodeViewRender} from "./debugger2/bytecode_view.ts";
import {type KeyHandler, type Mode, type ViewOutput} from "./debugger2/model.ts";
import {StackViewInput, StackViewRender, StackState} from "./debugger2/stack_view.ts";
import {clear_screen, Header} from "./debugger2/util.ts";
import util from "node:util";

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

let example_code = '4+5'
let bytecode =  compile_bytecode(parse(example_code,'BlockBody'))

let ctx:Context = {
    scope: make_standard_scope(),
    bytecode: bytecode,
    pc: 0,
    stack: new STStack(),
    running:false
}
ctx.stack.push_with(NumObj(5),'argument')
ctx.stack.push_with(NumObj(4),'argument')

type AppState = {
    messages: Array<string>;
    mode:Mode,
    ctx:Context,
    stack:StackState,
    bytecode:BytecodeState
}

const state:AppState = {
    mode:"bytecode",
    ctx:ctx,
    stack:new StackState(ctx.stack),
    bytecode:new BytecodeState(ctx.bytecode),
    messages:[]
}


const key_bindings:Record<string,KeyHandler> = {
    'q': () => {
        process.exit()
    },
    's': () => {
        state.mode = 'stack'
    },
    'b': () => {
        state.mode = 'bytecode'
    },
    'e': () => {
        state.mode = 'execution'
    }
}

function draw(output:ViewOutput) {
    console.log(output.map(l => l + '\n').join(""))
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
function ExecutionViewRender(state: AppState):ViewOutput {
    let output = []
    output.push(...Header('execution',state.mode === 'execution'))
    output.push('space:step r:run')

    output.push(...ConsoleViewRender(state))

    output.push('')
    output.push(`menu: q:quit s:stack b:bytecode e:execution `)
    output.push("arrows: nav")
    output.push(`${state.mode}`)
    return output
}
function ExecutionViewInput(key: string, state: AppState) {
    if(key === ' ') {
        if(state.ctx.pc >= state.ctx.bytecode.length) {
            state.messages.push('we are done')
            state.ctx.running = false
            return
        }
        let op = ctx.bytecode[ctx.pc]
        state.messages.push('executing ' + util.inspect(op))
        let ret = execute_op(op, ctx)
    }
    if(key === 'r') {
        // run
    }
}

function redraw() {
    clear_screen()
    draw(StackViewRender(state.stack,state.mode))
    draw(BytecodeViewRender(state.bytecode,state.ctx,state.mode))
    draw(ExecutionViewRender(state))
}


process.stdin.on("data", (key:string) => {
    // Ctrl+C
    if (key === "\u0003") {
        process.exit();
    }
    if(key in key_bindings) {
        key_bindings[key]();
        redraw()
        return
    }
    if(state.mode === 'stack') {
        StackViewInput(key,state.stack)
        redraw()
        return
    }
    if(state.mode === 'bytecode') {
        BytecodeViewInput(key,state.bytecode);
        redraw()
        return
    }
    if(state.mode === 'execution') {
        ExecutionViewInput(key,state)
        redraw()
        return;
    }
    console.log(JSON.stringify(key));
});
function cleanup() {
    process.stdin.setRawMode(false);
    process.stdin.pause();
}
process.on("exit", cleanup);
process.on("SIGINT", () => {
    cleanup();
    process.exit();
});
process.stdout.write("going\n")
redraw()
