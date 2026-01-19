import {JS_VALUE, NatMeth, NilObj, Obj} from "./obj.ts";
import {setup_dom} from "./dom.ts";
import {make_common_scope} from "./scope.ts";
import {setup_image} from "./image.ts";

export function make_browser_scope(document: Document):Obj {
    let scope = make_common_scope()
    setup_dom(scope,document)
    setup_image(scope)

    // modify Debug to use the browser console
    let Debug = scope.lookup_slot("Debug")
    Debug._make_method_slot('print:',NatMeth((rec:Obj, args:Array<Obj>) => {
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
    }))

    let ImageProto = scope.get_slot('Image')
    ImageProto._make_method_slot('width:height:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        let image = new Obj("Image",ImageProto,{});
        image._make_data_slot("width",args[0])
        image._make_data_slot("height",args[1])
        let canvas = document.createElement('canvas')
        canvas.width = args[0]._get_js_number()
        canvas.height = args[1]._get_js_number()
        image._make_js_slot(JS_VALUE,canvas)
        return image
    }));
    const number_to_css_string = (color:number):string => {
        let red   = (color >> 24)  & 0xFF;
        let green = (color >> 16)  & 0xFF;
        let blue  = (color >> 8)  & 0xFF;
        return `rgb(${red},${green},${blue})`
    }
    ImageProto._make_method_slot('fill:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        let canvas = rec._get_js_unknown() as HTMLCanvasElement
        let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        ctx.fillStyle = number_to_css_string(args[0]._get_js_number())
        ctx.fillRect(0,0,canvas.width,canvas.height)
        return NilObj()
    }));

    ImageProto._make_method_slot('setPixelAt:y:color:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        let canvas = rec._get_js_unknown() as HTMLCanvasElement
        let ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        let x = args[0]._get_js_number()
        let y = args[1]._get_js_number()
        ctx.fillStyle = number_to_css_string(args[2]._get_js_number())
        ctx.fillRect(x,y,1,1)
        return NilObj()
    }));

    return scope
}
