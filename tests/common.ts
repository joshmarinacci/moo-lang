import {Obj} from "../src/obj.ts";
import {execute_bytecode} from "../src/bytecode.ts";
import {parse} from "../src/parser.ts";
import {JoshLogger} from "../src/util.ts";
import {objsEqual} from "../src/debug.ts";
import {compile_bytecode} from "../src/compiler.ts";

export const d = new JoshLogger()
d.disable()

export type Options = {
    expected?: Obj
    evalOnly?: boolean
    bytecodeOnly?: boolean
    debug?: boolean
}

function compare(target: Obj, expected: Obj | undefined) {
    if (!expected) return
    if (!objsEqual(target, expected)) {
        console.log("not equal")
        console.log(target.print())
        console.log(expected.print())
        throw new Error(`${target.print()} !== ${expected.print()}`)
    }
}

function do_bytecode(source: string, scope: Obj, opts: Options) {
    d.p("Eval Bytecode")
    let bytecode = compile_bytecode(parse(source, 'BlockBody'))
    d.p("bytecode is", bytecode)
    let ret_bcode = execute_bytecode(bytecode, scope)
    compare(ret_bcode, opts.expected)
    return ret_bcode
}

export function cval(source: string, scope: Obj, options?: Obj | Options) {
    let opts: Options = {
        evalOnly: false,
        bytecodeOnly: false,
        expected: undefined,
    }
    if (options) {
        if (options instanceof Obj) {
            opts.expected = options;
        } else {
            options = options as Options
            if (options.hasOwnProperty('expected')) {
                opts.expected = options.expected
            }
            if (options.hasOwnProperty('debug')) {
                opts.debug = options.debug
            }
        }
    }
    if (opts.debug) d.enable()
    d.p('=========')
    d.p(`code is '${source}'`)
    return do_bytecode(source, scope, opts)
}