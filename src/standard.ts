import {Obj} from "./obj.ts";
import {setup_image} from "./image.ts";
import {make_common_scope} from "./scope.ts";

export function make_standard_scope():Obj {
    let scope = make_common_scope()
    setup_image(scope)
    return scope
}
