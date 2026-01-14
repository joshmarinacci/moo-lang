import {make_native_obj, NilObj, Obj, ObjectProto, VMState} from "./obj.ts";
import {eval_block_obj} from "./eval.ts";
import {StrObj} from "./string.ts";

const BooleanProto = make_native_obj("BooleanProto",ObjectProto,{
    'value':(rec:Obj) => rec,
    'ifTrue:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj => {
        let val = rec._get_js_boolean()
        if(val) return eval_block_obj(vm,args[0],[])
        return NilObj()
    },
    'ifFalse:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj => {
        let val = rec._get_js_boolean()
        if(!val) return eval_block_obj(vm,args[0],[])
        return NilObj()
    },
    'ifTrue:ifFalse:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj => {
        let val = rec._get_js_boolean()
        if(val) {
            return eval_block_obj(vm,args[0],[])
        } else {
            return eval_block_obj(vm,args[1],[])
        }
    },
    'fromJs:':(rec:Obj, args:Array<Obj>):Obj => BoolObj(args[0].get_slot('jsval') as unknown as boolean),
    'and:':(rec:Obj, args:Array<Obj>):Obj => BoolObj(rec._get_js_boolean() && args[0]._get_js_boolean()),
    'or:':(rec:Obj, args:Array<Obj>):Obj => BoolObj(rec._get_js_boolean() || args[0]._get_js_boolean()),
    'not':(rec:Obj, args:Array<Obj>):Obj => BoolObj(!rec._get_js_boolean()),
    'cond:with:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj => eval_block_obj(vm,rec._get_js_boolean() ? args[0] : args[1], []),
    'print':(rec:Obj):Obj => StrObj(rec._get_js_boolean() + ''),
    '==':(rec:Obj,args:Array<Obj>) => {
        if (!args[0].is_kind_of('BooleanProto')) {
            return BoolObj(false)
        } else {
            if(rec._get_js_boolean() == args[0]._get_js_boolean()) {
                return BoolObj(true)
            }
        }
        return BoolObj(false)
    },
});
export const BoolObj = (value:boolean) => new Obj("BooleanLiteral", BooleanProto, {'_jsvalue':value})

export function setup_boolean(scope: Obj) {
    scope._make_method_slot("Boolean", BooleanProto)
    scope._make_method_slot("true",BoolObj(true))
    scope._make_method_slot("false",BoolObj(false))
}