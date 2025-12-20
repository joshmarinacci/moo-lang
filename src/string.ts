import {make_native_obj, NilObj, Obj, ObjectProto} from "./obj.ts";
import {BoolObj} from "./boolean.ts";
import {sval} from "./eval.ts";
import {NumObj} from "./number.ts";

export const StringProto = make_native_obj("StringProto",ObjectProto,{
    'value':(rec:Obj) => rec,
    '+':((rec:Obj, args:Array<Obj>) => StrObj(rec.to_string() + args[0].to_string())),
    '<':((rec:Obj, args:Array<Obj>) => BoolObj(rec.to_string() < args[0].to_string())),
    '>':((rec:Obj, args:Array<Obj>) => BoolObj(rec.to_string() > args[0].to_string())),
    'compare:':((rec:Obj, args:Array<Obj>) => {
        function compare(a:string,b:string) {
            if(a<b) return -1
            if(a>b) return 1
            return 0
        }
        return NumObj(compare(rec._get_js_string(),args[0]._get_js_string()))
    }),
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
    'size':(rec:Obj,args:Array<Obj>) => {
        let self_str = rec._get_js_string();
        return NumObj(self_str.length)
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
    sval(`String makeSlot: 'startsWith:' with: [str |
         st := true.
         st setJsSlot: "_jsvalue" to: (self jsCall: "startsWith" on: (self getJsSlot: "_jsvalue") with: (str getJsSlot: "_jsvalue")).
         st.
    ].`,scope);
    sval(`String makeSlot: 'endsWith:' with: [str |
         st := true.
         st setJsSlot: "_jsvalue" to: (self jsCall: "endsWith" on: (self getJsSlot: "_jsvalue") with: (str getJsSlot: "_jsvalue")).
         st.
    ].`,scope);
    sval(`String makeSlot: 'toUpper' with: [|
         st := "".
         st setJsSlot: "_jsvalue" to: (self jsCall: "toUpperCase" on: (self getJsSlot: "_jsvalue")).
         st.
    ].`,scope);
    sval(`String makeSlot: 'toLower' with: [|
         st := "".
         st setJsSlot: "_jsvalue" to: (self jsCall: "toLowerCase" on: (self getJsSlot: "_jsvalue")).
         st.
    ].`,scope);

}
