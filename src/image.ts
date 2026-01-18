
import {make_native_obj, NilObj, Obj, ObjectProto, VMState} from "./obj.ts";
import {NumObj} from "./number.ts";
import {bval} from "./bytecode.ts";
import {eval_block_obj} from "./dispatch.ts";

export function setup_image(scope:Obj) {
    const ImageProto = make_native_obj("ImageProto",ObjectProto,{
        'setPixelAt:y:color:':(rec:Obj, args:Array<Obj>):Obj => {
            let bitmap = rec._get_js_unknown()// as Bitmap
            let x = args[0]._get_js_number()
            let y = args[1]._get_js_number()
            let c = args[2]._get_js_number()
            bitmap.setPixelRGBA(x,y,c)
            return NilObj()
        },
        'fill:':(rec:Obj, args:Array<Obj>, vm:VMState):Obj => {
            let bitmap = rec._get_js_unknown()// as Bitmap
            for(let j = 0; j<bitmap.height; j++) {
                for (let i = 0; i < bitmap.width; i++) {
                    let ii = NumObj(i)
                    let jj = NumObj(j)
                    let ret = eval_block_obj(vm,args[0],[ii,jj]) as Obj
                    bitmap.setPixelRGBA(i,j,ret._get_js_number())
                }
            }
            return NilObj()
        }
    });
    scope._make_method_slot("Image",ImageProto)
    const ColorProto = make_native_obj("ColorProto",ObjectProto,{
        'from:':(rec:Obj, args:Array<Obj>):Obj => {
            let data = args[0]._get_js_array()
            let red = data[0]._get_js_number()
            let green = data[1]._get_js_number()
            let blue = data[2]._get_js_number()
            let rgba = (red << 24) | (green << 16) | (blue << 8) | 255;
            return NumObj(rgba)
        },
    })
    scope._make_method_slot("Color",ColorProto)
    bval(`[
        Color make_data_slot: "red"   with: 16rFF0000FF.
        Color make_data_slot: "green" with: 16r00FF00FF.
        Color make_data_slot: "blue"  with: 16r0000FFFF.
        Color make_data_slot: "white" with: 16rFFFFFFFF.
        Color make_data_slot: "black" with: 16r000000FF.
        ] value.`,scope)
}
