import {NilObj, Obj, ObjectProto, ROOT, setup_object} from "./obj.ts";
import {setup_dom} from "./dom.ts";
import {make_common_scope} from "./scope.ts";

export function make_browser_scope(document: Document):Obj {
    let scope = make_common_scope()
    setup_dom(scope,document)

    // modify Debug to use the browser console
    let Debug = scope.lookup_slot("Debug")
    Debug._make_method_slot('print:',(rec:Obj, args:Array<Obj>) => {
        console.log("debug printing".toUpperCase())
        const cons = document.querySelector("#editor-console") as Element
        args.forEach(arg => {
            if(arg instanceof Obj) {
                console.log("DEBUG", arg.to_string())
            } else {
                console.log(`unknown object type '${typeof arg}' = `, arg)
            }
            const li = document.createElement('li')
            li.innerText = "DEBUG: " + arg.to_string()
            cons.append(li)
        })
        cons.scrollTop = cons.scrollHeight
        return NilObj()
    })

    return scope
}
