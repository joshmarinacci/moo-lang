import readline, {Interface} from "node:readline/promises"
import util from "node:util"
import {type ByteCode, type ByteOp, compile_bytecode, execute_op, perform_dispatch} from "./bytecode.ts";
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


function print_menu(inter: Interface, opts: Options) {
    inter.write("input is: " + opts.code+'\n')
    inter.write('commands: quit, step, run\n')
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
    stack:Array<Obj>,
    running: boolean
}
function step(inter: Interface, opts: Options, ctx:Context):void {
    if(ctx.pc >= ctx.bytecode.length) {
        console.log("we are done")
        ctx.running = false
        return
    }
    let op = ctx.bytecode[ctx.pc]
    inter.write("executing " + util.inspect(op) +"\n")
    if(op[0] === 'halt') {
        inter.write('halting')
        ctx.running = false
        ctx.pc++
        return
    }
    if(op[0] === 'return') {
        let value = ctx.stack.pop() // get the value
        ctx.stack.pop() // pop the method off
        ctx.stack.pop() // pop off the receiver
        ctx.scope = ctx.stack.pop() as Obj // restore the cope
        let pc = ctx.stack.pop() as Obj
        ctx.pc = pc._get_js_number()
        let bytecode = ctx.stack.pop() as Obj
        ctx.bytecode = bytecode.get_js_slot('bytecode')
        // push the return value back on
        ctx.stack.push(value)
        return
    }
    if(op[0] === 'send-message') {
        let arg_count = op[1] as number
        let args = []
        for (let i = 0; i < arg_count; i++) {
            args.push(ctx.stack.pop())
        }
        args.reverse()
        let method = ctx.stack.pop() as Obj
        let rec = ctx.stack.pop() as Obj
        method.parent = rec
        console.log('send message\n',
            `   receiver: ${rec.print()}\n`,
            `   method: ${method.print()}`,
            `   args: ${args.map(a => a.print()).join(',')}\n`,
        )
        if (method.name === 'Block') {
            if (method.name === 'Block' && method.get_js_slot("bytecode") !== undefined) {
                ctx.stack.push(new Obj("bytecode",ObjectProto,{bytecode:ctx.bytecode}))
                ctx.stack.push(NumObj(ctx.pc+1))
                ctx.bytecode = method.get_js_slot('bytecode') as ByteCode
                ctx.stack.push(ctx.scope)
                ctx.stack.push(rec)
                ctx.stack.push(method)
                let scope = new ActivationObj(`block-activation`, method, {})
                ctx.scope = scope
                // set pc
                ctx.pc = 0
                //  setup args
                return
            }
        }
        ctx.pc++
        let ret = perform_dispatch(method,rec,args, ctx.stack)
        inter.write(`dispatch returned ${ret.print()}\n`)
        let top = ctx.stack[ctx.stack.length-1];
        inter.write(`top of the stack is ${top.print()}`)
        if(top.name === 'Exception') {
            ctx.running = false
        }
    } else {
        let ret = execute_op(op, ctx.stack, ctx.scope)
        ctx.pc++
        inter.write("returned " + ret.print() + "\n")
    }
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
        running:true
    }
    if(opts.step) {
        ctx.running = false
    }
    while (true) {
        inter.write('\n\n--------------------------------------\n')
        print_state(inter,opts,ctx)
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
