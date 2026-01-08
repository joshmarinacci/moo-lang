import test, {describe} from "node:test";
import {type ByteCode, type Context, NilObj, Obj, STStack} from "../src/obj.ts";
import {NumObj} from "../src/number.ts";
import {objsEqual} from "../src/debug.ts";
import {make_standard_scope} from "../src/standard.ts";
import {parse} from "../src/parser.ts";
import {BLOCK_ACTIVATION, compile_bytecode, execute_bytecode, execute_op} from "../src/bytecode.ts";
import {JoshLogger} from "../src/util.ts";
import {Binary, BlkArgs, Method, Num, PlnId, Stmt, SymId} from "../src/ast.ts";
import assert from "node:assert";

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

function compare_execute_clean(code:ByteCode, expected: Obj) {
    d.p("executing",code)
    let scope:Obj = make_standard_scope();
    let ctx:Context = {
        scope: scope,
        bytecode: code,
        pc: 0,
        stack: new STStack(),
        running:true
    }
    while(ctx.running) {
        console.log("=======")
        console.log("stack",ctx.stack.print_small())
        console.log(ctx.bytecode)
        if(ctx.pc >= ctx.bytecode.length) break;
        let op = ctx.bytecode[ctx.pc]
        console.log('op ' + op)
        let ret = execute_op(op, ctx)
    }
    console.log("done")
    console.log("stack is",ctx.stack.print_small())

    if(ctx.stack.size() > 1) {
        throw new Error("stack too big. should just have the return value")
    }
    let ret = ctx.stack.pop()
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
        ['return-message',0]
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
        ['return-message',0]
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
        ['return-message',0],

        // increment counter
        ['load-literal-string','counter'],
        ['load-plain-id','counter'],
        ['lookup-message','+'],
        ['load-literal-number',1],
        ['send-message',1],
        ['return-message',0],
        ['assign',null],
        // load 5

        // see if counter < 5
        ['load-plain-id','counter'],
        ['lookup-message','<'],
        ['load-literal-number',5],
        ['send-message',1],
        ['return-message',0],
        // if true then loop
        ['jump-if-true',3],
        // return counter
        ['load-plain-id','counter'],
    ],NumObj(5))
})

describe("function calls", () => {
    test('function call cleanup: native js', () => {
        // ccem('4 * 5', NumObj(20))
        compare_execute_clean([
            ['load-literal-number', 4],
            ['lookup-message', '*'],
            ['load-literal-number', 5],
            ['send-message', 1],
            ['return-message',0]
        ], NumObj(20))
    })
    test('block bytecode method', () => {
        // ccem(` self makeSlot: "foo:" with: [ bar |  88.  ].  self foo: 88.`, NumObj(88))
        compare_execute_clean([
            ['load-plain-id','self'],
            ['lookup-message','makeSlot:with:'],
            ['load-literal-string','foo:'],
            ['create-literal-block',BlkArgs([PlnId('bar')],[Stmt(Num(88))])],
            ['send-message',2],
            ['return-message',0],
            ['load-plain-id','self'],
            [ 'lookup-message', 'foo:' ],
            ['load-literal-number',88],
            ['send-message',1],
            ['return-message',2],
        ], NumObj(88))
    })
    test('block value returning a value',() => {
        // ccem('[ 5 . ] value .',NumObj(5))
        compare_execute_clean([
            ['create-literal-block',BlkArgs([],[Stmt(Num(5))])],
            ['lookup-message','value'],
            ['send-message',0],
            ['return-message',0],
        ],NumObj(5))
    })
    test('block value accepting a parameter',() => {
        // ccem('[b| 7 + b. ] valueWith: 6 .',NumObj(13))
        compare_execute_clean([
            ['create-literal-block',BlkArgs([PlnId('b')],
                // precedence("4+5",Method(Num(4),Binary(SymId('+'),Num(5))))
                [Stmt(Method(Num(7),Binary(SymId('+'),PlnId('b'))))])
            ],
            ['lookup-message','valueWith:'],
            ['load-literal-number',6],
            ['send-message',1],
            ['return-message',0],
        ],NumObj(13))
    })
})

