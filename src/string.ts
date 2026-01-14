import {make_native_obj, Obj, ObjectProto} from "./obj.ts";
import {BoolObj} from "./boolean.ts";
import {NumObj} from "./number.ts";
import {bval} from "./bytecode.ts";

export const StringProto = make_native_obj("StringProto",ObjectProto,{
    'value':(rec:Obj) => rec,
    'fromJs:':(rec:Obj, args:Array<Obj>):Obj => StrObj(args[0].get_slot('jsval') as unknown as string),
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
    'at:':((rec:Obj, args:Array<Obj>) => StrObj(rec._get_js_string()[args[0]._get_js_number()])),
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
    'size':(rec:Obj,args:Array<Obj>) => NumObj(rec._get_js_string().length),
    'contains:':(rec:Obj,args:Array<Obj>) => BoolObj(rec._get_js_string().includes(args[0]._get_js_string())),
    'print':(rec:Obj):Obj => StrObj(rec._get_js_string()),
    'repeat:':(rec:Obj, args:Array<Obj>):Obj => StrObj(rec._get_js_string().repeat(args[0]._get_js_number())),
    // 'do:':(rec:Obj, args:Array<Obj>):Obj=>{
    //     let str = rec._get_js_string()
    //     let block = args[0]
    //     for(let i =0; i<str.length; i++) {
    //         eval_block_obj(block,[StrObj(str[i])])
    //     }
    //     return NilObj()
    // },
});

export const StrObj = (value:string):Obj => new Obj("StringLiteral", StringProto, {'_jsvalue': value})
export function setup_string(scope: Obj) {
    scope._make_method_slot("String", StringProto)
    bval(`
        String makeSlot: '_js' with: [
            self getJsSlot: '_jsvalue'.
        ].
        String makeSlot: 'startsWith:' with: [str | 
            Boolean fromJs: (self jsCall: "startsWith" on: self _js with: str _js) 
        ].
        String makeSlot: 'endsWith:' with: [str | 
            Boolean fromJs: (self jsCall: "endsWith" on: self _js with: str _js) 
        ].
        String makeSlot: 'toUpper' with: [|
            String fromJs: (self jsCall: "toUpperCase" on: (self getJsSlot: "_jsvalue")).
        ].
        String makeSlot: 'toLower' with: [|
            String fromJs: (self jsCall: "toLowerCase" on: (self getJsSlot: "_jsvalue")).
        ].
        String makeSlot: 'isEmpty' with: [|
            self size == 0
        ].
        String makeSlot: 'do:' with: [blk |
            self make_data_slot: 'counter' with:0.
            [self counter < self size] whileTrue: [
                ch := self at: (self counter).
                blk valueWith: ch.
                self counter: (self counter + 1).
                self counter.
            ].
            self counter .
        ].
    `,scope)
}
