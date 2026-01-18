import test, {describe} from "node:test";
import {type ByteCode, type Context, NilObj, Obj, STStack, VMState} from "../src/obj.ts";
import {NumObj} from "../src/number.ts";
import {objsEqual} from "../src/debug.ts";
import {make_standard_scope} from "../src/standard.ts";
import {parse} from "../src/parser.ts";
import {BLOCK_ACTIVATION, execute_bytecode, execute_op} from "../src/bytecode.ts";
import {JoshLogger} from "../src/util.ts";
import {Binary, BlkArgs, Method, Num, PlnId, Stmt, SymId} from "../src/ast.ts";
import assert from "node:assert";
import {compile_bytecode} from "../src/compiler.ts";

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
    let vm = new VMState(scope,code);
    while(vm.running) {
        d.p("=======")
        d.p("stack",vm.currentContext.stack.print_small())
        d.p(vm.currentContext.bytecode)
        if(vm.currentContext.pc >= vm.currentContext.bytecode.length) break;
        let ret = execute_op(vm)
    }
    d.p("done")
    d.p("stack is",vm.currentContext.stack.print_small())

    if(vm.currentContext.stack.size() > 1) {
        throw new Error("stack too big. should just have the return value")
    }
    let ret = vm.currentContext.stack.pop()
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
        // ccem(` self makeSlot: 'foo:' with: [ bar |  88.  ].  self foo: 88.`, NumObj(88))
        compare_execute_clean([
            ['load-plain-id','self'],
            ['lookup-message','makeSlot:with:'],
            ['load-literal-string','foo:'],
            ['create-literal-block',BlkArgs([PlnId('bar')],[Stmt(Num(88))])],
            ['send-message',2],
            ['return-message',0],
            ['pop',0], // get rid of the nil from the makeSlot: method.
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
    let vm = new VMState(
        new Obj("Temp Context",make_standard_scope(),{}),
        compile_bytecode(parse(source,'BlockBody')));
    while(vm.running) {
        d.p("=======")
        d.p("stack",vm.currentContext.stack.print_small())
        d.p(vm.currentContext.bytecode)
        if(vm.currentContext.pc >= vm.currentContext.bytecode.length) break;
        let ret = execute_op(vm)
    }
    d.p("done")
    d.p("stack is",vm.currentContext.stack.print_small())
    return vm.currentContext
}

describe('scope stability', () => {
    test('just halt',() =>{
        //TODO: change this to check the context from the VM state
        let ctx = ctx_execute('self halt') as Context
        assert.equal(ctx.pc,2)
        assert.equal(ctx.stack.size(),1)
        // scope should be Global
        assert.equal(ctx.scope.name,'Temp Context')
    })
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
        assert.equal(ctx.scope.name,'Temp Context')
    })
    test('simple block call',() => {
        let ctx = ctx_execute('[ self halt. ] value.') as Context
        // scope should be an activation context
        assert.equal(ctx.scope.name,BLOCK_ACTIVATION);
        // parent scope should be the block itself
        // @ts-ignore
        assert.equal(ctx.scope.parent.name,'BytecodeMethod');
        // grandparent scope should be the temp context
        // @ts-ignore
        assert.equal(ctx.scope.parent.parent.name,'Temp Context');
    })
    test('inside while true', () => {
        let ctx = ctx_execute('[4<5] whileTrue: [ self halt. ]') as Context
        // grand parent should be the temp context
        assert.equal(ctx.scope.name,BLOCK_ACTIVATION);
        assert.equal(ctx.scope.parent.name,'BytecodeMethod');
        assert.equal(ctx.scope.parent.parent.name,'Temp Context');
    })
    test('inside method', () => {
        let ctx = ctx_execute(`
        Number makeSlot: "foo" with: [
            self halt.
        ].
        5 foo.
        `) as Context
        // stack should be the block activation and the number itself
        assert.equal(ctx.scope.name,BLOCK_ACTIVATION);
        // scope parent should be the Number
        assert.equal(ctx.scope.parent.name,'NumberLiteral');
    })
    test('access to block parameters', () => {
        let ctx = ctx_execute(`
        Number makeSlot: 'foo:' with: [ v |
            self halt. 
        ].
        5 foo: 6.
        `) as Context
        // scope is the block activation
        assert.equal(ctx.scope.name,BLOCK_ACTIVATION);
        // it should have a v variable on it
        let v = ctx.scope.lookup_slot('v')
        // the v should hold the passed in parameter 6
        assert.equal(v._get_js_number(),6)
    })
    test('nested access to block parameters',() => {
        let ctx = ctx_execute(`
            Number makeSlot: 'foo:' with: [ v | 
                [1 < 2] whileTrue: [
                    self halt.
                ].
            ].
            5 foo: 6.
        `) as Context;
        // scope = activation context of the inner block
        assert.equal(ctx.scope.name,BLOCK_ACTIVATION);
        // scope.parent.parent = activation context of the 'do:' method
        assert.equal(ctx.scope.parent.parent.name,BLOCK_ACTIVATION);
        let outer = ctx.scope.parent.parent as Obj
        // console.log("scope is", outer)
        // act should have v in it's args
        let v = outer.lookup_slot('v')
        // v should be 6
        assert.equal(v._get_js_number(),6)
    })
    test('return from nested method call returning nil',() => {
        let ctx = ctx_execute(`
        [
            self make_data_slot: 'foo' with: 0.
            [4>5] whileTrue: [
                nil.
            ].
            self halt
        ] value.
        `) as Context;

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
    [
        self make_data_slot: 'counter' with:0.
        [self counter < 5] whileTrue: [
            self counter: (self counter + 1).
            self counter.
        ].
        self counter .
    ] value.
    `, NumObj(5))
})