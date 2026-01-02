import test, {describe} from "node:test";
import {Obj} from "../src/obj.ts";
import {make_standard_scope} from "../src/standard.ts";
import {cval} from "./common.ts";
import {NumObj} from "../src/number.ts";
import {BoolObj} from "../src/boolean.ts";
import {StrObj} from "../src/string.ts";

describe('get js hooks',() => {
    test('Boolean fromJs',() => {
        let scope: Obj = make_standard_scope()
        cval(`
            String makeSlot: 'startsWith:' with: [str | 
                Boolean fromJs: (self jsCall: "startsWith" 
                                          on: (self getJsSlot: '_jsvalue')
                                        with: (str  getJsSlot: '_jsvalue')
                ). 
            ].
            "foobar" startsWith: "foo".
        `,scope,{bytecodeOnly:true, expected:BoolObj(true)})
    })
    test('String fromJs',() => {
        let scope: Obj = make_standard_scope()
        cval(`
            Number understands: "toString" with: [ |
                String fromJs: (self jsCall: "toString" on: (self getJsSlot: "_jsvalue")).
            ].
            88 toString. 
        `,scope,{bytecodeOnly:true, expected:StrObj('88')})
    })
    test('Number fromJs',() => {
        let scope: Obj = make_standard_scope()
        cval(`
    Number understands: "pow:" with: [ arg |
        Math := self jsLookupGlobal: "Math".
        Number fromJs: (self jsCall: "pow" 
                                 on:Math 
                               with: (self getJsSlot: "_jsvalue") 
                               with: (arg getJsSlot: "_jsvalue")
        ).
    ].
    3 pow: 5.
    `,scope,{ bytecodeOnly:true, expected: NumObj(243) })
    })
})