import {NatMeth, Obj, ObjectProto} from "./obj.ts";
import type {Statement} from "./ast.ts"
import {AstToSource,} from "./ast.ts";
import {StrObj} from "./string.ts";


export const BlockProto = new Obj("BlockProto", ObjectProto, {
    'print': NatMeth((rec: Obj) => {
        let body = rec.get_js_slot('body') as Array<Statement>
        return StrObj(body.map(st => AstToSource(st)).join('\n'))
    },'BlockProto.print'),
})