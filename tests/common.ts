import {NilObj, Obj} from "../src/obj.ts";
import {compile_bytecode, execute_bytecode} from "../src/bytecode.ts";
import {parse} from "../src/parser.ts";
import type {Ast} from "../src/ast.ts";
import {eval_ast} from "../src/eval.ts";
import {JoshLogger} from "../src/util.ts";
import {objsEqual} from "../src/debug.ts";

export const d = new JoshLogger()
d.disable()
function evalTreeWalk(body: Ast, scope: Obj): Obj {
    let last = NilObj()
    if (Array.isArray(body)) {
        for (let ast of body) {
            last = eval_ast(ast, scope)
            if (!last) last = NilObj()
        }
    } else {
        last = eval_ast(body as Ast, scope);
    }
    if (last._is_return) last = last.get_slot('value') as Obj;
    return last
}

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

function do_treewalk(source: string, scope: Obj, opts: Options) {
    let body = parse(source, 'BlockBody');
    d.p('ast is', body)
    d.p("doing tree walk")
    let ret = evalTreeWalk(body, scope)
    d.p("tree walk returned", ret.print())
    compare(ret, opts.expected)
    return ret
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
            if (options.hasOwnProperty('evalOnly')) {
                opts.evalOnly = options.evalOnly
            }
            if (options.hasOwnProperty('bytecodeOnly')) {
                opts.bytecodeOnly = options.bytecodeOnly
            }
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
    if (opts.evalOnly) {
        return do_treewalk(source, scope, opts)
    }
    if (opts.bytecodeOnly) {
        return do_bytecode(source, scope, opts)
    }
    {
        d.p("doing both types")
        let ret_twalk = do_treewalk(source, scope, opts)
        let ret_bcode = do_bytecode(source, scope, opts)
        compare(ret_twalk, ret_bcode)
        return ret_bcode
    }
}