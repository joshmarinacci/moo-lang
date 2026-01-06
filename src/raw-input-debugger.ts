import process from "node:process"
import {make_standard_scope} from "./standard.ts";
import {type Context, STStack} from "./obj.ts";
import {compile_bytecode} from "./bytecode.ts";
import {parse} from "./parser.ts";
import {BytecodeState, BytecodeViewInput, BytecodeViewRender} from "./debugger2/bytecode_view.ts";
import {type AppState, type KeyHandler, type ViewOutput} from "./debugger2/model.ts";
import {StackState, StackViewInput, StackViewRender} from "./debugger2/stack_view.ts";
import {clear_screen} from "./debugger2/util.ts";
import {ExecutionViewInput, ExecutionViewRender} from "./debugger2/execution_view.ts";

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

// let example_code = '"abc" do: [ch | ch print. ].'
let example_code = `
    self make_data_slot: 'counter' with:0.
    [self counter < 5] whileTrue: [
         self counter: (self counter + 1).
        self counter.
    ].
    self counter .
`
let bytecode =  compile_bytecode(parse(example_code,'BlockBody'))

let ctx:Context = {
    scope: make_standard_scope(),
    bytecode: bytecode,
    pc: 0,
    stack: new STStack(),
    running:false
}

const state:AppState = {
    mode:"execution",
    ctx:ctx,
    stack:new StackState(ctx),
    bytecode:new BytecodeState(ctx),
    messages:[],
    width: 60,
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
    console.log(output.join("\n"))
}


function redraw() {
    // clear_screen()
    draw(StackViewRender(state))
    draw(BytecodeViewRender(state))
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
