import test from 'node:test';
import { strict as assert } from 'node:assert';

type LitNumNode = {
    type:'literal-number'
    value:number
}
type SymbolNode = {
    type: 'symbol'
    name: string
}
type CallNode = {
    type:'call',
    receiver:ExpNode,
    name: SymbolNode,
    args: ExpNode[],
}
type ParseErrorNode = {
    type:'parse-error',
}
type ExpNode = SymbolNode | LitNumNode | CallNode | ParseErrorNode;

function Num(value:number):LitNumNode {
    return {
        type:'literal-number',
        value: value
    }
}
function Sym(name:string):SymbolNode {
    return {
        type:'symbol',
        name:name
    }
}
function Call(receiver:ExpNode, name:SymbolNode, args:ExpNode[]):CallNode {
    return {
        type:'call',
        receiver:receiver,
        name:name,
        args:args
    }
}

class NumberObject {
    private value: number;
    constructor(value: number) {
        this.value = value;
    }
    do_call(name:SymbolNode, args:any[]):any {
        console.log("doing a call of ",name, "on",this)
        if (name.name === 'add') {
            return this.do_add(args)
        }
    }

    private do_add(args: any[]) {
        console.log("doing add with",args)
        let arg1 = args[0] as NumberObject;
        return new NumberObject(this.value + arg1.value);
    }
}

function eval_ast(exp:ExpNode):any {
    console.log("evaluating ",exp);
    if (exp.type == 'call') {
        let call:CallNode = exp;
        let receiver = eval_ast(call.receiver);
        let args = call.args.map(v => eval_ast(v))
        return receiver.do_call(call.name,args)
    }
    if (exp.type === 'literal-number') {
        let lit:LitNumNode = exp;
        return new NumberObject(lit.value)
    }
}

// exp = receiver message expr
// exp = literal
function handleToken(first:string):ExpNode {
    if (!first) {
        return {
            type:'parse-error'
        } as ParseErrorNode
    }
    if (first.match(/\d/)) {
        console.log("its a number")
        return Num(parseInt(first))
    }
    if(first.match(/\w/)) {
        console.log("token is word");
        return Sym(first)
    }

    console.log("shouldn't be here");
    return {
        type:'parse-error'
    }
}

function parse(s: string):ExpNode {
    console.log("parsing ",s)
    let tokens = s.split(' ');
    console.log("tokens are ",tokens)

    let node = Call(
        handleToken(tokens[0]),
        handleToken(tokens[1]) as SymbolNode,
        [
            handleToken(tokens[2])
        ]
    )
    console.log("node is", node);
    return node;
}

test('parse exp',() => {
    let exp:ExpNode = parse('4 add 5')
    let comp:CallNode = Call(Num(4),Sym('add'),[Num(5)])
    assert.deepStrictEqual(exp,comp)
})
test('simple eval code',() => {
    /*
        4 add 5
        becomes literal call ("add", literal)
     */
    // let ast:Exp = parse("4 add 5");
    let a:LitNumNode = {
        type: 'literal-number',
        value: 4,
    }
    let b:LitNumNode = {
        type: 'literal-number',
        value: 5,
    }
    let add:SymbolNode = {
        type:'symbol',
        name:'add',
    }
    let call:CallNode = {
        type:'call',
        receiver:a,
        name: add,
        args: [b],
    }

    let exp:CallNode = Call(Num(4),Sym('add'),[Num(5)])

    let result = eval_ast(exp);
    console.log("exp evaluated to",result);
    assert.deepStrictEqual(result,new NumberObject(9))
});

/*


 */


