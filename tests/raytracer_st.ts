import test from "node:test";
import {make_standard_scope} from "../src/standard.ts";
import {NumObj} from "../src/number.ts";
import {cval} from "./common.ts";

test('eval vector class',() => {
    let scope = make_standard_scope()
    cval(`[
        Global makeSlot: "Vector" with: (ObjectBase clone).
        Vector setObjectName: "Vector".
        Vector makeSlot: "x" with: 0.
        Vector makeSlot: "y" with: 0.
        Vector makeSlot: "z" with: 0.
        Vector makeSlot: "x:" with: [xx |
            self setSlot: "x" with: xx.
        ].
        Vector makeSlot: "y:" with: [yy |
            self setSlot: "y" with: yy.
        ].
        Vector makeSlot: "z:" with: [zz |
            self setSlot: "z" with: zz.
        ].
        Vector makeSlot: "make" with: [ xx yy zz |
            self makeSlot: "v" with: (Vector clone).
            v setSlot: "x" with: xx.
            v setSlot: "y" with: yy.
            v setSlot: "z" with: zz.
            v.
        ].
        Vector makeSlot: "+" with: [a |
          Vector make: 
                ((a x) + (self x))
                ((a y) + (self y))
                ((a z) + (self z)).
        ].
        Vector makeSlot: "-" [b |
          Vector make 
                ((self x) - (b x))
                ((self y) - (b y))
                ((self z) - (b z)).
        ].
        Vector makeSlot: "dot" [a |
                (((a x) * (self x)) +
                ((a y) * (self y))) +
                ((a z) * (self z)).
        ].
        Vector makeSlot "cross" [b |
          Vector make 
                ( ((self y) * (b z)) - ((self z) * (b y)) )
                ( ((self z) * (b x)) - ((self x) * (b z)) )
                ( ((self x) * (b y)) - ((self y) * (b x)) )
                .
        ].
        a ::= (Vector make 1 1 1).
        
        // check the setters
        a x: 55.
        Debug equals: (a x) 55.
        a y: 66.
        Debug equals: (a y) 66.
        a z: 5.
        Debug equals: (a z) 5.
        
        a ::= (Vector make 1 1 1).
        b ::= (Vector make 6 7 8).
        c ::= (a + b).
        Debug equals: (c x) 7.
        Debug equals: (c y) 8.
        Debug equals: (c z) 9.
        
        99.
    ] value.`,scope,NumObj(99))

    cval(`[
        // test add
        a ::= (Vector make 1 1 1).
        b ::= (Vector make 6 7 8).
        c ::= (a + b).
        Debug equals: (c x) 7.
        Debug equals: (c y) 8.
        Debug equals: (c z) 9.

        // test subtract
        c ::= (a - b).
        Debug equals: (c x) -5.
        Debug equals: (c y) -6.
        Debug equals: (c z) -7.
        
        // test dot
        Debug equals: (a dot b) 21.
        
        // test cross
        c ::= (a cross b).
        Debug equals: (c x) 1.
        Debug equals: (c y) (0 - 2).
        Debug equals: (c z) 1.
                
        99.
    ] value.`,scope,NumObj(99))
})
