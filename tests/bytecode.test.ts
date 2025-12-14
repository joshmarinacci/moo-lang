import test from "node:test";
import {NilObj, Obj} from "../src/obj.ts";
import {NumObj} from "../src/number.ts";
import {objsEqual} from "../src/debug.ts";
import {make_standard_scope} from "../src/standard.ts";
import {parse} from "../src/parser.ts";
import {type ByteCode, compile_bytecode, execute_bytecode} from "../src/bytecode.ts";
import {JoshLogger} from "../src/util.ts";

let d = new JoshLogger()
d.disable()

function compare_execute(code:ByteCode, expected: Obj) {
    d.p("executing",code)
    let scope:Obj = make_standard_scope();
    let ret = execute_bytecode(code,scope)
    if(ret.is_kind_of("Exception")) {
        d.red(ret.print())
    }
    if(!objsEqual(ret, expected)) {
        d.p("not equal")
        d.p(ret.print())
        d.p(expected.print())
        throw new Error(`${ret.print()} !== ${expected.print()}`)
    } else {
        d.p('same',ret.print())
    }
}


function cce(source:string,ans:Obj) {
    d.red(source)
    compare_execute(compile_bytecode(parse(source,'Exp')),ans)
}
function ccem(source:string,ans:Obj) {
    d.red(source)
    compare_execute(compile_bytecode(parse(source,'BlockBody')),ans)
}
test("1 + 2 = 3",() => {
    // 1 + 2 returns 3
    compare_execute([
        // put a literal on the stack
        //LoadLiteralNumber(2),
        ['load-literal-number',2],
        // lookup message from target on the stack
        //LookupMessage('+'),
        ['lookup-message','+'],
        // put a literal on the stack
        //LoadLiteralNumber(1),
        ['load-literal-number',1],
        // invoke message on the stack with target and one argument from the stack
        // puts result on the stack
        //SendMessage(1),
        ['send-message',1],
        // return whatever is left on the stack
        //ReturnValue(),
        // ['return-value',null]
    ],NumObj(3))
})
test('5 square',() => {
    compare_execute([
        ['load-literal-number',5],
        ['lookup-message','square'],
        ['send-message',0],
    ], NumObj(25))
})
test('compile & execute: 1 + 2 = 3',() =>{
    cce('1 + 2', NumObj(3))
    cce('5 square', NumObj(25))
})
test('conditional',() => {
    cce(` 4 < 5 ifTrue: 88`,NumObj(88))
    cce(` 4 > 5 ifTrue: 88`,NilObj())
})
test('assignment operator', () => {
    ccem(`
        v := 5.
        v.
    `, NumObj(5))
})
test("block arg tests",() => {
    ccem(`
        self makeSlot: "foo" with: [
            88.
        ].
        self foo.
     `, NumObj(88))
})
test('block eval',() => {
    ccem('[ 5 . ] value .',NumObj(5))
})
test('group eval',() => {
    ccem('(8 + 8).',NumObj(16))
})
