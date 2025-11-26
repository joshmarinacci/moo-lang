import test from "node:test";
import {cval, ListObj, make_default_scope, NumObj} from "./eval2.ts";

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
    // cval(`{ 4 5 }.`,scope,ListObj(NumObj(4)))
})

