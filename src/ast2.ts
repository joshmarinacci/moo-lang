import test from "node:test";
import {strict as assert} from "assert";

type GroupNode = {
    type:'group',
    value: ExpNode[]
}
type StmtNode = {
    type: 'stmt',
    value: ExpNode[],
}
type SymNode = {
    type:'sym',
    value:string,
}
type NumNode = {
    type: 'num',
    value: number,
}
type StrNode = {
    type:'str',
    value: string,
}
type BlockNode = {
    type:'block',
    value: ExpNode[],
}
type ExpNode = GroupNode | BlockNode | StmtNode | NumNode | StrNode | SymNode

function p(...args: any[]) {
    console.log(...args)
}
function parse(str: string):ExpNode {
    p("")
    p(`======= parsing ${str}`)
    let tokens = str.split(' ') // split by space
        .filter(str => str.trim().length != 0) // strip empty string tokens
    let exps = parseToken(tokens)
    console.log("returned expressions", exps)
    return exps[0]
}

function parseGroup(toks:string[]):GroupNode {
    let stack:ExpNode[] = []
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
function parseBlock(toks:string[]):BlockNode {
    let stack:ExpNode[] = []
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
function parseOneToken(tok:string):ExpNode {
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
}

function collapseStatement(stack: ExpNode[]) {
    let temp:ExpNode[] = []
    while(true) {
        let node = stack.shift()
        if (!node) {
            break;
        }
        temp.push(node)
    }
    stack.push(Stmt(...temp))
}

function parseToken(toks:string[]):ExpNode[] {
    let stack:ExpNode[] = []
    while(true) {
        let tok = toks.shift()
        if (tok == undefined) {
            break
        }
        if (tok.match(/^[0-9]+$/)) {
            stack.push(parseOneToken(tok))
        }
        if (tok.match(/^[a-zA-Z]+$/)) {
            stack.push(parseOneToken(tok))
        }
        if (tok == "<") {
            stack.push(parseOneToken(tok))
        }
        if (tok == ":=") {
            stack.push(parseOneToken(tok))
        }
        if (tok == "(") {
            stack.push(parseGroup(toks))
        }
        if (tok == "[") {
            stack.push(parseBlock(toks))
        }
        if (tok == ".") {
            collapseStatement(stack)
        }
    }
    return stack;
}

function Num(value:number):NumNode {
    return {
        type:'num',
        value,
    }
}
function Sym(value:string):SymNode {
    return {
        type:'sym',
        value,
    }
}
function Stmt(...args:ExpNode[]):StmtNode {
    return {
        type:'stmt',
        value:Array.from(args),
    }
}
function Group(...args:ExpNode[]):GroupNode {
    return {
        type:'group',
        value:Array.from(args),
    }
}
function Block(...args:ExpNode[]):BlockNode {
    return {
        type:'block',
        value:Array.from(args),
    }
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

// test('eval expressions', () => {
//     assert.deepStrictEqual(
//         eval(Stat(Num(4),Sym('<'),Num(5))),
//         Num(9),
//     )
//     assert.deepStrictEqual(
//         eval(Stat(Group(Num(4),Sym('<'),Num(5)))),
//         Num(9),
//     )
//     assert.deepStrictEqual(
//         eval(Stat(
//             Group(Num(4),Sym('<'),Num(5)),
//             Sym('ifTrue'),
//             Block(Stat(Num(99)))
//             )),
//         Num(99),
//     )
// })