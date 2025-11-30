import {NilObj, Obj, ObjectProto} from "./obj.ts";
import assert from "node:assert";
import {JoshLogger} from "./util.ts";

export function objsEqual(a: Obj, b: Obj) {
    if(a.name !== b.name) return false
    if(a._method_slots.size !== b._method_slots.size) return false
    for(let key of a._method_slots.keys()) {
        let vala = a._method_slots.get(key) as unknown;
        let valb = b._method_slots.get(key) as unknown;
        if (typeof vala === 'number') {
            if (vala !== valb) return false
        }
        if (typeof vala === 'string') {
            if (vala !== valb) return false
        }
    }
    return true
}
const d = new JoshLogger()

const DebugProto = new Obj("DebugProto",ObjectProto,{
    'equals:':(rec:Obj, args:Array<Obj>) => {
        assert(objsEqual(args[0], args[1]),`not equal ${args[0].print()} ${args[1].print()}`)
        return NilObj()
    },
    'print:':(rec:Obj, args:Array<Obj>) => {
        // d.p("debug printing".toUpperCase())
        args.forEach(arg => d.p("DEBUG", arg.to_string()))
        return NilObj()
    }
})

export function setup_debug(scope: Obj) {
    scope._make_method_slot("Debug", DebugProto)
}