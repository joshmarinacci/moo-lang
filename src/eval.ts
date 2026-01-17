import {JoshLogger} from "./util.ts";

import {
    type Context,
    JS_VALUE,
    type Method,
    type NativeMethodSignature,
    Obj,
    ObjectProto,
    STStack,
    VMState
} from "./obj.ts";
import {NumObj} from "./number.ts";
import {StrObj} from "./string.ts";
import type {
    Ast,
    BinaryCall,
    BlockLiteral,
    KeywordCall,
    NumberLiteral,
    StringLiteral,
    UnaryCall
} from "./ast.ts";
import {DictObj, ListObj} from "./arrays.ts";
import {ActivationObj, BlockProto} from "./block.ts";
import {execute_op} from "./bytecode.ts";

const d = new JoshLogger()
d.disable()

export function eval_block_obj(vm:VMState, method: Obj, args:Array<Obj>) {
    if(!(vm instanceof VMState)) {
        throw new Error("vm not vmstate")
    }
    if (method.name === 'BytecodeMethod') {
        let ctx:Context = {
            scope: method,
            bytecode: [],
            pc: 0,
            stack: new STStack(),
            running:true,
            label:'bytecode-method'
        };
        vm.pushContext(ctx)
        let act = new ActivationObj(`block-activation`, method, {
            receiver:method,
            method:method,
            args:args,
        });
        ctx.stack.push(act);
        d.p('stack after',ctx.stack.print_small());

        (act.get_slot('method') as unknown as Method).dispatch(vm,act);
        d.p('bytecode is now', ctx.bytecode)
        while(ctx.running) {
            d.p("=======")
            d.p("stack",ctx.stack.print_small())
            d.p(ctx.bytecode)
            if(ctx.pc >= ctx.bytecode.length) break;
            let ret = execute_op(vm)
        }

        let act2 = ctx.stack.pop()
        vm.popContext()
        return act2.get_slot('return')
    }
    if (method.name !== 'Block') {
        throw new Error(`trying to eval a method that isn't a block '${method.name}'`)
        //return method
    }
    let meth = method.get_js_slot('value') as unknown
    if (meth instanceof Obj && meth.is_kind_of("NativeMethod")) {
        return (meth.get_js_slot(JS_VALUE) as NativeMethodSignature)(method,args,vm)
    }
    if (typeof meth === 'function') {
        return meth(method, args)
    }
    throw new Error("bad failure on evaluating block object")
}

export function eval_really_perform_call(name:string, rec:Obj, method:unknown, args:Array<Obj>, vm:VMState):Obj {
    if (method instanceof Obj && method.isNil()) {
        let handler = rec.lookup_slot('doesNotUnderstand:')
        if(handler) {
            let msg = new Obj("Message",ObjectProto,{})
            msg._make_data_slot('selector',StrObj(name))
            msg._make_data_slot('arguments',ListObj(...args))
            let ret = eval_really_perform_call('doesNotUnderstand:',rec,handler,[msg],vm)
            return ret
        }
        throw new Error(`method is nil! could not find method '${name}' on ${rec.print()}`)
    }
    if (method instanceof Function) {
        return method(rec,args)
    }
    if (method instanceof Obj && method.is_kind_of("NativeMethod")) {
        return (method.get_js_slot(JS_VALUE) as NativeMethodSignature)(rec,args,vm)
    }
    if (method instanceof Obj && method.name === 'Block') {
        method.parent = rec
        return eval_block_obj(vm,method,args)
    }
    throw new Error("method call not performed properly.")
}

function perform_call(rec: Obj, call: UnaryCall | BinaryCall | KeywordCall, scope: Obj):Obj {
    if(call.type === 'unary-call') {
        let method = rec.lookup_slot(call.message.name)
        let args:Array<Obj> = []
        return eval_really_perform_call(call.message.name,rec,method,args)
    }
    if(call.type === 'binary-call') {
        let method = rec.lookup_slot(call.operator.name)
        let arg = eval_ast(call.argument,scope)
        return eval_really_perform_call(call.operator.name, rec,method,[arg])
    }
    if(call.type === 'keyword-call') {
        let method_name = call.args.map(arg => arg.name.name).join("")
        let method = rec.lookup_slot(method_name)
        let args = call.args.map(arg => eval_ast(arg.value,scope))
        return eval_really_perform_call(method_name, rec,method,args)
    }

    throw new Error("method call not performed properly.")
}

export function eval_ast(ast:Ast, scope:Obj):Obj {
    if (ast.type === 'number-literal') return NumObj((ast as NumberLiteral).value)
    if (ast.type === "string-literal") return StrObj((ast as StringLiteral).value)
    if (ast.type === 'plain-identifier') return scope.lookup_slot(ast.name)
    if (ast.type === 'group') return ast.body.map(a => eval_ast(a, scope)).at(-1)
    if (ast.type === 'statement') return eval_ast(ast.value, scope)
    if (ast.type === 'assignment') {
        let ret = eval_ast(ast.value,scope)
        scope._make_method_slot(ast.target.name,ret)
        return ret
    }
    if (ast.type === 'return') {
        let value = eval_ast(ast.value,scope)
        let ret = new Obj('non-local-return',scope.parent,{})
        ret._is_return = true
        ret._make_method_slot('value',value)
        ret._make_method_slot('target',scope.parent as Obj)
        return ret
    }
    if (ast.type === 'block-literal') {
        let blk = ast as BlockLiteral
        let blk2 = BlockProto.clone()
        blk2.name = 'Block'
        blk2._make_js_slot('args',blk.parameters);
        blk2._make_js_slot('body',blk.body);
        blk2.parent = scope;
        return blk2
    }
    if (ast.type === 'list-literal') return ListObj(...(ast.body.map(v => eval_ast(v, scope))))
    if (ast.type === 'map-literal') {
        let obj:Record<string, Obj> = {}
        ast.body.forEach(pair => {
            obj[pair.name.name] = eval_ast(pair.value,scope)
        })
        return DictObj(obj)
    }
    if (ast.type === 'message-call') return perform_call(eval_ast(ast.receiver, scope), ast.call, scope)
    throw new Error(`unknown ast type '${ast.type}'`)
}

