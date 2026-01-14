import {JS_VALUE, make_native_obj, NilObj, Obj, ObjectProto, VMState} from "./obj.ts";
import {NumObj} from "./number.ts";
import {eval_block_obj} from "./eval.ts";
import {StrObj} from "./string.ts";
import {bval} from "./bytecode.ts";

class JSSet {
    data: Map<unknown,Obj>
    constructor() {
        this.data = new Map()
    }
    add(obj:Obj) {
        if(!this.data.has(obj.hash_value())) {
            this.data.set(obj.hash_value(),obj)
        }
    }
    has(obj:Obj):boolean {
        return this.data.has(obj.hash_value())
    }

    // //select :: filter
    //     set ::= Set clone.
    //     self do: [v |
    //         (A value: {v}) ifTrue: [ set put: v]
    //     ].
    //     ^ set.

    //detect :: find
    //collect :: map
    //reject :: !filter
    //inject :: fold / reduce
    //inject value collection

    size() {
        return this.data.size
    }

    addAll(jsSlot: unknown) {
        if(jsSlot instanceof JSSet) {
            for (let [key,value] of jsSlot.data.entries()) {
                this.add(value)
            }
        }
        if(Array.isArray(jsSlot)) {
            for(let obj of jsSlot) {
                this.add(obj)
            }
        }
    }


    private forEach(param: (v:Obj) => void) {
        this.data.forEach((vv) => {
            param(vv)
        })
    }

    difference(B: JSSet) {
        let set = new JSSet()
        this.forEach(v => {
            if(!B.has(v)) {
                set.add(v)
            }
        })
        return set
    }
    intersect(B: JSSet) {
        let set = new JSSet()
        this.forEach(v => {
            if(B.has(v)) {
                set.add(v)
            }
        })
        return set
    }
    union(B: JSSet) {
        let set = new JSSet()
        this.forEach(v => {
            set.add(v)
        })
        B.forEach(v => set.add(v))
        return set
    }
}

export const ListProto = make_native_obj("ListProto",ObjectProto, {
    'clone':(rec:Obj) => {
        let copy = rec.clone()
        copy._make_js_slot(JS_VALUE,[])
        return copy
    },
    'add:':(rec:Obj, args:Array<Obj>):Obj=>{
        let arr = rec._get_js_array()
        arr.push(args[0]);
        return NilObj()
    },
    'push:':(rec:Obj, args:Array<Obj>):Obj=>{
        let arr = rec._get_js_array()
        arr.push(args[0]);
        return NilObj()
    },
    'pop':(rec:Obj, args:Array<Obj>):Obj=>{
        let arr = rec._get_js_array()
        let ret = arr.pop()
        if(ret instanceof Obj) {
            return ret
        } else {
            return NilObj()
        }
    },
    'at:':(rec:Obj,args:Array<Obj>):Obj => {
        let arr = rec._get_js_array()
        let index = args[0]._get_js_number()
        return arr[index]
    },
    'at:set:':(rec:Obj, args:Array<Obj>):Obj => {
        let arr = rec._get_js_array()
        let index = args[0]._get_js_number()
        arr[index] = args[1]
        return rec
    },
    'removeAt:':(rec:Obj, args:Array<Obj>):Obj => {
        let arr = rec._get_js_array()
        let index = args[0]._get_js_number()
        let removed = arr.splice(index,1)
        return removed[0]
    },
    'size':(rec:Obj, args:Array<Obj>):Obj=>{
        let arr = rec._get_js_array()
        return NumObj(arr.length)
    },
    'do:':(rec:Obj, args:Array<Obj>,vm:VMState):Obj=>{
        let arr = rec._get_js_array()
        let block = args[0]
        arr.forEach((v,i) => {
            let ret = eval_block_obj(vm,block,[v]) as Obj
        })
        return NilObj()
    },
    'select:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj=>{
        let arr = rec._get_js_array()
        let block = args[0]
        let res = arr.filter((v,i) => {
            let vv = eval_block_obj(vm,block,[v]) as Obj
            return vv._get_js_boolean()
        })
        return ListObj(...res)
    },
    'reduce:with:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj=> rec._get_js_array().reduce((a, b) => eval_block_obj(vm,args[0], [a, b]) as Obj, args[1]),
    'reduce:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj=> rec._get_js_array().reduce((a, b) => eval_block_obj(vm,args[0], [a, b]) as Obj),
    'reject:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj=>{
        let res = rec._get_js_array()
            .map((v,i) => eval_block_obj(vm,args[0], [v]) as Obj)
            .filter(b => !b._get_js_boolean())
        return ListObj(...res)
    },
    'collect:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj=> ListObj(...rec._get_js_array().map((v, i) => eval_block_obj(vm,args[0], [v]) as Obj)),
    'sortedBy:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj=>{
        let arr = rec._get_js_array()
        arr = arr.slice();
        let block = args[0]
        arr.sort((a,b)=>{
            let num = eval_block_obj(vm,block,[a,b]) as Obj
            return num._get_js_number()
        })
        return ListObj(...arr)
    },
})
ListProto._make_js_slot(JS_VALUE,[])
export const ListObj = (...args:Array<Obj>)=> new Obj("List", ListProto, {'_jsvalue': args})

