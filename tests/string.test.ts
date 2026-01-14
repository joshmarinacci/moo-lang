import test from "node:test";
import {make_standard_scope} from "../src/standard.ts";
import {StrObj} from "../src/string.ts";
import {BoolObj} from "../src/boolean.ts";
import {NumObj} from "../src/number.ts";
import {cval} from "./common.ts";

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
    cval(`"foo" isEmpty`, scope, { expected:BoolObj(false), bytecodeOnly:true })
    cval(`"" isEmpty`, scope, {expected:BoolObj(true), bytecodeOnly:true})
    cval(`"foo" at: 0`, scope, StrObj('f'))
    cval(`"foo" at: 1`, scope, StrObj('o'))
})
test('structure',() => {
    let scope = make_standard_scope()
    cval('"foobar" contains: "foo"', scope,BoolObj(true))
    cval('"foobar" startsWith: "foo"', scope,{expected:BoolObj(true),bytecodeOnly:true})
    cval('"foobar" startsWith: "bar"', scope,{expected:BoolObj(false), bytecodeOnly:true})
    cval('"foobar" endsWith: "foo"', scope,{expected: BoolObj(false), bytecodeOnly:true})
    cval('"foobar" endsWith: "bar"', scope,{expected: BoolObj(true), bytecodeOnly:true})
    cval('"foo" size', scope,{expected:NumObj(3),bytecodeOnly:true})
    cval('"fooBar" toUpper', scope, {expected:StrObj("FOOBAR"),bytecodeOnly:true})
    cval('"fooBar" toLower', scope, {expected:StrObj("foobar"),bytecodeOnly:true})
})
test('common protocol',() => {
    let scope = make_standard_scope()
    // print
    cval(`'foo' print.`,scope,StrObj('foo'))
    // equality
    cval(`'foo' == 'foo'.`,scope,BoolObj(true))
    cval(`'foo' == 'bar'.`,scope,BoolObj(false))
    // is nil
    cval(`'foo' isNil`,scope,BoolObj(false))
    // boolean comparison
    cval('"foo" < "bar"', scope,BoolObj(false))
    cval('"bar" < "foo"', scope,BoolObj(true))
    cval('"foo" > "bar"', scope,BoolObj(true))
    // compare for sorting
    cval('"foo" compare: "bar"', scope, NumObj(1))
    cval('"foo" compare: "qux"', scope, NumObj(-1))
    cval('"foo" compare: "foo"', scope, NumObj(0))
    cval('"foobar" compare: "foobar"', scope,NumObj(0))
    //
    // // sort using compare
    // cval(`
    // foo := { "foo" "bar" "quxx" }.
    //  foo sortedBy: [ a b | a compare: b ].`, scope,
    //     ListObj(StrObj("foo"),StrObj("bar"),StrObj("quxx")))

})
test('loop over string chars',() => {
    let scope = make_standard_scope()
    cval(`
     "abc" do: [ch | ch dump. ].
     88.
    `,scope, {
        expected: NumObj(88),
        bytecodeOnly:true,
    })
})
