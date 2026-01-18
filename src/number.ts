import {type NativeMethodSignature, VMState} from "./obj.ts"
import {make_native_obj, NilObj, Obj, ObjectProto} from "./obj.ts";
import {BoolObj} from "./boolean.ts";
import {StrObj} from "./string.ts";
import {bval} from "./bytecode.ts";
import {eval_block_obj} from "./dispatch.ts";

const js_num_op = (cb:(a:number,b:number)=>number):NativeMethodSignature => {
    return function (rec:Obj, args:Array<Obj>){
        if (args[0].name !== "NumberLiteral") {
            throw new Error(`cannot add a non number to a number: ${args[0].name}`);
        }
        let a = rec._get_js_number()
        let b = args[0]._get_js_number()
        return NumObj(cb(a, b))
    }
}
const js_bool_op = (cb:(a:number,b:number)=>boolean) => {
    return function (rec:Obj, args:Array<Obj>){
        if (!args[0].is_kind_of('NumberProto')) {
            throw new Error(`argument not a number ${args[0].name}`)
        }
        return BoolObj(cb(rec._get_js_number(), args[0]._get_js_number()))
    }
}

const NumberProto = make_native_obj("NumberProto", ObjectProto, {
    'value':(rec:Obj) => rec,
    'fromJs:':(rec:Obj, args:Array<Obj>):Obj => NumObj(args[0].get_slot('jsval') as unknown as number),
    '+':js_num_op((a,b)=>a+b),
    '-':js_num_op((a,b)=>a-b),
    '*':js_num_op((a,b)=>a*b),
    '/':js_num_op((a,b)=>a/b),
    '<':js_bool_op((a,b)=>a<b),
    '>':js_bool_op((a,b)=>a>b),
    '==':(rec:Obj,args:Array<Obj>) => {
        if (!args[0].is_kind_of('NumberProto')) {
            return BoolObj(false)
        } else {
            if(rec._get_js_number() == args[0]._get_js_number()) {
                return BoolObj(true)
            }
        }
        return BoolObj(false)
    },
    'mod:':js_num_op((a,b)=>a%b),
    'sqrt':(rec:Obj):Obj => NumObj(Math.sqrt(rec._get_js_number())),
    'to:do:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj => {
        let start = rec._get_js_number()
        let end = args[0]._get_js_number()
        let block = args[1]
        for(let i=start; i<end; i++) {
            eval_block_obj(vm,block, [NumObj(i)])
        }
        return NilObj()
    },
    // 'range:do:':(rec:Obj, args:Array<Obj>):Obj => {
    //     let start = rec._get_js_number()
    //     let end = args[0]._get_js_number()
    //     let block = args[1]
    //     for(let i=start; i<end; i++) {
    //         eval_block_obj(block, [NumObj(i)])
    //     }
    //     return NilObj()
    // },
    'print':(rec:Obj):Obj => StrObj(rec._get_js_number() + ''),
    'negate':(rec:Obj):Obj => NumObj(-rec._get_js_number()),
    'compare:':((rec:Obj, args:Array<Obj>) => {
        function compare(a:number,b:number) {
            if(a<b) return -1
            if(a>b) return 1
            return 0
        }
        return NumObj(compare(rec._get_js_number(),args[0]._get_js_number()))
    }),

});
export const NumObj = (value:number):Obj => new Obj("NumberLiteral", NumberProto, { '_jsvalue': value,})


export function setup_number(scope: Obj) {
    scope._make_method_slot("Number", NumberProto)
    bval(`
    
    Number makeSlot: 'double' with: [
      (self value) * 2.
    ].
    
    Number makeSlot: 'square' with:[
       (self value) * (self value).
    ].
    Nil makeSlot: 'isNil' with: [
         true
    ].
    Number makeSlot: 'range:do:' with: [ end block |
      self make_data_slot: 'counter' with: 0.
      [ self counter < end ] whileTrue: [
         block valueWith: self counter.
      ].
      'donzo'.
    ].
    Number makeSlot: 'times:' with: [ block |
         0 range: self do: block.
    ].
    `,scope);
}