function ctx_execute(source: string):Context {
    let bytecode = compile_bytecode(parse(source,'BlockBody'))
    let scope:Obj = make_standard_scope();
    let ctx:Context = {
        scope: scope,
        bytecode: bytecode,
        pc: 0,
        stack: new STStack(),
        running:true
    }
    while(ctx.running) {
        console.log("=======")
        console.log("stack",ctx.stack.print_small())
        console.log(ctx.bytecode)
        if(ctx.pc >= ctx.bytecode.length) break;
        let op = ctx.bytecode[ctx.pc]
        // console.log('op ' + op)
        let ret = execute_op(op, ctx)
    }
    console.log("done")
    console.log("stack is",ctx.stack.print_small())
    return ctx
}

describe('scope stability', () => {
    test('basic scope',() =>{
        let ctx = ctx_execute('4 + 5. self halt') as Context
        // 4 + 5. self halt.
        assert.equal(ctx.pc,7)
        assert.equal(ctx.stack.size(),2)
        // context should contain 9 on the stack.
        ctx.stack.pop()
        let top = ctx.stack.pop()
        assert.equal(top._get_js_number(),9)
        // scope should be Global
        assert.equal(ctx.scope.name,'Global')
    })
    test('simple block call',() => {
        let ctx = ctx_execute('[ self halt. ] value.') as Context
        // pc should be 1?
        // scope should be an activation context
        assert.equal(ctx.scope.name,BLOCK_ACTIVATION);
        console.log('scope is',ctx.scope.print())
        console.log("parent scope is", ctx.scope.parent?.print())
        console.log("grand parent scope is", ctx.scope.parent?.parent?.print())
        // parent scope should be the global context
        assert.equal(ctx.scope.parent.name,'Global Scope');
    })
    test('inside while true', () => {
        let ctx = ctx_execute('[4<5] whileTrue: [ self halt. ]') as Context
        // scope parent should be the global context
    })
    test('inside method', () => {
        let ctx = ctx_execute(`
        Number make_slot: "foo" with: [
            self halt.
        ].
        5 foo.
        `) as Context
        // scope parent should be the Number
    })
    test('access to block parameters', () => {
        let ctx = ctx_execute(`
        String makeSlot: 'do:' with: [ lam |
            self halt. 
        ].
        "abc" do: 5.
        `) as Context
        // scope should be activation context
        // lam should be visible in the act.args
        // lam should be 5.
    })
    test('nested access to block parameters',() => {
        let ctx = ctx_execute(`
            String makeSlot: 'do:' with: [ lam | 
                [self counter < self size] whileTrue: [
                    self halt.
                ].
            ].
            "abc" do: 5.
        `) as Context;
        // scope = activation context of the inner block
        // scope.parent = activation context of the 'do:' method
        // act should have lam in it's args
        // lam should be 5
        // scope.parent.parent should be the string object
        // scope.parent.parent.parent should the String class
        // calling lookup(lam) on scope should return the lam value of 5
    })
})

test('compile & execute: 1 + 2 = 3',() =>{
    cce('1 + 2', NumObj(3))
    // cce('5 square', NumObj(25))
})
test('conditional',() => {
    cce(` 4 < 5 ifTrue: [88]`,NumObj(88))
    cce(` 4 > 5 ifTrue: [88]`,NilObj())
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
    // ccem('[ 5 . ] valueWith: 6.',NumObj(5))
    ccem('[ v | 5 + v. ] valueWith: 6.',NumObj(11))
})
test('group eval',() => {
    ccem('(8 + 8).',NumObj(16))
})
test('invoke debug',() => {
    ccem('Debug print: 67.',NilObj())
})
test('whileTrue: ',() => {
    ccem(`
    self make_data_slot: 'counter' with:0.
    [self counter < 5] whileTrue: [
        self counter: (self counter + 1).
        self counter.
    ].
    self counter .
    `, NumObj(5))
})