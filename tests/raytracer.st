Global makeSlot: "VectorProto" with: Object clone.

VectorProto understands: "+" with: [v |
    Vector x: self x + v x
           y: self y + v y
           z: self z + v z.
].

Global makeSlot: "Vector" with: VectorProto clone.

Vector make_data_slot: "x" with: 0.
Vector make_data_slot: "y" with: 0.
Vector make_data_slot: "z" with: 0.

Vector understands: "x:y:z:" with: [x y z |
    v := Vector clone.
    v x: x.
    v y: y.
    v z: z.
    v.
].


v := Vector x:0 y:0 z:0.
Debug equals: v x with: 0.
a := Vector x:1 y:2 z:3.
b := Vector x:3 y:2 z:1.
c := a + b.



