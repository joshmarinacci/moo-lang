import test from "node:test";
import {make_standard_scope} from "../src/standard.ts";
import {NumObj} from "../src/number.ts";
import {cval} from "./common.ts";

test('set pixels color',() => {
    const scope = make_standard_scope();
    cval(`
        Color make_data_slot: "teal" with: (Color from: { 0 255 255 }).
        Color make_data_slot: "yellow" with: (Color from: { 255 255 0 }).
        Color make_data_slot: "magenta" with: (Color from: { 255 0 255 }).

        image := Image width: 10 height: 10.
        Debug equals: image width with: 10.
        Debug equals: image height with: 10.

        blue := Color from: { 0 0 255 }.

        image setPixelAt: 0 y:0 color: Color red.
        image setPixelAt: 1 y:0 color: Color green.
        image setPixelAt: 2 y:0 color: Color blue.
        image setPixelAt: 3 y:0 color: Color white.
        image setPixelAt: 4 y:0 color: Color black.
        image setPixelAt: 5 y:0 color: Color teal.
        image setPixelAt: 6 y:0 color: Color yellow.
        image setPixelAt: 7 y:0 color: Color magenta.
        image save: "output/foo.png".
        88.
    `,scope,NumObj(88));
})
// test('fill image',() => {
//     const scope = make_standard_scope()
//     cval(`[
//         image := Image width: 10 height: 10.
//         image fill: [x y |
//             (x mod: 2) == 0 ifTrue: [ ^ Color red. ].
//             (y mod: 2) == 0 ifTrue: [ ^ Color green. ].
//             Color black.
//           ].
//         image save: "output/bar.png".
//         88.
//      ] value.`, scope, NumObj(88))
// })
