import {
    JSWrapper,
    NativeMethodProto,
    NatMeth,
    NilObj,
    Obj,
    ObjectProto,
    ROOT,
    setup_object
} from "./obj.ts";
import {setup_number} from "./number.ts";
import {BoolObj, setup_boolean} from "./boolean.ts";
import {DictObj, ListObj, setup_arrays} from "./arrays.ts";
import {setup_debug} from "./debug.ts";
import {setup_string, StrObj} from "./string.ts";
import {eval_really_perform_call} from "./eval.ts";
import {BlockProto} from "./block.ts";
import {BytecodeMethod} from "./bytecode.ts";

function root_fixup(scope:Obj) {
    ROOT._make_method_slot('listSlotNames',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        let names = rec._list_slot_names().map(name => StrObj(name))
        return ListObj(...names)
    }))
    ROOT._make_method_slot('getSlotNames',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        let slots:Record<string, Obj> = {}
        rec._list_slot_names().forEach(name => {
            slots[name] = rec.get_slot(name)
        })
        return DictObj(slots)
    }))
    ROOT._make_method_slot('print',NatMeth((rec:Obj):Obj => StrObj(rec.print())))
    ROOT._make_method_slot('perform:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        // console.log("inside object perform:")
        // console.log("receiver",rec.print())
        // console.log("args",args.map(a => a.print()).join(", "))
        let method_name = args[0]._get_js_string()
        // console.log("method name is",method_name)
        let args2:Array<Obj> = []
        let method = rec.lookup_slot(method_name)
        // console.log("loaded the method",method)
        return eval_really_perform_call(method_name,rec,method,args2)
    }))
    ROOT._make_method_slot('perform:with:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        // console.log("inside object perform:with:")
        // console.log("receiver",rec.print())
        // console.log("args",args.map(a => a.print()).join(", "))
        let method_name = args[0]._get_js_string()
        // console.log("method name is",method_name)
        let args2:Array<Obj> = [args[1]]
        let method = rec.lookup_slot(method_name)
        // console.log("loaded the method",method)
        // console.log("the first arg is", args2)
        return eval_really_perform_call(method_name,rec,method,args2)
    }))
    ROOT._make_method_slot('perform:withArgs:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        // console.log("inside object perform:withArgs:")
        // console.log("receiver",rec.print())
        // console.log("args",args.map(a => a.print()).join(", "))
        let method_name = args[0]._get_js_string()
        // console.log("method name is",method_name)
        // let args2:Array<Obj> = [args[1]]
        let args2:Array<Obj> = args[1]._get_js_array()
        let method = rec.lookup_slot(method_name)
        // console.log("loaded the method",method)
        // console.log("the first arg is", args2)
        return eval_really_perform_call(method_name,rec,method,args2)
    }))

    NativeMethodProto._make_method_slot('print', NatMeth((rec: Obj, args: Array<Obj>) => {
        return StrObj('native-method')
    }))
    ROOT._make_method_slot('isNil',NatMeth((rec:Obj):Obj => BoolObj(false)))
    ROOT._make_method_slot('jsSet:on:with:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        let field_name = args[0]._get_js_string()
        let js_target = args[1]
        let value = args[2]
        try {
            js_target[field_name] = value
        } catch (e) {
            console.log("error",e)
        }
        return NilObj()
    }))
    ROOT._make_method_slot('jsGet:on:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        let field_name = args[0]._get_js_string()
        let js_target = args[1]
        try {
            let value = js_target[field_name]
            if(typeof value == 'string') {
                return StrObj(value)
            }
        } catch (e) {
            console.log("error",e)
        }
        return NilObj()
    }))
    ROOT._make_method_slot("jsCall:on:",NatMeth((rec:Obj,args:Array<Obj>):Obj => {
        let method_name = args[0]._get_js_string()
        let js_target = args[1].get_slot('jsval') as unknown
        let retval = js_target[method_name]()
        return JSWrapper(retval)
    }))
    ROOT._make_method_slot("jsCall:on:with:",NatMeth((rec:Obj,args:Array<Obj>):Obj => {
        let method_name = args[0]._get_js_string()
        let js_target = args[1].get_slot('jsval') as unknown
        let arg = args[2].get_slot('jsval') as unknown
        let retval = js_target[method_name](arg)
        return JSWrapper(retval)
    }))
    ROOT._make_method_slot("jsCall:on:with:with:",NatMeth((rec:Obj,args:Array<Obj>):Obj => {
        let method_name = args[0]._get_js_string()
        let js_target = args[1].get_slot('jsval') as unknown
        let arg1 = args[2].get_slot('jsval') as unknown
        let arg2 = args[3].get_slot('jsval') as unknown
        let retval = js_target[method_name](arg1,arg2)
        return JSWrapper(retval)
    }))
    ROOT._make_method_slot('jsLookupGlobal:',NatMeth((rec:Obj, args:Array<Obj>)=> JSWrapper(global[args[0]._get_js_string()])))

    BlockProto._make_method_slot('whileTrue:', new BytecodeMethod(
        ['block'], //block is the parameter
        [
        ['load-plain-id','block'],
        // execute the body block
        ['lookup-message','value'],    // lookup value message on the block
        ['send-message',0],            // call value message
            // remove whatever was left on the stack
        ['pop',null],

        // execute the conditional block
        ['load-plain-id','receiver'],  // the block is the receiver
        ['lookup-message','value'],    // lookup value message on the block
        ['send-message',0],            // call value message
        ['jump-if-true',0],            // if the condition was true, jump to start
        ['load-literal-string','done'],
        // ['return-from-bytecode-call',null],
    ],BlockProto))

}

export function make_common_scope():Obj {
    let scope = new Obj("Global", ROOT, {});
    setup_object(scope)
    setup_number(scope)
    setup_string(scope)
    setup_boolean(scope)
    setup_debug(scope)
    setup_arrays(scope)

    scope._make_method_slot("Global", scope)
    ObjectProto.parent = scope;

    root_fixup(scope);
    //at this point we can do eval

    return scope
}
