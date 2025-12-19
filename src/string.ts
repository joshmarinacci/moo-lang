import {make_native_obj, NilObj, Obj, ObjectProto} from "./obj.ts";
import {BoolObj} from "./boolean.ts";

export const StringProto = make_native_obj("StringProto",ObjectProto,{
    'value':(rec:Obj) => rec,
    '+':((rec:Obj, args:Array<Obj>) => StrObj(rec.to_string() + args[0].to_string())),
    '==':(rec:Obj,args:Array<Obj>) => {
        if (!args[0].is_kind_of('StringProto')) {
            return BoolObj(false)
        } else {
            if(rec._get_js_string() == args[0]._get_js_string()) {
                return BoolObj(true)
            }
        }
        return BoolObj(false)
    },
    'contains:':(rec:Obj,args:Array<Obj>) => {
        let self_str = rec._get_js_string();
        let comp_str = args[0]._get_js_string();
        return BoolObj(self_str.includes(comp_str));
    },
    'print':(rec:Obj):Obj => {
        return StrObj(rec._get_js_string())
    },
    'repeat:':(rec:Obj, args:Array<Obj>):Obj => {
        let self_str = rec._get_js_string();
        let count_num = args[0]._get_js_number();
        return StrObj(self_str.repeat(count_num));
    },
});
export const StrObj = (value:string):Obj => new Obj("StringLiteral", StringProto, {'_jsvalue': value})
export function setup_string(scope: Obj) {
    scope._make_method_slot("String", StringProto)
}
