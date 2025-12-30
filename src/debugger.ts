import readline, {Interface} from "node:readline/promises"
import util from "node:util"
import {type ByteCode, type ByteOp, type Context, compile_bytecode, execute_op, perform_dispatch} from "./bytecode.ts";
import {parse} from "./parser.ts";
import {Obj, ObjectProto} from "./obj.ts";
import {make_standard_scope} from "./standard.ts";
import {NumObj} from "./number.ts";
import {ActivationObj} from "./block.ts";

type Options = {
    code:string
    step:boolean
}


function handle_args():Options {

    let {values, positionals} = util.parseArgs({
        options: {
            code: {
                type: 'string'
            },
            step: {
                type:'boolean',
                default: false,
            }
        }
    })
    // console.log('values', values)
    // console.log("foo is", values)
    // console.log('positionals', positionals)
    return values as Options
}

const log = (...args:unknown[]) => console.log('LOG',...args)

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const GREEN_BOLD = '\x1b[1;32m'
const BLUE_BOLD = '\x1b[1;34m'
const RESET = '\x1b[0m'; // Resets all attributes


function print_menu(inter: Interface, opts: Options) {
    inter.write(`${RED}input is: ${RESET}` + opts.code+'\n')
    inter.write(`commands: quit, step, run\n`)
}

function print_state(inter: OutputWrapper, opts: Options, ctx:Context) {
    // inter.write(`${GREEN_BOLD}===== stack =====${RESET}\n`)
    inter.header('===== scope =====')
    let scope:Obj | null = ctx.scope
    let indent = " "
    while(scope !== null) {
        inter.write(indent+" " + scope.print() + "\n")
        inter.write(`${indent} - `)
        for(let key of scope._method_slots.keys()) {
            inter.write(key)
            inter.write(' ')
        }
        inter.write('\n')
        // scope = scope.parent
        scope = null
        indent += "  "
    }
    inter.header('===== stack =====')
    for(let obj of ctx.stack) {
        inter.write(`${obj.print()}\n`)
    }
    inter.header('===== bytecode =======')
    ctx.bytecode.forEach((op, i)=> {
        let cursor = i == ctx.pc ? '*':' '
        inter.write(`${cursor} ${i} ${util.inspect(op,{depth:1})}\n`)
    })
    inter.footer('=======================')
}

function step(inter: Interface, opts: Options, ctx:Context):void {
    if(ctx.pc >= ctx.bytecode.length) {
        console.log("we are done")
        ctx.running = false
        return
    }
    let op = ctx.bytecode[ctx.pc]
    inter.write("executing " + util.inspect(op) +"\n")
    let ret = execute_op(op, ctx.stack, ctx.scope, ctx)
    inter.write("returned " + ret.print() + "\n")
}

class OutputWrapper  {
    private inter: Interface;
    constructor(inter: Interface) {
        this.inter = inter
    }

    write(s: string) {
        this.inter.write(s)
    }

    header(s: string) {
        this.inter.write(`${GREEN_BOLD}${s}${RESET}\n`)
    }
    footer(s: string) {
        this.inter.write(`${BLUE_BOLD}${s}${RESET}\n`)
    }

    separator() {
        this.inter.write(`\n\n${BLUE_BOLD}${'#'.repeat(20)}${RESET}\n`)
    }
}

async function do_loop(opts: Options) {
    let inter = readline.createInterface({
        input:process.stdin,
        output:process.stdout
    })
    let ctx:Context = {
        scope: make_standard_scope(),
        bytecode: compile_bytecode(parse(opts.code,'BlockBody')),
        pc: 0,
        stack: [],
        running:true
    }
    if(opts.step) {
        ctx.running = false
    }
    let out = new OutputWrapper(inter)
    while (true) {
        out.separator()
        print_state(out,opts,ctx)
        print_menu(inter, opts)
        if(ctx.running) {
            step(inter,opts,ctx)
        } else {
            let answer = await inter.question("step...")
            if(answer === 'step' || answer === undefined || answer.trim().length === 0) {
                step(inter,opts,ctx)
            }
            if(answer === 'run') {
                ctx.running = true
            }
            if(answer === 'quit') {
                inter.close()
                break;
            }
        }
    }
}

let opts = handle_args();
await do_loop(opts)
