import test from "node:test";
import {NilObj, Obj} from "../src/obj.ts";
import {NumObj} from "../src/number.ts";
import {objsEqual} from "../src/debug.ts";
import {make_standard_scope} from "../src/standard.ts";
import {parse} from "../src/parser.ts";
import {type ByteCode, compile_bytecode, execute_bytecode} from "../src/bytecode.ts";
import {JoshLogger} from "../src/util.ts";

let d = new JoshLogger()
// d.disable()

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
test('simplest loop',() => {
    // count from 0 to 5 and return the object each time.
    /*
        counter := 2
        Debug print: "inside loop".
        counter := counter + 1.
        jump-if-true: counter < 5.
        return counter.
     */
    compare_execute([
        //set value of counter to 0
        ['load-literal-string','counter'],
        ['load-literal-number',2],
        ['assign',null],
        // execute block

        [ 'load-plain-id', 'Debug' ],
        [ 'lookup-message', 'print:' ],
        [ 'load-literal-string', 'inside loop' ],
        [ 'send-message', 1 ],

        // increment counter
        ['load-literal-string','counter'],
        ['load-plain-id','counter'],
        ['lookup-message','+'],
        ['load-literal-number',1],
        ['send-message',1],
        ['assign',null],
        // load 5

        // see if counter < 5
        ['load-plain-id','counter'],
        ['lookup-message','<'],
        ['load-literal-number',5],
        ['send-message',1],
        // if true then loop
        ['jump-if-true',3],
        // return counter
        ['load-plain-id','counter'],
    ],NumObj(5))
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
    ccem(`
    v := 5.
    v := v + 1.
    v.
    `,NumObj(6))
})
test("block arg tests",() => {
    // unary args
    // ccem(`
    //     self makeSlot: "foo" with: [
    //         88.
    //     ].
    //     self foo.
    //  `, NumObj(88))
    //  keyword with one arg
    ccem(`
        self makeSlot: "foo:" with: [ bar |
            88.
        ].
        self foo: 88.
     `, NumObj(88))
    /*
        counter := 2.
        [counter < 5] whileTrue: [ counter := counter + 1].

        load-literal-string counter
        load literal number 2
        assign

        create literal block: []
        lookup message 'whileTrue:'
        create literal block: []
        send-message 1.
     */
    // ccem(`
    //     counter := 2.
    //     [counter < 5] whileTrue: [ counter := counter + 1. ].
    //
    // `,
    // NumObj(88))
})
test('block eval',() => {
    ccem('[ 5 . ] value .',NumObj(5))
})
test('group eval',() => {
    ccem('(8 + 8).',NumObj(16))
})
test('invoke debug',() => {
    ccem('Debug print: 67.',NilObj())
})
test('whileTrue: ',() => {
    ccem(`[4 > 5] whileTrue: [5.].`, NumObj(5))

})