export const DictProto = make_native_obj('DictProto',ObjectProto, {
    'clone':(rec:Obj) => {
        let copy = rec.clone()
        copy._make_js_slot(JS_VALUE,{})
        return copy
    },
    'get:':(rec:Obj, args:Array<Obj>):Obj => {
        let arr = rec._get_js_record()
        let key = args[0]._get_js_string()
        return arr[key]
    },
    'at:':(rec:Obj, args:Array<Obj>):Obj => {
        let arr = rec._get_js_record()
        let key = args[0]._get_js_string()
        return arr[key]
    },
    'at:set:':(rec:Obj, args:Array<Obj>):Obj => {
        let arr = rec._get_js_record()
        let key = args[0]._get_js_string()
        arr[key] = args[1]
        return rec
    },
    'size':(rec:Obj):Obj=>{
        let record = rec._get_js_record()
        return NumObj(Object.keys(record).length)
    },
    'keys':(rec:Obj) => {
        let record = rec._get_js_record()
        return ListObj(... Object.keys(record).map(s => StrObj(s)))
    },
    'values':(rec:Obj) => {
        let record = rec._get_js_record()
        return ListObj(... Object.values(record))
    },
    'do:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj=>{
        let arr = rec._get_js_record()
        let block = args[0]
        Object.keys(arr).forEach(key => {
            let value = arr[key]
            let key_o = StrObj(key)
            let ret = eval_block_obj(vm,block,[key_o,value]) as Obj
        })
        return NilObj()
    },
})
DictProto._make_js_slot(JS_VALUE,{})
export const DictObj = (obj:Record<string, Obj>) => {
    let dict = DictProto.clone()
    dict._set_js_unknown(obj)
    return dict
}

const SetProto = make_native_obj("SetProto",ObjectProto,{
    'clone':(rec:Obj) => {
        let copy = rec.clone()
        copy._make_js_slot(JS_VALUE,new JSSet())
        return copy
    },
    'add:':(rec:Obj, args:Array<Obj>):Obj => {
        let set = rec.get_js_slot(JS_VALUE) as JSSet
        set.add(args[0])
        return NilObj()
    },
    'size':(rec:Obj, args:Array<Obj>):Obj => {
        let set = rec.get_js_slot(JS_VALUE) as JSSet
        return NumObj(set.size())
    },
    'withAll:':(rec:Obj, args:Array<Obj>):Obj => {
        let set2 = new JSSet()
        set2.addAll(rec.get_js_slot(JS_VALUE) as JSSet)
        set2.addAll(args[0].get_js_slot(JS_VALUE) as JSSet)
        return SetObj(set2)
    },
    '+':(rec:Obj, args:Array<Obj>):Obj => {
        let A = rec.get_js_slot(JS_VALUE) as JSSet
        let B = args[0].get_js_slot(JS_VALUE) as JSSet
        return SetObj(A.union(B))
    },
    '-':(rec:Obj, args:Array<Obj>):Obj => {
        let A = rec.get_js_slot(JS_VALUE) as JSSet
        let B = args[0].get_js_slot(JS_VALUE) as JSSet
        return SetObj(A.difference(B))
    },
    'intersect:':(rec:Obj, args:Array<Obj>):Obj => {
        let A = rec.get_js_slot(JS_VALUE) as JSSet
        let B = args[0].get_js_slot(JS_VALUE) as JSSet
        return SetObj(A.intersect(B))
    },
})
SetProto._make_js_slot(JS_VALUE,new JSSet())
export const SetObj = (obj:JSSet) => new Obj('Set',SetProto,{"_jsvalue":obj})


export function setup_arrays(scope:Obj) {
    scope._make_method_slot("List",ListProto)
    scope._make_method_slot("Dict",DictProto)
    scope._make_method_slot("Set",SetProto)

    bval(`List makeSlot: 'first' with: [
         self at:0
    ].`,scope);
    bval(`List makeSlot: 'last' with: [
         self at: (self size -1)
    ].`,scope);
    bval(`List makeSlot: 'sorted' with: [
         self sortedBy: [a b | a - b ]
    ].`,scope);

    bval(`[
        List makeSlot: 'print' with: [
            str := (self collect: [n |
                n print.
            ]).
            str.
        ].
    ] value.`,scope)
}


