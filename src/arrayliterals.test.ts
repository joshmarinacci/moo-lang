import test from "node:test";
import {cval, DictObj, ListObj, make_default_scope, NumObj} from "./eval2.ts";
import assert from "node:assert";
import {ArrayLiteral, InputStream, type Rule} from "./parser.ts";

export function match(source:string, rule:Rule) {
    let input = new InputStream(source,0);
    return rule(input).succeeded()
}

const no_test = (name:string, cb:() => void) => {}

test('array literals',() => {
    let scope = make_default_scope()
    cval(`[
        l ::= { 4 5 }.
        Debug equals (l at 0) 4.
        Debug equals (l at 1) 5.
        l len.
     ] value.`, scope, NumObj(2))
    cval(`[
     { 4 5 }.
     ] value.`, scope, ListObj(NumObj(4),NumObj(5)))
})

test('dict literals', () => {
    let scope = make_default_scope()
    cval(`[
        p ::= { x:5 }.
        p dump.
        Debug equals (p get "x") 5.
        p.
    ] value.
    `,scope, DictObj({x:NumObj(5)}))
})

test('dict api',() => {
    let scope = make_default_scope()
    cval(`[
        dict ::= (Dict clone).
        dict set "six" 6.
        dict set "seven" 7.
        Debug equals (dict get "six") 6.
        Debug equals (dict get "seven") 7.
        dict len.
        ] value.
    `,scope,NumObj(2))
})

test('parse array list literals',() => {
    assert.ok(match("{}",ArrayLiteral))
    assert.ok(match("{4}",ArrayLiteral))
    assert.ok(match("{4 5}",ArrayLiteral))
})

test('parse array dict literals',() => {
    assert.ok(match("{}",ArrayLiteral))
    assert.ok(match("{a:5}",ArrayLiteral))
    assert.ok(match("{ a:5 }",ArrayLiteral))
    assert.ok(match("{ a:5 b:6 }",ArrayLiteral))
})
