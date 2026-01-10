Global makeSlot: "PointProto" with: (Object clone).
PointProto makeSlot: "name" with: "PointProto".
PointProto makeSlot: "magnitude" with: [
    xx := self x * self x.
    yy := self y * self y.
    (yy + xx) sqrt.
].
PointProto makeSlot: "+" with: [ a |
    Point x: (self x + a x) y: (self y + a y).
].
PointProto makeSlot: "print" with: [ a |
    "Point" + self x + "," + self y + ")".
].

Global makeSlot: "Point" with: (PointProto clone).
Point make_data_slot: "x" with: 0.
Point make_data_slot: "y" with: 0.
Point makeSlot: "name" with: "Point".

Point makeSlot: "x:y:" with: [ x y |
    pp := Point clone.
    pp x: x.
    pp y: y.
    pp.
].

pt1 := Point x: 5 y: 6.
// there is crap in the stack, so it doesn't assign to the literal string 'pt1'.
Debug equals: pt1 x with: 5.

pt2 := Point x: 5 y: 8.
Debug equals: pt2 y with: 8.

pt3 := pt1 + pt2.
Debug equals: pt3 x with: 10.

pt4 := Point x: 1 y: 1.
// Debug equals: pt4 magnitude with: 1.414213563730951.


88.
