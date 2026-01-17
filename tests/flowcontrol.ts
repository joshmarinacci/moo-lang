import test from "node:test";
import {make_standard_scope} from "../src/standard.ts";
import {Obj} from "../src/obj.ts";

test('basic flow control',() => {
    let scope:Obj = make_standard_scope();
    // [ Debug print "looping". ] loop.
    /*
    // while true loop
    [
     count ::= 0
     [
      count := count + 1.
      return count < 10.
     ] whileTrue.
     67
     ]
     */

    /*
    // while false loop
    [
     count ::= 0
     [
      count := count + 1.
      return count > 10.
     ] whileFalse.
    67
    ]
     */

    /*
    // infinite loop with a break
[
 count ::= 0.
 [
  count := count + 1.
  (count > 10) [ break. ] .
 ] loop.
67
]
 */

    /*
    // range loop
    count ::= 0.
    (1 to: 5) do: [n |
        count := count + 1.
    ].
    count.
     */

    /*
    // range loop with step
    count ::= 0
    (1 toStep: 5 2) do: [n |
        count := count + 1.
    ].
    count.
     */

})
