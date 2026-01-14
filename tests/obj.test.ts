import test from "node:test";
import {Obj} from "../src/obj.ts";
import {make_standard_scope} from "../src/standard.ts";
import {NumObj} from "../src/number.ts";
import {StrObj} from "../src/string.ts";
import {cval} from "./common.ts";

test("clone",() => {
    let scope:Obj = make_standard_scope()
    cval('Object clone',scope,{
        bytecodeOnly:true
    })
})
// test("catch doesNotUnderstand",() => {
//     let scope:Obj = make_standard_scope()
//     cval(`
//         foo := Object clone.
//         foo makeSlot: "doesNotUnderstand:" with: [msg |
//             Debug print: "Foo: inside does not understand".
//             Debug print: msg.
//             67.
//         ].
//         // Debug equals: (foo bar) with: 67.
//         foo bar.
//     `, scope, NumObj(67))
// })
test("send message programmatically",() => {
    let scope:Obj = make_standard_scope()
    cval(`67 perform: 'print'`,scope,{expected:StrObj("67"), debug:false})
    cval(`67 perform: '+' with: 1.`,scope,{expected:NumObj(68), debug:false})
})
// test("redispatch message",() => {
//     let scope:Obj = make_standard_scope()
//     cval(`
//         foo := Object clone.
//         foo make_data_slot: "delegate" with: 67.
//         foo makeSlot: "doesNotUnderstand:" with: [ msg |
//             self delegate perform: msg selector withArgs: msg arguments.
//         ].
//
//         v := foo + 1.
//         Debug equals: v with: 68.
//         v
//     `,scope,{expected:NumObj(68)})
// })
// test("redispatch message 2",() => {
//     let scope:Obj = make_standard_scope()
//     cval(`
//         foo := Object clone.
//         foo make_data_slot: "delegate" with: 67.
//         foo makeSlot: "doesNotUnderstand:" with: [ msg |
//             self delegate send: msg.
//         ].
//
//         v := foo + 1.
//         Debug equals: v with: 68.
//         v
//     `,scope,NumObj(68))
// })