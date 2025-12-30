import {JS_VALUE, NilObj, Obj, ObjectProto} from "./obj.ts";
import type {Ast, BlockLiteral} from "./ast.ts";
import {JoshLogger} from "./util.ts";
import {NumObj} from "./number.ts";
import {StrObj} from "./string.ts";
import {ActivationObj, BlockProto} from "./block.ts";
import {ListObj} from "./arrays.ts";

export type OpType
    = 'lookup-message'
    | 'send-message'
    | 'return-value'
    | 'load-literal-number'
    | 'load-plain-id'
    | 'load-literal-string'
    | 'create-literal-block'
    | 'assign'
    | 'return'
    | 'halt'
export type ByteOp = [OpType, unknown]
export type ByteCode = Array<ByteOp>;

let d = new JoshLogger()
d.disable()

export function eval_block_obj(method:Obj, args:Array<Obj>) {
    d.p(`bytecode eval block obj: ${method.print()}`)
    d.p("bytecode is: " + method.get_js_slot("bytecode"))
    if (method.name === 'Block' && method.get_js_slot("bytecode") !== undefined) {
        let bytecode = method.get_js_slot('bytecode') as ByteCode;
        let scope = new ActivationObj(`block-activation`, method, {})
        execute_bytecode(bytecode, scope)
    }
}
export function perform_dispatch(method: Obj, rec: Obj, args: any[], stack: Obj[], ctx: Context):Obj {
    d.p(`perform dispatch: ${method.name}`,method.print())
    if(method.name === 'MissingMethod') {
        let handler = rec.lookup_slot('doesNotUnderstand:')
        if(handler) {
            d.p("the missing message name is",method.get_slot('name'))
            let msg = new Obj("Message",ObjectProto,{})
            msg._make_data_slot('selector',StrObj(method.get_slot('name')))
            msg._make_data_slot('arguments',ListObj(...args))
            d.p("doing extra dispatch to handler")
            return perform_dispatch(handler,rec,[msg],stack)
        } else {
            return new Obj("Exception", ObjectProto, {"message": `Message not found: '${method.name}'`})
        }
    }
    if (method.is_kind_of("NativeMethod")) {
        let ret = (method.get_js_slot(JS_VALUE) as Function)(rec, args)
        stack.push(ret)
        return NilObj()
    }
    if (method.name === 'Block') {
        method.parent = rec
        if (method.name === 'Block' && method.get_js_slot("bytecode") !== undefined) {
            ctx.stack.push(new Obj("bytecode",ObjectProto,{bytecode:ctx.bytecode}))
            ctx.stack.push(NumObj(ctx.pc+1))
            ctx.bytecode = method.get_js_slot('bytecode') as ByteCode
            ctx.stack.push(ctx.scope)
            ctx.stack.push(rec)
            ctx.stack.push(method)
            ctx.scope = new ActivationObj(`block-activation`, method, {})
            // set pc
            ctx.pc = 0
            //  setup args
            return NilObj()
        }

        let meth = method.get_js_slot('value') as unknown
        if (meth instanceof Obj && meth.is_kind_of("NativeMethod")) {
            let ret = (meth.get_js_slot(JS_VALUE) as Function)(method, args)
            stack.push(ret)
            return NilObj()
        }
        if (meth instanceof Function) {
            let ret = meth(method, args)
            stack.push(ret)
            return NilObj()
        }
    }
    d.error("method is", method)
    d.p("is native method?", method.is_kind_of('NativeMethod'))
    d.p("is block method?", method.is_kind_of('Block'))
    throw new Error("shouldn't be here")
}

export type Context = {
    scope:Obj,
    bytecode:Array<ByteOp>,
    pc:number,
    stack:Array<Obj>,
    running: boolean
}

