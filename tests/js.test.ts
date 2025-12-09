import test from "node:test";
import {Obj} from "../src/obj.ts";
import {make_standard_scope} from "../src/standard.ts";
import {mval} from "./eval.test.ts";

test('native JS api',() => {
    let scope: Obj = make_standard_scope()
    // Math.pow(x,y)
    // allow identifiers beginning with underscore
    // implement understands:with: as a dupe of makeSlot:with:
    // implement doNativeCall:target:with
    // implement doNativeCall:target:with:with:
    // implement lookupNativeGlobal:. Only can return Math.
    // whatever is returned should be auto converted back to an ST object?
    mval(`
    Number understands: "toString" with: [ arg |
        Debug print: (self doNativeCall: "toString" on: (self _jsvalue)).
    ].
    88 toString. // should print 88.
    
    Number understands: "pow" with: [ arg |
        Math := self jsLookupGlobal: "Math".
        Debug print: (self jsCall: "pow" on:Math with: (self _jsvalue) with: (self _jsvalue)). 
    ].
    
    DomElement understands: "append" with: [ child |
        self jsCall: "append" on: (self _jsvalue) with: (child _jsvalue).
    ].
    `,scope)
})