import process from "node:process"
import fs from "node:fs/promises"
import {make_standard_scope} from "./standard.ts";
import {Obj, VMState} from "./obj.ts";
import {compile_bytecode} from "./bytecode.ts";
import {parse} from "./parser.ts";
import {BytecodeState, BytecodeViewInput, BytecodeViewRender} from "./debugger2/bytecode_view.ts";
import {type AppState, type KeyHandler, type ViewOutput} from "./debugger2/model.ts";
import {StackState, StackViewInput, StackViewRender} from "./debugger2/stack_view.ts";
import {clear_screen} from "./debugger2/util.ts";
import {ExecutionViewInput, ExecutionViewRender, run} from "./debugger2/execution_view.ts";
import util from "node:util";
import {ContextState, ContextViewInput, ContextViewRender} from "./debugger2/context_view.ts";

type Options = {
    code:string,
    input:string,
    run:boolean,
    exit:boolean,
}

function handle_args():Options {
    let {values, positionals} = util.parseArgs({
        options: {
            code: {
                type: 'string'
            },
            step: {
                type: 'boolean',
                default: false,
            },
            run: {
                type: 'boolean',
                default: false,
            },
            exit: {
                type: 'boolean',
                default: false,
            },
            input: {
                type: 'string',
                default: '',
            }
        }
    })
    return values as Options
}

let options = handle_args()

function validateOptions(options: Options) {
    if(!options.code && !options.input) {
        console.error("Must specify --code <some code> or --input <input file>")
        process.exit()
    }
}

validateOptions(options)

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");


let example_code = `4 + 5`

if(options.code){
    example_code = options.code
}
if(options.input) {
    example_code = await fs.readFile(options.input,{encoding:"utf-8"})
}
let bytecode =  compile_bytecode(parse(example_code,'BlockBody'))

let scope = new Obj("Temp Context",make_standard_scope(),{})
let vm = new VMState(scope,bytecode);
if(options.run){
    vm.running = true
} else {
    vm.running = false
}

const state:AppState = {
    mode:"execution",
    vm:vm,
    scope:new ContextState(vm),
    stack:new StackState(vm),
    bytecode:new BytecodeState(vm),
    messages:[],
    width: 70,
    code:example_code
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
    'e': () => state.mode = 'execution',
    'c':() => state.mode = 'scope',
}

function draw(output:ViewOutput) {
    console.log(output.join("\n"))
}


function redraw() {
    clear_screen()
    draw(ContextViewRender(state))
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
    if(state.mode === 'scope') {
        ContextViewInput(key,state.scope)
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
if(state.vm.running) {
    run(state)
    if(options.exit) {
        console.log(state.vm.currentContext.stack.pop().print())
        process.exit(0)
    }
}
redraw()
