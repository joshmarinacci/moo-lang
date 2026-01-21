// create methods on the VectorProto
Global makeSlot: "VectorProto" with: Object clone.
VectorProto understands: "magnitude" with: [
    xx := self x * self x.
    yy := self y * self y.
    (xx + yy) sqrt.
].
VectorProto understands: "+" with: [a |
    Vector x: (self x + a x) y: (self y + a y) z: (self z + a z).
].
VectorProto understands: "-" with: [a |
    Vector x: (self x - a x) y: (self y - a y) z: (self z - a z).
].
VectorProto understands: "scale:" with: [s |
    Vector x: (self x * s) y: (self y * s) z: (self z * s).
].

// put data on the real Vector
Global makeSlot: "Vector" with: VectorProto clone.
Vector make_data_slot: "x" with: 0.
Vector make_data_slot: "y" with: 0.
Vector make_data_slot: "z" with: 0.
Vector understands: "x:y:z:" with: [x y z |
    vv := Vector clone.
    vv x: x.
    vv y: y.
    vv z: z.
    vv.
].

// unit tests
[
  a := Vector x: 1 y: 1 z: 1.
  Debug equals: a x with: 1.
    //  Test assert: a x equals: 1.
  b := Vector x: 2 y: 2 z: 2.
  c := a + b.
  Debug equals: c x with: 3.

  c := a - b.
  Debug equals: c y with: -1.

  c := a scale: 5.
  Debug equals: c z with: 5.

  Debug print: "done".

] value.