export function execute_op(op: ByteOp, stack: Obj[], scope: Obj, ctx:Context): Obj {
    let name = op[0]
    ctx.pc++
    if(name === 'halt') {
        ctx.running = false
        return NilObj()
    }
    if(name === 'return') {
        let value = ctx.stack.pop() // get the value
        ctx.stack.pop() // pop the method off
        ctx.stack.pop() // pop off the receiver
        ctx.scope = ctx.stack.pop() as Obj // restore the cope
        let pc = ctx.stack.pop() as Obj
        ctx.pc = pc._get_js_number()
        let bytecode = ctx.stack.pop() as Obj
        ctx.bytecode = bytecode.get_js_slot('bytecode')
        // push the return value back on
        ctx.stack.push(value)
        return NilObj()
    }
    if (name === 'load-literal-number') {
        stack.push(NumObj(op[1] as number))
        return NilObj()
    }
    if (name === 'load-literal-string') {
        stack.push(StrObj(op[1] as string))
        return NilObj()
    }
    if (name === 'create-literal-block') {
        let blk = op[1] as BlockLiteral
        let blk2 = BlockProto.clone()
        blk2.name = 'Block'
        blk2._make_js_slot('args', blk.parameters);
        blk2._make_js_slot('body', blk.body);
        let bytecode = blk.body.map(a => compile_bytecode(a)).flat()
        bytecode.push(['return',null])
        blk2._make_js_slot('bytecode', bytecode)
        blk2.parent = scope;
        stack.push(blk2)
        return NilObj()
    }
    if (name === 'load-plain-id') {
        stack.push(scope.lookup_slot(op[1] as string))
        return NilObj()
    }
    if (name === 'lookup-message') {
        let message = op[1] as string
        let rec: Obj = stack.pop() as Obj
        let method = rec.lookup_slot(message)
        if(typeof method == 'function') {
            d.p(`error. method '${message}' on ${rec.print()} is unwrapped JS function`)
        }
        if (method.isNil()) {
            d.p("couldn't find the message")
            method = new Obj("MissingMethod",ObjectProto,{name:message})
        }
        stack.push(rec)
        stack.push(method)
        return NilObj()
    }
    if (name === 'send-message') {
        let arg_count = op[1] as number
        let args = []
        for (let i = 0; i < arg_count; i++) {
            args.push(stack.pop())
        }
        args.reverse()
        let method = stack.pop() as Obj
        let rec = stack.pop() as Obj
        return perform_dispatch(method,rec,args, stack, ctx)
    }
    if (name === 'assign') {
        let value = stack.pop() as Obj
        let name = stack.pop() as Obj
        scope._make_method_slot(name._get_js_string(), value)
        return NilObj()
    }
    if (name === 'return') {
        let value = stack.pop() as Obj
        let ret = new Obj('non-local-return',scope.parent,{})
        ret._is_return = true
        ret._make_method_slot('value',value)
        ret._make_method_slot('target',scope.parent as Obj)
        return ret
    }
    throw new Error(`unknown bytecode operation '${name}'`)
}

export function execute_bytecode(code: ByteCode, scope: Obj): Obj {
    d.p("start executing", code)
    let ctx:Context = {
        scope: scope,
        bytecode: code,
        pc: 0,
        stack: [],
        running:true
    }

    d.indent()
    while(ctx.running) {
        d.green(`==========  ${ctx.pc}`)
        d.green(`Stack (${ctx.stack.length}) : ` + ctx.stack.map(v => v.print()).join(", "))
        if(ctx.pc >= ctx.bytecode.length) {
            console.log("we are done")
            ctx.running = false
            break;
        }

        let op = ctx.bytecode[ctx.pc]
        d.red(`Op: ${op[0]} ${op[1]}`)
        let ret = execute_op(op, ctx.stack, scope, ctx)
        d.green(`Stack (${ctx.stack.length}) : ` + ctx.stack.map(v => v.print()).join(", "))
        if (ret.is_kind_of("Exception")) {
            d.error("returning exception")
            d.outdent()
            return ret
        }
    }
    d.outdent()
    d.p("done executing")
    d.p("stack left " + ctx.stack.length)

    if (ctx.stack.length > 0) {
        let last = ctx.stack.pop() as Obj
        d.p("returning",last.print())
        if (last && last._is_return) last = last.get_slot('value') as Obj;
        return last
    } else {
        return NilObj()
    }
}

