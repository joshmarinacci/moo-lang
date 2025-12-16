import {JS_VALUE, NatMeth, NilObj, Obj} from "./obj.ts";
import {setup_image} from "./image.ts";
import {make_common_scope} from "./scope.ts";
import fs from "node:fs";
import {Bitmap, encodePNGToStream, make} from "pureimage"

export function make_standard_scope():Obj {
    let scope = make_common_scope()
    setup_image(scope)
    let ImageProto = scope.get_slot('Image')
    ImageProto._make_method_slot('width:height:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        let image = new Obj("Image",ImageProto,{});
        image._make_data_slot("width",args[0])
        image._make_data_slot("height",args[1])
        image._make_js_slot(JS_VALUE,make(10,10))
        return image
    }));
    ImageProto._make_method_slot('save:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
        let bitmap = rec._get_js_unknown() as Bitmap
        let filename = args[0]._get_js_string();
        console.log(`saving bitmap to ${filename}`)
        encodePNGToStream(bitmap,fs.createWriteStream(filename)).then(() => {
            console.log(`finished saving bitmap to ${filename}`)
        })
        return NilObj()
    }));

    return scope
}
