import test from "node:test";
import assert from "node:assert";

type char = number
const debug = true
const l = (...args:any[]) => {
    if(debug) console.log("DEBUG",...args)
}
const Char = (ch:string):number => ch.charCodeAt(0);

const Range = (start:char, end:char) => (value: char) => {
    return value >= start && value <= end;
};

let Digit = Range(Char("0"),Char("9"));
let Letter = Range(Char("a"),Char("z"));

let LitInt = (value:number)=> ({type:'int',value:value});
let LitStr = (value:string)=> ({type:'str',value:value});

function parse(input: string) {
    l("parsing",input)
    if(Digit(Char(input[0]))){
        return LitInt(4)
    }
    if(Letter(Char(input[0]))){
        return LitStr("a")
    }
}

test("parse integer",() => {
    assert.deepEqual(parse("4"),LitInt(4),'4 not parsed');
    assert.deepEqual(parse("a"),LitStr("a"));
})