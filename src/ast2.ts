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
    p("")
    p(`======= parsing ${str}`)
    let tokens = str.split(' ') // split by space
        .filter(str => str.trim().length != 0) // strip empty string tokens
    let exps = parseToken(tokens)
    console.log("returned expressions", exps)
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