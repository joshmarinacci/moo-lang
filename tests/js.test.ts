import test from "node:test";
import {Obj} from "../src/obj.ts";
import {make_standard_scope} from "../src/standard.ts";
import {mval} from "./eval.test.ts";

test('native JS api',() => {
    let scope: Obj = make_standard_scope()
    // TODO: Math.pow(x,y)
    // TODO: allow identifiers beginning with underscore
    // TODO: implement understands:with: as a dupe of makeSlot:with:
    // implement doNativeCall:target:with
    // implement doNativeCall:target:with:with:
    // implement lookupNativeGlobal:. Only can return Math.
    // whatever is returned should be auto converted back to an ST object?
    mval(`
    Number understands: "toString" with: [ |
        Debug print: (self getJsSlot: "_jsvalue").
        self jsCall: "toString" on: (self getJsSlot: "_jsvalue").
    ].
    88 toString. // should print 88.
    
    Number understands: "pow:" with: [ arg |
        Math := self jsLookupGlobal: "Math".
        value := self jsCall: "pow" on:Math with: (self getJsSlot: "_jsvalue") with: (arg getJsSlot: "_jsvalue").
        Debug print: value.
    ].
    3 pow: 5.
    
    `,scope)
})