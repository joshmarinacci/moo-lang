
dom clear.


logic := Object clone.
Global makeSlot: "logic" with: logic.

logic make_data_slot: "selectedObject" with: "Number".
logic make_data_slot: "selectedMethod" with: "+".

logic makeSlot: "sendCommand:with:" with: [ cmd arg |
//    Debug print: ("logic got command " + cmd).
    (cmd == "selectedObject") ifTrue: [
        self selectedObject: arg.
        self renderObjects.
        self renderMethods.
    ].
    (cmd == "selectedMethod") ifTrue: [
        self selectedMethod: arg.
        self renderMethods.
        self renderSource.
    ].
].

logic makeSlot: "renderObjects" with: [
    ul := self objects.
    ul clear.
    sym := self selectedObject.
    Global getSlotNames do: [k v |
        li := dom make: "li".
        li innerHtml: k.
        (sym == k) ifTrue: [
           li addClass: "selected".
        ].
        li onClick: [
            logic sendCommand: "selectedObject" with: k.
        ].
        ul append: li.
    ].
].

logic makeSlot: "renderMethods" with: [
    ul := self methods.
    ul clear.
    sym := self selectedObject.
    obj := (Global getSlot: sym).
    meth := self selectedMethod.
    obj getSlotNames do: [k v |
        li := dom make: "li".
        li innerHtml: k.
        (meth == k) ifTrue: [
           li addClass: "selected".
        ].
        li onClick: [
            logic sendCommand: "selectedMethod" with: k.
        ].
        ul append: li.
    ].
].


logic makeSlot: "renderSource" with: [
//  Debug print: ("showing the source to " + self selectedObject + " " + self selectedMethod).
  obj := (Global getSlot: (self selectedObject)).
//  Debug print: "got the object".
//  Debug print: obj.
//  Debug print: "selected method is".
  methName := self selectedMethod.
//  Debug print: methName.
  methObj := obj getSlot: methName.
//  Debug print: "method object is".
//  Debug print: methObj.
  (logic source) innerHtml: (methObj print).
].


// wrapper div
hbox := dom make: "div" class:"hbox".
dom append: hbox.

// column for classes
column := dom make: "div" class: "vbox".
column addClass: "scroll".
hbox append: column.

ul := dom make: "ul".
column append: ul.
logic make_data_slot: "objects" with: ul.


// column for classes
column := dom make: "div" class: "vbox".
column addClass: "scroll".
hbox append: column.

ul := dom make: "ul".
column append: ul.
logic make_data_slot: "methods" with: ul.


source := dom make: "div" class: "source".
source innerHtml: "source code to method".
hbox append: source.
logic make_data_slot: "source" with: source.


logic renderObjects.
logic renderMethods.
logic renderSource.



