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

VectorProto understands: "dot:" with: [v|
    (self x * v x) + (self y * v y) + (self z * v z).
].

VectorProto understands: "cross:" with: [b|
    Vector x:((self y * b z) - (self z * b y))
           y:((self z * b x) - (self x * b z))
           z:((self x * b y) - (self y * b x)).
].

VectorProto understands: "unit" with: [
    self scale: ( 1 / self len).
].

VectorProto understands: "len" with: [
    (self dot: self) sqrt.
].

//VectorProto understands: "reflect" with: [
//    self normal scale (a dot normal).
//].


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
Vector understands: "Zero" with: [
    Vector x:0 y:0 z:0.
].

Vector understands: "Up" with: [
    Vector x:0 y:1 z:0.
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

  d := a dot: b.
  Debug equals: d with: 6.

//  Debug equals: (a len) with: 1.732. // close

  Debug print: "done".

] value.


Global makeSlot: "Sphere" with: Object clone.

Sphere make_data_slot: "point" with: (Vector x:0 y:0 z:0).
Sphere make_data_slot: "color" with: (Vector x:0 y:0 z:0).
Sphere make_data_slot: "specular" with: 0.
Sphere make_data_slot: "lambert" with: 0.
Sphere make_data_slot: "ambient" with: 0.
Sphere make_data_slot: "radius" with: 0.
Sphere understands: "intersect:" with: [ray |
//    Debug print: "inside sphere intersect".
    eye_to_center := self point - ray point.
//    Debug print: "eye to center " + eye_to_center.
    v := eye_to_center dot: ray vector.
    eoDot := eye_to_center dot: eye_to_center.
    discriminant := (self radius * self radius) - eoDot + (v * v).
//    Debug print: "discriminant is " + discriminant.
    (discriminant < 0) ifTrue: [ ^ Nil. ]
                       ifFalse:[ ^ (v - discriminant sqrt). ].
].
Sphere understands: "normalAt:" with: [pos |
    (pos - self point) unit.
].


Global makeSlot: "Ray" with: Object clone.
Ray make_data_slot: "point" with: (Vector x:0 y:0 z:0).
Ray make_data_slot: "vector" with: (Vector x:0 y:0 z:0).

Debug print: "made Ray".


Debug print: "made Sphere".

Global makeSlot: "Camera" with: Object clone.
Camera make_data_slot: "point" with: (Vector x:0 y:0 z:0).
Camera make_data_slot: "fieldOfView" with: 0.
Camera make_data_slot: "vector" with: (Vector x:0 y:0 z:0).

Debug print: "made Camera".


Global makeSlot: "Intersection" with: Object clone.
Intersection make_data_slot: "distance" with: (Number Inf).
Intersection make_data_slot: "target" with: Nil.

Global makeSlot: "Scene" with: Object clone.
Scene make_data_slot: "lights" with: List clone.
Scene make_data_slot: "objects" with: List clone.

Scene understands: "intersect:" with:[ray |
//    Debug print: "in intersect".
    closest := Intersection clone.
//    Debug print: closest.
    (self objects) do: [obj |
//        Debug print: "looking at " + obj.
        dist := obj intersect: ray.
//        Debug print: "intersected the object".
//        Debug print: "compare distance " + dist + " vs " + closest distance.
        (dist isNil) ifFalse: [
//            Debug print:"not nil".
            (dist < (closest distance)) ifTrue: [
//                Debug print: "closest here is " + closest.
                closest distance: dist.
                closest target: obj.
            ].
        ].
    ].
//    Debug print: "final closest is " + closest.
    closest.
].

Global makeSlot: "WHITE" with: (Vector x:255 y: 255 z: 255).

Scene understands: "trace:depth:" with:[ray depth |
//    depth > 1 ifTrue: [^ WHITE].
    depth > 1 ifTrue: [^ 0].
    inter := self intersect: ray.
//    (inter distance == Number Inf) ifTrue: [^ WHITE].
    (inter distance == Number Inf) ifTrue: [^ 0] ifFalse: [^ 1].
    pointAtTime := (ray point) + ((ray vector) scale: (inter distance)).
//    Debug print: "point at time is " + pointAtTime.
    normal := (inter target) normalAt: pointAtTime.
    self calculateSurfaceColor: ray object: inter target pointAtTime: pointAtTime normal: normal depth: depth.
].

Scene understands: "calculateSurfaceColor:object:pointAtTime:normal:depth:" with: [ray object pointAtTime normal depth |
//    Debug print:"calculating the surface color".
    lam := 0.

//    (object lambert > 0) ifTrue: [
//        Debug print: "doing lambert".
//    ].
//    (object specular > 0) ifTrue: [
//        Debug print: "doing specular".
//    ].

    color :=
        ((object color) scale: object lambert) +
        ((object color) scale: object ambient).
//    Debug print: "returning color " + color.
    color.
].

Debug print: "made Scene".


[
    Debug print: "doing example".
    camera := Camera clone.
    camera point: (Vector x:0 y:1.8 z: 10).
    camera fieldOfView: 45.
    camera vector: (Vector x:0 y:3 z:0).

    Debug print: "setup the camera".

    ray := Ray clone.
    ray point: camera point.
    ray vector: Vector Zero.

    Debug print: "setup the ray".

    sphere1 := Sphere clone.
    sphere1 point: (Vector x: 0 y:3.5 z: -3).
    sphere1 color: (Vector x: 155 y: 200 z: 155).
    sphere1 specular: 0.2.
    sphere1 lambert: 0.7.
    sphere1 ambient: 0.1.
    sphere1 radius: 3.

    scene := Scene clone.
    (scene objects) push: sphere1.

    Debug print: "cloned a scene".

    eyeVector := ((camera vector) - (camera point)) unit.
    vpRight   := (eyeVector cross: (Vector Up)) unit.
    vpUp      := (vpRight cross: eyeVector) unit.

    width := 5.
    height := 5.
    fovRadians := camera fieldOfView / 2 * 3.1457 / 180.
    heightWidthRatio := 1.
    halfWidth := fovRadians tan.
    halfHeight := heightWidthRatio * halfWidth.
    cameraWidth := halfWidth * 2.
    cameraHeight := halfHeight *2.
    pixelWidth := cameraWidth / ( width -1).
    pixelHeight := cameraHeight / (height -1).

    Debug print: "setup vectors".

    ray vector: (Vector x:0 y:0 z: 5) unit.

    0 to: 5 do: [y |
        0 to: 5 do: [ x |
//            Debug print:"pixel at " + x + " " + y.
            xcomp := vpRight scale: (x * pixelWidth - halfWidth).
            ycomp := vpUp    scale: (y * pixelHeight - halfHeight).
            ray vector: (eyeVector + xcomp + ycomp) unit.
            color := scene trace: ray depth: 0.
            Debug print: color.
        ].
    ].
] value.
