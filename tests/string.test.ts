import test from "node:test";
import {make_standard_scope} from "../src/standard.ts";
import {StrObj} from "../src/string.ts";
import {BoolObj} from "../src/boolean.ts";
import {cval} from "./eval.test.ts";
import {NumObj} from "../src/number.ts";
import {ListObj} from "../src/arrays.ts";

test('strings',() => {
    let scope = make_standard_scope()
    cval('"foo" .', scope,StrObj("foo"))
    cval('"foo" + "bar" .', scope,StrObj("foobar"))
    cval(`"foo" contains: "o"`,scope,BoolObj(true))
    cval(`"foo" contains: "x"`,scope,BoolObj(false))
    cval(`("foo" contains: "x") not`,scope,BoolObj(true))
    cval(`"foo" repeat: 2`,scope,StrObj("foofoo"))
    cval(`
     foo := "start".
     foo := foo + "bar".
     foo. `,scope,StrObj("startbar"))
})

test('structure',() => {
    let scope = make_standard_scope()
    cval('"foobar" contains: "foo"', scope,BoolObj(true))
    cval('"foobar" startsWith: "foo"', scope,BoolObj(true))
    cval('"foobar" startsWith: "bar"', scope,BoolObj(false))
    cval('"foobar" endsWith: "foo"', scope,BoolObj(false))
    cval('"foobar" endsWith: "bar"', scope,BoolObj(true))
    cval('"foobar" == "bar"', scope,BoolObj(false))
    cval('"foobar" == "foobar"', scope,BoolObj(true))
    cval('"foo" size', scope,NumObj(3))
    cval('"fooBar" toUpper', scope, StrObj("FOOBAR"))
    cval('"fooBar" toLower', scope, StrObj("foobar"))
    // cval(`"foo" do: [ ch | Debug print: 'char ' + ch ]`, scope, StrObj("foobar"))
    // cval(`{ "foo", "bar", "quxx" } sort`,scope,ListObj(StrObj("foo"),StrObj("bar"),StrObj("quxx")))
})
test('common protocol',() => {
    let scope = make_standard_scope()
    cval(`'foo' print.`,scope,StrObj('foo'))
    cval(`'foo' == 'foo'.`,scope,BoolObj(true))
    cval(`'foo' == 'bar'.`,scope,BoolObj(false))
    // cval('"foobar" compare: "foobar"', scope,BoolObj(true))
    // cval('"foo" < "bar"', scope,BoolObj(false))
    // cval('"foo" > "bar"', scope,BoolObj(true))
})
