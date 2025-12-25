import readline, {Interface} from "node:readline/promises"
import util from "node:util"
import {type ByteOp, compile_bytecode, execute_op} from "./bytecode.ts";
import {parse} from "./parser.ts";
import {Obj} from "./obj.ts";
import {make_standard_scope} from "./standard.ts";

type Options = {
    code:string
}


function handle_args():Options {

    let {values, positionals} = util.parseArgs({
        options: {
            code: {
                type: 'string'
            }
        }
    })
    // console.log('values', values)
    // console.log("foo is", values)
    // console.log('positionals', positionals)
    return values as Options
}

const log = (...args:unknown[]) => console.log('LOG',...args)


function print_menu(inter: Interface, opts: Options) {
    inter.write("input is: " + opts.code+'\n')
    inter.write('commands: quit, step\n')
}

function print_state(inter: Interface, opts: Options, ctx:Context) {
    inter.write("===== stack =====\n")
    for(let obj of ctx.stack) {
        inter.write(`stack: ${obj.print()}\n`)
    }
    inter.write('-- bytecode ---------\n')
    ctx.bytecode.forEach((op, i)=> {
        let cursor = i == ctx.pc ? '*':' '
        inter.write(`${cursor} ${util.inspect(op,{depth:1})}\n`)
    })
    inter.write("========\n")
}

type Context = {
    scope:Obj,
    bytecode:Array<ByteOp>,
    pc:number,
    stack:Array<Obj>
}
function step(inter: Interface, opts: Options, ctx:Context) {
    let op = ctx.bytecode[ctx.pc]
    inter.write("executing " + util.inspect(op) +"\n")
    let ret = execute_op(op, ctx.stack, ctx.scope)
    ctx.pc ++
    inter.write("returned " +ret.print() + "\n")
        // d.green(`Stack (${stack.length}) : ` + stack.map(v => v.print()).join(", "))
        // if (ret.is_kind_of("Exception")) {
            // d.error("returning exception")
            // d.outdent()
            // return ret
        // }
}

async function do_loop(opts: Options) {
    let inter = readline.createInterface({
        input:process.stdin,
        output:process.stdout
    })
    // inter.setPrompt("Debug")
    let ctx:Context = {
        scope: make_standard_scope(),
        bytecode: compile_bytecode(parse(opts.code,'BlockBody')),
        pc: 0,
        stack: [],
    }

    // d.p("stack left " + stack.length)
    // if (stack.length > 0) {
    //     let last = stack.pop() as Obj
    //     d.p("returning",last.print())
    //     if (last && last._is_return) last = last.get_slot('value') as Obj;
    //     return last
    // } else {
    //     return NilObj()
    // }

    while (true) {
        inter.write('\n\n--------------------------------------\n')
        print_menu(inter, opts)
        print_state(inter,opts,ctx)

        // inter.prompt(true)
        // inter.write("doing stuff\n")
        let answer = await inter.question("step...")
        if(answer === 'step' || answer === undefined || answer.trim().length === 0) {
            step(inter,opts,ctx)
        }
        if(answer === 'quit') {
            inter.close()
            break;
        }
    }
}

let opts = handle_args();
await do_loop(opts)
