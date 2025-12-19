import test from "node:test";
import {make_standard_scope} from "../src/standard.ts";
import {StrObj} from "../src/string.ts";
import {BoolObj} from "../src/boolean.ts";
import {cval} from "./eval.test.ts";

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

// str startsWith: "foo".
// str endsWith: "foo".
// str contains: "foo".
// foo == bar
// foo compare: bar
// foo > bara
// foo < bar
// str do: [ ch | Debug print "char " + ch ].
// str size.
// str toUpper.
// str toLower.
// sort a list of strings
// { "foo", "bar", "quxx" } sort.
test('common protocol',() => {
    let scope = make_standard_scope()
    cval(`'foo' print.`,scope,StrObj('foo'))
    cval(`'foo' == 'foo'.`,scope,BoolObj(true))
    cval(`'foo' == 'bar'.`,scope,BoolObj(false))
})
