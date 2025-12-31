import test from "node:test";
import {make_standard_scope} from "../src/standard.ts";
import {NumObj} from "../src/number.ts";
import {NilObj} from "../src/obj.ts";
import {cval} from "./common.ts";

test('array literals',() => {
    let scope = make_standard_scope()
    cval(`
        l := { 4 5 6 }.
        Debug equals: (l at: 0) with: 4.
        Debug equals: (l at: 1) with: 5.
        Debug equals: l size with: 3.
     `, scope)
})

test('dict literals', () => {
    let scope = make_standard_scope()
    cval(`
        p := { x:5 }.
        Debug equals: (p get: "x") with: 5.
        p.
    `,scope)

    cval(`
        v := { x:5, y: 6 }.
        Debug equals: (v get: "x") with: 5.
        Debug equals: (v get: "y") with: 6.
        v.
     `,scope)
})

test('list api', () => {
    let scope = make_standard_scope()
    cval(`[
        l := (List clone).
        Debug equals: l size with: 0.

        l add: 1.
        Debug equals: l size with: 1.
        Debug equals: (l at: 0) with: 1.

        l add: 3.
        Debug equals: l size with: 2.
        
        l at: 1 set: 8.
        Debug equals: l size with: 2.
        Debug equals: (l at: 1) with: 8.

        l do: [ n | n. ].

        l add: 5.
        
        Debug equals: (l first) with: 1.
        Debug equals: (l last) with: 5.
        
        Debug equals: l size with: 3.
        l push: 88.
        Debug equals: l size with: 4.
        l pop.
        Debug equals: l size with: 3.

        
        
        l3 := { 6, 7 }.
        // Debug equals: (l3 join: ",") with: "6,7".
        
        ] value.`,scope)
})

test('list selection',() => {
    let scope = make_standard_scope()
    cval(`
        list := { 1 2 3 4 5 }.
        
        // removeAt: 0
        Debug equals: (list at: 0) with: 1.
        Debug equals: (list size) with: 5.
        list removeAt: 0.
        Debug equals: (list at: 0) with: 2.
        Debug equals: list size with: 4.
        
        // collect / map
        list := { 1 2 3 }.
        Debug equals: (list at: 0) with: 1.
        l2 := list collect: [n | n * 2.].
        // array contains 2 4 6
        Debug equals: l2 size with: 3.
        Debug equals: (l2 at: 0) with: 2.
        Debug equals: (l2 at: 1) with: 4.

        // array contains 1 2 3
        // select and reject
        Debug equals: (list select: [n | n > 1. ]) size with: 2.
        Debug equals: (list select: [n | n > 2. ]) size with: 1.
        Debug equals: (list reject: [n | n > 2. ]) size with: 2.

        list := { 1 2 3 4 5 }.
        sum := list reduce: [a b | a + b ] with: 0.
        Debug equals: sum with: 15.
        
        list := { "a" "b" "c"}.
        join := list reduce: [a b | a + "," + b].
        Debug equals: join with: "a,b,c".
    
        88.    
    `,scope,{
        expected: NumObj(88),
        evalOnly:true,
    })
})

test("list sorting",() => {
    let scope = make_standard_scope()
    cval(`
        // unsorted
        list := { 3 1 5 2 4 }.
        
        Debug equals: (list at:0) with: 3.
        Debug equals: (list at:4) with: 4.
        
        // make new sorted list of numbers
        // using Number compare:
        list2 := (list sortedBy: [a b | a - b]).
        Debug equals: (list2 at:0) with: 1.
        Debug equals: (list2 at:4) with: 5.
        
        // make new reverse sorted list
        list3 := list sortedBy: [a b | b - a].
        Debug equals: list3 first with: 5.
        Debug equals: list3 last with: 1.
        
        // sort using the built in sort comparison block
        list4 := list sorted.
        nil
    
    `,scope, NilObj())
})

test('dict api',() => {
    let scope = make_standard_scope()
    cval(`[
        dict := Dict clone.
        dict at: "six" set: 6.
        dict at: "seven" set: 7.
        Debug equals: (dict at: "six") with: 6.
        Debug equals: (dict get: "seven") with: 7.
        dict size.

        keys := dict keys.
        Debug equals: (keys size) with: 2.
        Debug equals: (keys at: 0) with: "six".
        Debug equals: (keys at: 1) with: "seven".
        
        values := dict values.
        Debug equals: values size with: 2.
        Debug equals: (values at: 0) with: 6.
        Debug equals: (values at: 1) with: 7.

        
        values2 := (dict values collect: [n | n + 2.]).
        Debug equals: (values2 at: 0) with: 8.
        Debug equals: (values2 at: 1) with: 9.
        
    ] value.`,scope)
})

// test('set api',() => {
//     let scope = make_standard_scope()
//     cval(`
//         set := Set clone.
//
//         // size
//         set add: 1.
//         Debug equals: set size with: 1.
//
//         set add: 88.
//         Debug equals: set size with: 2.
//
//         // duplicates don't increase the size
//         set add: 88.
//         Debug equals: set size with: 2.
//
//         A := Set withAll: ({ 1 2 3 }).
//         B := Set withAll: ({ 3 4 5 }).
//         Debug equals: A size with: 3.
//         Debug equals: B size with: 3.
//         C := A - B.
//         Debug equals: C size with: 2.
//
//         D := A + B.
//         Debug equals: D size with: 5.
//
//         E := A intersect: B.
//         Debug equals: E size with: 1.
//
//         67.
//
//     `,scope, NumObj(67))
// })

test('array common protocol',() => {
    let scope = make_standard_scope()
    // cval(`[
    //     l ::= List clone.
    //     l add: 5.
    //     // Debug print: (l print).
    // ] value .`,scope)
    // cval(`({ 4 5 }) print.`,scope,StrObj('6'))
    // cval(`6 == 7.`,scope,BoolObj(false))
    // cval(`8 == 8.`,scope,BoolObj(true))
    // cval(`8 == '8'.`,scope,BoolObj(false))
})

