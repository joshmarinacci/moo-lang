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
```

## 3: Help the Intern

```smalltalk
self makeSlot: "StringBuilder" with: Object clone.
StringBuilder setObjectName: "StringBuilder".
StringBuilder make_data_slot: "v" with: "".
StringBuilder makeSlot: "make:" with: [str |
    s := StringBuilder clone.
    s v: str.
    s.
].
StringBuilder makeSlot: "append:" with: [str |
    self v: (self v + str).
    self.
].
foo := StringBuilder make: "foo".
foo append: "blah".

self makeSlot: "drawGift:symbol:" with: [size symbol |
    (size < 1) ifTrue: [^""].
    output := StringBuilder make:"".
    output append: (symbol repeat: size).
    output append: "\n".

    1 range: size-1 do: [i |
        output append: symbol.
        output append: (" " repeat: size-2).
        output append: symbol.
        output append: "\n".
    ].

    output append: (symbol repeat: size).
    ^ output v.
].

self drawGift: 4 symbol: "*".
self drawGift: 3 symbol: "#".
self drawGift: 2 symbol: "-".
self drawGift: 1 symbol: "+".

```


## 6: Matching Gloves

```typescript
type Glove = { hand: 'L' | 'R'; color: string }

function matchGloves(gloves: Glove[]): string[] {
  const matches = []
  const stack:Array<Glove> = []
  gloves.forEach(gl => {
    let index = stack.findIndex(g => g.hand != gl.hand && g.color == gl.color)
    if (index >= 0) {
        stack.splice(index,1)
        matches.push(gl.color);
    } else {
      stack.push(gl)
    }
  })
  // Code here
  return matches
}
```

```smalltalk
self makeSlot: "matchGloves:" with: [ gloves |
    matches := List clone.
    stack   := List clone.
    gloves forEach: [gl |
        index := stack findIndex: [g | ((g at: 'hand') != (gl at: 'hand')) && ((g at: 'color') == (gl at: 'color')) ].
        index >= 0 ifTrue: [
            stack removeAt: index.
            matches push: (gl at: color).            
        ] ifFalse: [
            stack push: gl.
        ].
    ]. 
    matches.
].

const gloves = {
  { hand: 'L', color: 'red' },
  { hand: 'R', color: 'red' },
  { hand: 'R', color: 'green' },
  { hand: 'L', color: 'blue' },
  { hand: 'L', color: 'green' }
}

self matchGloves: gloves.

```

## 7: Decorating the Tree

```typescript
function drawTree(height: number, ornament: string, frequency: number): string {
  // Code here
  let rows = []
  let count = 0;
  for(let r = 0; r<height; r++) {
    let row = ''
    row += ' '.repeat((height-r-1))
    for(let o =0; o<r*2+1; o++) {
      count ++
      if (count % frequency == 0) {
        row += ornament
      } else {
        row += '*'  
      }
    }
    rows.push(row)
  }

  rows.push(' '.repeat(height-1)+'#')
  return rows.join('\n')
}

drawTree(5, 'o', 2)
//     *
//    o*o
//   *o*o*
//  o*o*o*o
// *o*o*o*o*
//     #

```

```smalltalk
self understands: "drawTreeHeight:ornament:frequency" with: [ height ornament frequency |
    count := 0
    rows := List clone.
    0 to: height do: [r |
        row := ''.
        row = row + (' ' repeat: height - r -1).
        0 to: (r*2+1) do: [o |
            count := count + 1.
            ch := (count mod: frequency) == 0 ifTrue: ornament ifFalse: '*'.
            row = row + ch.
        ].
        rows push: row.     
    ].
    rows push: (" " repeat: height - 1) + "#".
    rows join: "\n".
  ].
].
self drawTreeHeight: 5 ornament: 'o' frequency: 2.
```

