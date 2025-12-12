import test from "node:test";
import {JS_VALUE, NilObj, Obj, ObjectProto} from "../src/obj.ts";
import {NumObj} from "../src/number.ts";
import {objsEqual} from "../src/debug.ts";
import {JoshLogger} from "../src/util.ts";
import {make_standard_scope} from "../src/standard.ts";
import {parse} from "../src/parser.ts";
import {type Ast} from "../src/ast.ts";

type OpType = 'lookup-message'
            | 'send-message'
            | 'return-value'
            | 'load-literal-number'
type ByteOp = [OpType,unknown]
type ByteCode = Array<ByteOp>;

function execute_op(op: ByteOp, stack: Obj[], scope: Obj):Obj {
    let name = op[0]
    if(name === 'load-literal-number') {
        stack.push(NumObj(op[1] as number))
        return NilObj()
    }
    if(name === 'lookup-message') {
        let message = op[1] as string
        let rec:Obj = stack.pop() as Obj
        let method = rec.lookup_slot(message)
        // console.log("method is",method.print())
        if(method.isNil()) {
            console.log("couldn't find the message")
            return new Obj("Exception",ObjectProto,{"message":`Message not found: '${message}'`})
        }
        stack.push(rec)
        stack.push(method)
        return NilObj()
    }
    if(name === 'send-message') {
        let arg_count = op[1] as number
        let method = stack.pop() as Obj
        let rec = stack.pop() as Obj
        let args = []
        for(let i=0; i<arg_count; i++) {
            args.push(stack.pop())
        }
        if (method.is_kind_of("NativeMethod")) {
            let ret = (method.get_js_slot(JS_VALUE) as Function)(rec,args)
            stack.push(ret)
            return NilObj()
        }
        if (method.name === 'Block') {
            method.parent = rec
            let meth = method.get_js_slot('value') as Function
            if (meth instanceof Function) {
                let ret = meth(method,args)
                stack.push(ret)
                return NilObj()
            }
        }
    }
    if(name === 'return-value') {
        let ret = stack.pop() as Obj
        console.log('returning value ', ret.print())
        return ret
    }
    throw new Error(`unknown bytecode operation '${name}'`)
}

let d = new JoshLogger()
export function execute(code: ByteCode, scope: Obj):Obj {
    let stack:Array<Obj> = []
    d.p("executing")
    d.indent()
    for(let op of code) {
        d.red(`Op: ${op[0]} ${op[1]}`)
        let ret = execute_op(op,stack,scope)
        d.green(`Stack (${stack.length}) : ` + stack.map(v => v.print()).join(", "))
        if (ret.is_kind_of("Exception")) {
            console.log("returning exception")
            d.outdent()
            return ret
        }
        if(op[0] === 'return-value') {
            d.outdent()
            return ret
        }
    }
    d.outdent()
    return NilObj()
}

function compare_execute(code:ByteCode, expected: Obj) {
    let scope:Obj = make_standard_scope();
    let ret = execute(code,scope)
    if(ret.is_kind_of("Exception")) {
        d.red(ret.print())
    }
    if(!objsEqual(ret, expected)) {
        console.log("not equal")
        console.log(ret.print())
        console.log(expected.print())
        throw new Error(`${ret.print()} !== ${expected.print()}`)
    } else {
        console.log('same',ret.print())
    }
}

export function compile(ast: Ast):ByteCode {
    d.p("compiling",ast)
    if(ast.type === 'message-call') {
        return [
            compile(ast.receiver),
            compile(ast.call),
            [['return-value',null]]
        ].flat() as ByteCode
    }
    if(ast.type === 'binary-call') {
        return [
            compile(ast.argument),
            [['lookup-message',ast.operator.name]],
            [['send-message',1]],
        ].flat() as ByteCode
    }
    if(ast.type === 'unary-call') {
        return [
            [['lookup-message',ast.message.name]],
            [['send-message',0]],
        ].flat() as ByteCode
    }
    if(ast.type === 'number-literal') {
        return [['load-literal-number',ast.value]]
    }
    throw new Error(`unknown ast type ${ast.type}`)
}

function cce(source:string,ans:Obj) {
    compare_execute(compile(parse(source,'Exp')),ans)
}
test("1 + 2 = 3",() => {
    // 1 + 2 returns 3
    compare_execute([
        // put a literal on the stack
        //LoadLiteralNumber(2),
        ['load-literal-number',2],
        // put a literal on the stack
        //LoadLiteralNumber(1),
        ['load-literal-number',1],
        // lookup message from target on the stack
        //LookupMessage('+'),
        ['lookup-message','+'],
        // invoke message on the stack with target and one argument from the stack
        // puts result on the stack
        //SendMessage(1),
        ['send-message',1],
        // return whatever is left on the stack
        //ReturnValue(),
        ['return-value',null]
    ],NumObj(3))
})
test('5 square',() => {
    compare_execute([
        ['load-literal-number',5],
        ['lookup-message','square'],
        ['send-message',0],
        ['return-value',null]
    ], NumObj(25))
})
test('compile & execute: 1 + 2 = 3',() =>{
    cce('1 + 2', NumObj(3))
    cce('5 square', NumObj(25))
})
