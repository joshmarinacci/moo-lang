




# next up

- [x] Lists are having a shared js list array.
- [ ] collections
  - [x] List, Dict, Set == by reference to start
  - [x] new JSset impl
  - [ ] List print. impl in ST by mapping to str then joining with add.
  - [ ] Dict print
  - [ ] Set print
- [x] Object ==  same name, same hashcode. same JS ref?
- [ ] expose Object isKindOf:
  - this uses boolean object, so we need to add it later in the init process.
- [ ] units
  - [x] 10 unit: “meters”
  - [x] Turns into UnitNumber with new arithmetic functions
  - [x] Print turns into string
  - [ ] Number withUnit: unit. returns UnitNumber
  - [ ] 10m * 2ft as: “square inches”
  - [ ] UnitNumber as: unit.  returns new number with the unit conversion, or throws error. ex: 10m * 2ft as "square inch". 
  - [ ] unit: sets the unit. turns string into proper unit object. can parse dimensions too.
  - [ ] make Unit enum. Meters, Millimeters, Feet, Inches
  - [ ] update parser to support 10.5_meters shorthand.
  - [ ] Number_unitname is sugar for UnitNumber amount: number unit: unitname.


* delegation
  * capture does not understand to resend a message to another target.
  * number.append doesn't exist. is caught. resends to number.print.
  * `5 append: 5` returns the *string* `55`.
  * Number.doesNotUnderstand [mess args | (self print) sendMessage mess args.


## GUI and GFX and Output

* Design simple gfx and input model for interactive code browser
  - [ ] Show list of current objects and methods
  - [x] Manipulate the DOM directly
  - [x] DomProxy to access the dom.
  - [ ] AsDOM to render self to an html element
  - [ ] View but not edit source code
  - [ ] Splat the entire object graph to and from JSON and local storage
  - [ ] Render. List of classes. Project to DOM LI
  - [ ] Button to trigger loading and rendering the scope
  - [ ] ObjectBrowser render: DOMProxy.  
    - [ ] list all objects in global scope 


## impl plan
* [ ] Smalltalk class browser:
* [x] Vbox and hbox have mirror dom elements and forward commands to their delegate
* [x] Dom element: toggle classname on any dom element, append element to self
* [x] Dom proxy: create element with name, id, and classes
* [x] HTML List has list items and delegate. Forwards commands to delegate.
  * [x] Logic receives the real event
  * [x] Logic triggers SUL and MUL to redraw selves with the right arguments.
  * [x] render methods shouldn't modify state.
  * [x] add nicely formatted div to show the source of the selected object.

* [ ] Common widget class with delegate, dom mirror, send command method.
* [ ] List of objects, list of methods on selected object. Inside an hbox.



## parser
Fix precedence of parsing so that we don't need so many parens
 unary > binary > keyword

next to fix
* [x] fully recursive with group
* [x] block literal
* [x] statement is expr followed by a period
* [x] return is exp prefixed by a caret. non-local return tests
* [x] assignment can have any expression on the right hand side but only id on the right side
* [x] block literal eval args aren't working
* [x] list api
* [x] dict api
* [x] comments again
* [x] set api
* [x] list literal
* [x] dict literals
* [x] images
* [x] parse list of statements / block body content
* [x] fix precedence so `Debug print: "foo" + "bar"` will print 'foobar' by evaluating the binary expression first.


## Blocks
* [x] delete dead cod
* [x] make sure all native methods are extending a common Block class
* [ ] Remove the direct call to method function. Instead call something on the Block which calls the method function. Maybe a new JS base class of Block? 
* [x] ActivationObj overrides the lookup_method() to customize self.
* [x] Use a constant for the name _jsvalue and make sure all native wrapper methods are using it.
* [x] Implement 55 square in pure ST code. `self value star self value`.

* [x] Create a generic JS invoker so the DOM can do  
* [x] `self doNativeCall: ‘append’ target: self _jsvalue with: child _jsvalue`.
* [x] Implement pow in pure ST code. `self doNativeCall: pow target: Math with: self _jsvalue with: arg0 _jsvalue`.
* [x] change makeSlot to understands: ?



## Ideas

* How can do worlds? be able to 'fork' the world, do crazy stuff, 
  then diff between the world and it's parent world. should be lazy copy on write.
* more stuff


## Sorting

In the JS world we sort using a comparator which takes two objects and returns -1, 0, or 1 if the first object
is less than, equal to, or greater than the second object [1]. I propose to reuse this system. Every object
can respond to a `compare:` method which returns -1, 0, or 1 if the receiver is less than, equal to, or greater
than the second object.  To make this work we pass a comparator block as arguments to the various sorting
functions.  


[1](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description)

I prefer objects to always return new objects instead of modifying themselves, so List will have
a sorted function which returns a new sorted list. selfSorted sorts the object itself. sortedBy takes
a comparator block. If there is no comparator block then it uses the default one which calls compare on
the objects.

Examples:

```smalltalk

// unsorted
list := { 1 3 5 2 4 }.

// make new sorted list of numbers
// using Number compare:
list2 := list sorted.

// make new reverse sorted list
list3 := list sortedBy: [a b | b - a].

// sort strings
list := { "foo" "bar" "qux" }.
// sort strings using String compare:
list2 := list sorted.

people := {
  { first:'Alice, last:'Smith'},
  { first:'Bob', last:'Jones' },
  { first:'Clair, last:'Martin'},
}.

// returns the same list because we don't know how to sort people 
list2 := list sorted.
// sort by first name
list3 := list sortedBy: [a b | (a at:first) - (b at: first)].
// sort by last name
list4 := list sortedBy: [a b | (a at:last) - (b at: last)].

```


Number compare: subtracts self from argument.
String compare: subtracts self from argument.
Boolean compare: returns 0 if same otherwise -1.

Points could be sorted by magnitude
Dates could be sorted by before or after


## next small fixes

* [x] support parsing list literals with and without commas between them
* [x] make syntax highlighting grammar do single and double quote strings
* [x] add command slash for toggling comments in the editor.
* [x] dict at: as well as dict get:
* [x] `number times: [n| Debug print n. ]`
* [x] string repeat: number.
* [x] make editor taller vertically
* [ ] assigning a variable inside a block that was declared outside a block isn't setting properly.
* [ ] doesNotUnderstand is broken becuase treewalk isn't calling when it doesn't find the slot 

## bytecode issues
* [x] `list := { 1 2 3 4 5 }.` fails
* [x] store the uncompiled code BytecocdeMethod impl.
* [x] show the values in the current scope that can be looked up
