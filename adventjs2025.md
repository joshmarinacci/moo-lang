## Advent of JS


### 1 broken toys
```smalltalk
self makeSlot: "filterGifts:" with: [ gifts |
  gifts select: [g | (g contains: "#") not ].
].
self filterGifts: { "car" "doll#arm" "ball" "#train" }.
self filterGifts: {'#broken' '#rusty'}.
self filterGifts: {}.
```


### 2: Manufacture the Toys
```smalltalk

self makeSlot: "manufactureGifts:" with: [ gifts |
   output := List clone.
   gifts do: [ gift |
      0 range: (gift get: "quantity") do: [ q |
         output add: (gift get: "toy").
      ].
   ].
   output.
].


production1 := {
  { toy: 'car' quantity: 3 }
  { toy: 'doll' quantity: 1 }
  { toy: 'ball' quantity: 2 }
}.
self manufactureGifts: production1.

production2 := {
  { toy: 'train', quantity: 0 }, // not manufactured
  { toy: 'bear', quantity: -2 }, // neither
  { toy: 'puzzle', quantity: 1 }
}
self manufactureGifts: production2.

production3 := {}.
self manufactureGifts: production3.




