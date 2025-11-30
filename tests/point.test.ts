import test from "node:test";
import {make_standard_scope} from "../src/standard.ts";
import {cval} from "../src/eval.ts";
import {NumObj} from "../src/number.ts";

test('Point class',() => {
    let scope = make_standard_scope()

    cval(`
        Global makeSlot "PointProto" (Object clone).
        PointProto makeSlot "name" "PointProto".
        PointProto makeSlot "magnitude" [
            self makeSlot "xx" ((self x) * (self x)). 
            self makeSlot "yy" ((self y) * (self y)). 
            ((self yy) + (self xx)) sqrt.
        ].
        PointProto makeSlot "+" [ a |
            Point make ((self x) + (a x)) ((self y) + (a y)).
        ].
        PointProto makeSlot "print" [
            (("Point(" + (self x)) + ("," + (self y))) + ")".
        ].
        Global makeSlot "Point" (PointProto clone).
        Point make_data_slot: "x" 0.
        Point make_data_slot: "y" 0.
                                
        Point makeSlot "name" "Point".
        Point makeSlot "make" [ x y |
            pp ::= (Point clone).
            pp x: x.
            pp y: y.
            pp.
        ].

        pt ::= (Point make 5 5).
        Debug equals: (pt x) 5.
        Debug equals: (pt y) 5.
        
        // setters
        pt x: 6.
        pt y: 5.
        Debug equals: (pt x) 6.
        Debug equals: (pt y) 5.
        
        // magnitude
        pt x: 0.
        pt y: 5.
        Debug equals: (pt magnitude) 5.
        
        pt2 ::= (Point make 1 1).
        
        // addition
        pt3 ::= (pt + pt2).
        Debug equals: (pt3 x) 1.
        Debug equals: (pt3 y) 6.

        88.
    `,scope,
        // StrObj("Point(6,6)")
        NumObj(88)
    )
})
