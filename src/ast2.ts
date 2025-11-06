import test from "node:test";
import {strict as assert} from "assert";

type GroupAST = {
    type:'group',
    value: ExpAst[]
}
type StmtAST = {
    type: 'stmt',
    value: ExpAst[],
}
type SymAst = {
    type:'sym',
    value:string,
}
type NumAst = {
    type: 'num',
    value: number,
}
type StrAst = {
    type:'str',
    value: string,
}
type BlockAst = {
    type:'block',
    value: ExpAst[],
}
type ExpAst = GroupAST | BlockAst | StmtAST | NumAst | StrAst | SymAst


const Num = (value:number):NumAst => ({type:'num', value})
const Sym = (value:string):SymAst => ({type:'sym', value})
const Stmt = (...args:ExpAst[]):StmtAST => ({type: 'stmt', value: Array.from(args)})
const Group = (...args:ExpAst[]):GroupAST => ({type: 'group', value: Array.from(args)})
const Block = (...args:ExpAst[]):BlockAst => ({type: 'block', value: Array.from(args)})

function p(...args: any[]) {
    console.log(...args)
}
function parse(str: string):ExpAst {
    let tokens = str.split(' ') // split by space
        .filter(str => str.trim().length != 0) // strip empty string tokens
    let exps = parseToken(tokens)
    return exps[0]
}
function parseGroup(toks:string[]):GroupAST {
    let stack:ExpAst[] = []
    while(true) {
        let tok = toks.shift()
        if (tok == undefined) break;
        if (tok == ")") {
            break;
        } else {
            stack.push(parseOneToken(tok))
        }
    }
    return Group(...stack)
}
function parseBlock(toks:string[]):BlockAst {
    let stack:ExpAst[] = []
    while(true) {
        let tok = toks.shift()
        if (tok == undefined) break;
        if (tok == ".") {
            collapseStatement(stack)
            continue
        }
        if (tok == "]") {
            break;
        } else {
            stack.push(parseOneToken(tok))
        }
    }
    return Block(...stack)
}
function parseOneToken(tok:string):ExpAst {
    if (tok.match(/^[0-9]+$/)) {
        return Num(parseInt(tok))
    }
    if (tok.match(/^[a-zA-Z]+$/)) {
        return Sym(tok)
    }
    if (tok == "<") {
        return Sym(tok)
    }
    if (tok == ":=") {
        return Sym(tok)
    }
    console.warn(`unhandled token: ${tok}`)
}
function collapseStatement(stack: ExpAst[]) {
    let temp:ExpAst[] = []
    while(true) {
        let node = stack.shift()
        if (!node) {
            break;
        }
        temp.push(node)
    }
    stack.push(Stmt(...temp))
}
function parseToken(toks:string[]):ExpAst[] {
    let stack:ExpAst[] = []
    while(true) {
        let tok = toks.shift()
        if (tok == undefined) {
            break
        }
        switch (tok) {
            case "(": stack.push(parseGroup(toks)); break;
            case "[": stack.push(parseBlock(toks)); break;
            case ".": collapseStatement(stack); break;
            default: stack.push(parseOneToken(tok));
        }
    }
    return stack;
}


test("parse expressions", () => {
    assert.deepStrictEqual(parse(" 4  "), Num(4));
    assert.deepStrictEqual(parse(" foo  "), Sym("foo"));
    assert.deepStrictEqual(parse(" <  "), Sym("<"));
    assert.deepStrictEqual(
        parse(" 4 < 5 . "),
        Stmt(Num(4),Sym('<'),Num(5))
    );
    assert.deepStrictEqual(
        parse(" ( 4 < 5 ) "),
        Group(Num(4),Sym('<'),Num(5))
    );
    assert.deepStrictEqual(
        parse(" ( 4 < 5 ) . "),
        Stmt(Group(Num(4),Sym('<'),Num(5)))
    );
    assert.deepStrictEqual(
        parse("[ 99 . ] "),
        Block(Stmt(Num(99))),
    )
    assert.deepStrictEqual(
        parse(` ( 4 < 5 ) ifTrue [ 99 . ] .`),
        Stmt(
            Group(Num(4),Sym('<'),Num(5)),
            Sym('ifTrue'),
            Block(Stmt(Num(99)))
        )
    );
    assert.deepStrictEqual(
        parse(' dog := Object clone .'),
        Stmt(Sym('dog'),Sym(':='),Sym('Object'),Sym('clone'))
    )
})

class LangObject {
    proto: LangObject | null
    slots: Map<string,any>
    private name: string;
    constructor(name:string,proto:LangObject|null){
        this.name = name;
        this.proto = proto
        this.slots = new Map()
    }

    lookup_method(message: string):unknown {
        if(this.slots.has(message)) {
            return this.slots.get(message)
        } else {
            if (this.proto == null) {
                throw new Error(`method not found`)
            } else {
                return this.proto.lookup_method(message)
            }
        }
    }
}

let ObjectProto = new LangObject("Object",null);
let NumberProto = new LangObject("Number",ObjectProto);
NumberProto.slots.set('add',function(receiver:LangObject,message:LangObject,argument:LangObject) {
    let a = receiver.slots.get('value') as number
    let b = argument.slots.get('value') as number
    return NumObj(a+b)
})
NumberProto.slots.set('<',function(receiver:LangObject,message:LangObject,argument:LangObject) {
    let a = receiver.slots.get('value') as number
    let b = argument.slots.get('value') as number
    return BoolObj(a<b)
})
let BooleanProto = new LangObject("Boolean",ObjectProto);

function NumObj(value:number):LangObject {
    let obj = new LangObject("NumberLiteral",NumberProto)
    obj.slots.set('value',value)
    return obj
}

function BoolObj(value:boolean):LangObject {
    let obj = new LangObject("BooleanLiteral",BooleanProto)
    obj.slots.set('value',value)
    return obj
}

function evalAst(ast: ExpAst):LangObject {
    if (ast.type == 'num') {
        return NumObj(ast.value);
    }
    if (ast.type == 'sym') {
        return ast.value
    }
    if (ast.type == 'group') {
        let receiver = evalAst(ast.value[0])
        let message = evalAst(ast.value[1])
        let argument = evalAst(ast.value[2])
        let method = receiver.lookup_method(message)
        return method(receiver, message, argument)
    }
    if (ast.type == 'stmt') {
        let receiver = evalAst(ast.value[0])
        if (ast.value.length <= 1) {
            return receiver
        }
        let message = evalAst(ast.value[1])
        let argument = evalAst(ast.value[2])
        let method = receiver.lookup_method(message)
        return method(receiver, message, argument)
    }
}

test('eval expressions', () => {
    assert.deepStrictEqual(evalAst(Num(4)),NumObj(4));
    assert.deepStrictEqual(evalAst(Stmt(Num(4),Sym("add"),Num(5))),NumObj(9));
    assert.deepStrictEqual(evalAst(Stmt(Num(4),Sym('<'),Num(5))),BoolObj(true));
    assert.deepStrictEqual(evalAst(Stmt(Group(Num(4),Sym('add'),Num(5)))), NumObj(9))
    // assert.deepStrictEqual(
    //     eval(Stat(
    //         Group(Num(4),Sym('<'),Num(5)),
    //         Sym('ifTrue'),
    //         Block(Stat(Num(99)))
    //         )),
    //     Num(99),
    // )
})