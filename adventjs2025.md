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
      (gift at: "quantity") times: [ q |
         output add: (gift at: "toy").
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




## 3: Help the Intern


self makeSlot: "drawGift:symbol:" with: [size symbol |
  (size < 1) ifTrue: [^""].
  output := "".
  output := output + (symbol repeat: size).
  output := output + "\n".
  
  1 range: size-1 do: [i |
    output := output + symbol.
    output := " " repeat: size-2.
    output := output + symbol.
    output := output + "\n".
  ].
  
  output := output + (symbol repeat: size).
  ^ output.
].

self drawGift: 4 symbol: "*".
self drawGift: 3 symbol: "#".
self drawGift: 2 symbol: "-".
self drawGift: 1 symbol: "+".