export function compile_bytecode(ast: Ast): ByteCode {
    d.p("compiling", ast)
    if (Array.isArray(ast)) {
        return ast.map(a => compile_bytecode(a)).flat()
    }
    if (ast.type === 'statement') {
        return compile_bytecode(ast.value)
    }
    if (ast.type === 'group') {
        return ast.body.map(v => compile_bytecode(v)).flat() as ByteCode
    }
    if (ast.type === 'assignment') {
        return [
            [['load-literal-string', ast.target.name]],
            compile_bytecode(ast.value),
            [['assign', null]]
        ].flat() as ByteCode
    }
    if (ast.type === 'message-call') {
        return [
            compile_bytecode(ast.receiver),
            compile_bytecode(ast.call),
            // [['return-value',null]]
        ].flat() as ByteCode
    }
    if (ast.type === 'keyword-call') {
        let message_name = ast.args.map(arg => arg.name.name).join("")
        d.p("keyword message is " + message_name)
        let args = ast.args.map(arg => compile_bytecode(arg.value))
        return [
            [['lookup-message', message_name]],
            args.flat(),
            [['send-message', args.length]],
        ].flat() as ByteCode
    }
    if (ast.type === 'binary-call') {
        return [
            [['lookup-message', ast.operator.name]],
            compile_bytecode(ast.argument),
            [['send-message', 1]],
        ].flat() as ByteCode
    }
    if (ast.type === 'unary-call') {
        if(ast.message.name === 'halt') {
            return [
                ['halt',0]
            ]
        }
        return [
            [['lookup-message', ast.message.name]],
            [['send-message', 0]],
        ].flat() as ByteCode
    }
    if (ast.type === 'number-literal') {
        return [['load-literal-number', ast.value]]
    }
    if (ast.type === 'block-literal') {
        return [['create-literal-block', ast]]
    }
    if (ast.type === 'list-literal') {
        const temp_var = 'temp-list-var'
        let codes:Array<ByteOp> = [
            ['load-literal-string',temp_var],
            ['load-plain-id','List'],
            ['lookup-message','clone'],
            ['send-message',0],
            ['assign',null],
        ]
        ast.body.map(value => {
            let bt = compile_bytecode(value)
            codes.push(['load-plain-id',temp_var])
            codes.push(['lookup-message','add:'])
            // d.p("making byte code",bt)
            bt.forEach(code => codes.push(code))
            codes.push(['send-message',1])
        })
        return codes
    }
    if (ast.type === 'map-literal') {
        const temp_var = 'temp-map-var'
        let codes:Array<ByteOp> = [
            ['load-literal-string',temp_var],
            ['load-plain-id','Dict'],
            ['lookup-message','clone'],
            ['send-message',0],
            ['assign',null],
        ]
        ast.body.map(pair => {
            let bt = compile_bytecode(pair.value)
            codes.push(['load-plain-id',temp_var])
            codes.push(['lookup-message','at:set:'])
            bt.forEach(code => {
                codes.push(['load-literal-string',pair.name.name])
                codes.push(code)
            })
            codes.push(['send-message',2])
        })
        return codes
    }
    if (ast.type === 'string-literal') {
        return [['load-literal-string', ast.value]]
    }
    if (ast.type === 'plain-identifier') {
        return [['load-plain-id', ast.name]]
    }
    if (ast.type === 'return') {
        return [
            compile_bytecode(ast.value),
            [['return', null]]
        ].flat() as ByteCode
    }
    throw new Error(`unknown ast type ${ast.type}`)
}