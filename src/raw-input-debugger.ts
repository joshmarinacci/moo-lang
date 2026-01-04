import process from "node:process"
import {make_standard_scope} from "./standard.ts";
import {type Context, STStack} from "./obj.ts";
import {compile_bytecode} from "./bytecode.ts";
import {parse} from "./parser.ts";
import {NumObj} from "./number.ts";
import {BytecodeState, handle_bytecode_input, render_bytecode_view} from "./debugger2/bytecode_view.ts";
import {type KeyHandler, type Mode, type ViewOutput} from "./debugger2/model.ts";
import {handle_stackview_input, print_stack_view, StackState} from "./debugger2/stack_view.ts";
import {clear_screen} from "./debugger2/util.ts";

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
}

function print_menu(state:AppState) {
    console.log(`menu: q:quit s:stack b:bytecode e:execution `)
    console.log("arrows: nav")
    console.log(`${state.mode}`)
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
function redraw() {
    clear_screen()
    draw(print_stack_view(state.stack,ctx, state.mode))
    draw(render_bytecode_view(state.bytecode,ctx,state.mode))
    print_menu(state)
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
        handle_stackview_input(key,state.stack)
        redraw()
        return
    }
    if(state.mode === 'bytecode') {
        handle_bytecode_input(key,state.bytecode);
        redraw()
        return
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
