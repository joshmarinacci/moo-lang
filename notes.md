
## Delegation

* capture does not understand to resend a message to another target.
* number.append doesn't exist. is caught. resends to number.print.
* `5 append: 5` returns the *string* `55`.
* Number.doesNotUnderstand [mess args | (self print) sendMessage mess args.

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

## Message Sends

A message send is done with an activation block. The interpreter will do the following for every message send.

* move the message arguments off the stack into the activation block.
* move the method itself and the receiver off of the stack and into the activation block.
* push the activation block onto the stack.
* dispatch the method.

Once control returns to the method where the message was sent there should be a return-message
bytecode after the send-message bytecode.  This will

* pop the activation off of the stack.
* call cleanup() on the method in the activation stack.

Inside the dispatch a bytecode method will:

* put the current bytecode into the activation
* put the current scope into the activation
* put the current PC (program counter) into the activation
* set new bytecode, scope, and stack.
* set the PC to 0.
* put the arguments to the method into the current scope so they can be looked up.

When a bytecode method is done it's cleanup will be called.

* if the activation has a return value, the return value will be put onto the stack.


When a NativeMethod runs, it has different implementations of dispatch and cleanup. Dispatch
will 

* run the native JS function method with the receiver and args from the activation.
* if the native function returns an object it will be put into the return slot of the activation.

In clean up it will

* if there is a return value, put it on the stack.

there is also a FakeNativeMethod which does the exact same things as NativeMethod.


Bytecode methods will inject an extra bytecode for `return-from-bytecode-call` which will
be executed as the last thing in a bytecode method before it returns. This will:

* pop the return value from the stack.
* pop the activation record from the stack.
* restore the bytecode, scope, and pc to the context
* put the return value into the activation
* put the activation record back on the stack.



All of the above ensures that before control changes for a message send,
* arguments have been removed from the stack
* an activation is at the top of the stack containing all necessary information

and when control returns
* there is an activation at the top of the stack.
* it is removed and it's cleanup method is called.
* any return value from the method is left on the stack.


we get extra stuff on the stack when a method returns null. when completing a
method we should clear the stack back to what it was before, which should nuke
any remaining values, right?

putting the arguments after the method on the stack might be a problem if
something in between drops something on the stack.

## Random

* How can do worlds? be able to 'fork' the world, do crazy stuff,
  then diff between the world and it's parent world. should be lazy copy on write.
* more stuff



# Plan

[x] make execute_op get the op internally, not have it passed in
[x] use VMState which wraps ctx as the parameter
[x] make method dispatch use the vmstate
[x] disable eval tree. only bytecode now.
[x] make VMState allocate the context internally

[x] consolidate native method and fake native method
[x] make sure everything is using native method now. 
[x] get read of old treewalking eval 

[ ] use context push and pop to set the PC, clear the stack, and return normally
[ ] restore programmatic calling with perform
[ ] restore non-local return 




## dispatch documentation

### Eval block obj
* create an activation object. 
* push act onto current context stack
* push new context with new stack and bytecode. use act as the scope
* 
* dispatch the actual method
* keep running the vm by executing operations
* 
* pop the context
* pop the value on the current context stack
* return the act return slot

### regular bytecode on bytecode method
* assemble the args
* create an activation object
* push act onto current context stack
* 
* dispatch the actual method
* set the parent of the act to be the receiver
* push new context with new stack and bytecode. use act as the scope
* 
* pop the return value off of the stack
* get the act from the scope
* pop the vm context
* pop the value of the current context stack
* set the act.return value
* pop the act off of the stack
* call method cleanup
* put the act.return value on the stack

### regular bytecode on native method
* assemble the args
* create an activation object
* push act onto current context stack
* 
* dispatch the actual method
* invoke the native JS method
* 
* set the return value on the act
* pop the act off of the stack
* call the cleanup
* put the act.return value on the stack


### new version

prepare_for_dispatch()

* assemble the args and rec and method
* create an activation object
* put the activation object on the stack
* if native:
  * push new context with new stack and bytecode. use act as the scope
* if bytecode:
  * push new context with new stack and bytecode.

real_dispatch()
* dispatch the actual method, either by jumping or calling native function
* keep vm running by executing ops if inside native context

cleanup_after_dispatch()
* pop the return value off of the stack
* pop the vm context
* pop the value of the current context stack?
* set act.return
* pop the act off of the stack
* put return value onto the stack



### more

[ ] get rid of the method abstraction since the custom work is done inside of the bytecode 
dispatcher
[ ] method is still an object with some data, but that's it. it doesn't need the method interface.
[ ] consolidate activation record and context
[ ] mov dispatching code to dispatcher

vm has a stack of activation records
activation record has a stack of objects