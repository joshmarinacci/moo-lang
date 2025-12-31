import {
    type ByteCode,
    type ByteOp,
    type Context,
    JS_VALUE,
    type Method,
    NilObj,
    Obj,
    ObjectProto,
    STStack
} from "./obj.ts";
import {type Ast, AstToString, type BlockLiteral} from "./ast.ts";
import {JoshLogger} from "./util.ts";
import {NumObj} from "./number.ts";
import {StrObj} from "./string.ts";
import {ActivationObj, BlockProto} from "./block.ts";
import {parse} from "./parser.ts";


let d = new JoshLogger()
d.disable()


export class BytecodeMethod extends Obj implements Method {
    private bytecode: ByteCode;
    private names: Array<string>;
    constructor(parameterNames:Array<string>, bytecode:ByteCode, parent:Obj) {
        super('BytecodeBlock',parent,{});
        this.names = parameterNames
        this.bytecode = bytecode
        this.bytecode.push(['return-from-bytecode-call',null])
    }
    // print(): string {
    //     return this.name + " [ " + util.inspect(this.bytecode) + ' ]'
    // }

    dispatch(ctx: Context, arg_count: number): void {
        console.log("executing", this.print())
        console.log("bytecode is", this.bytecode)
        console.log('stack is',ctx.stack.print_small())
        console.log("the argument count is", arg_count)
        let args:Array<Obj> = []
        for (let i = 0; i < arg_count; i++) {
            args.push(ctx.stack.pop())
        }
        args.reverse()
        let method = ctx.stack.pop() as Obj
        let rec = ctx.stack.pop() as Obj
        d.p("the receiver is " + rec.print())
        d.p("the method is " + method.print())
        d.p("we've got a bytecode method")
        // save the old state
        ctx.stack.push_with(new Obj("old-info",ObjectProto,{
            pc:ctx.pc,
            scope:ctx.scope,
            bytecode: ctx.bytecode,
        }),'old-state')
        ctx.bytecode = this.bytecode


        ctx.scope = new ActivationObj(`block-activation`, method, {
            receiver:rec,
            method:method,
            args:args,
        })
        for (let i = 0; i < this.names.length; i++) {
            let param = this.names[i]
            d.p(`param '${param}'`, args[i].print())
            ctx.scope._make_method_slot(param, args[i])
        }


        // console.log("final stack is",ctx.stack.map(o => o.print()))
        ctx.pc = 0
        // console.log("final scope is", ctx.scope)
    }

    lookup_slot(name: string): Obj {
        // console.log("doing custom lookup slot for ",name)
        if(name === 'value') {
            return this
            // return new BytecodeMethod(this.lit, this.bytecode, this.parent as Obj)
        }
        if(name === 'valueWith:') {
            return this
            // return new BytecodeMethod(this.lit, this.bytecode, this.parent as Obj)
        }
        return super.lookup_slot(name);
    }
}

export function eval_block_obj(method:Obj, args:Array<Obj>) {
    d.p(`bytecode eval block obj: ${method.print()}`)
    d.p("bytecode is: " + method.get_js_slot("bytecode"))
    if (method.name === 'Block' && method.get_js_slot("bytecode") !== undefined) {
        let bytecode = method.get_js_slot('bytecode') as ByteCode;
        let scope = new ActivationObj(`block-activation`, method, {})
        execute_bytecode(bytecode, scope)
    }
}
// export function perform_dispatch(method: Obj, rec: Obj, args: any[], stack: Obj[], ctx: Context):Obj {
//     d.p(`perform dispatch: ${method.name}`,method.print())
//     d.p("rec is " + rec.print())
//     d.p("args are " + args.map((arg) => arg.print()).join(", "))
//     if (method.name === 'MissingMethod') {
//         let handler = rec.lookup_slot('doesNotUnderstand:')
//         if(handler) {
//             d.p("the missing message name is",method.get_slot('name'))
//             let msg = new Obj("Message",ObjectProto,{})
//             msg._make_data_slot('selector',StrObj(method.get_slot('name')))
//             msg._make_data_slot('arguments',ListObj(...args))
//             d.p("doing extra dispatch to handler")
//             return perform_dispatch(handler,rec,[msg],stack)
//         } else {
//             return new Obj("Exception", ObjectProto, {"message": `Message not found: '${method.name}'`})
//         }
//     }
//     if (method.is_kind_of("NativeMethod")) {
//         d.p("doing the native method")
//         ctx.stack.push(new Obj("bytecode",ObjectProto,{bytecode:ctx.bytecode}))
//         ctx.stack.push_with(NumObj(ctx.pc+1),'pc')
//         ctx.stack.push_with(ctx.scope,'old-scope')
//         ctx.stack.push_with(rec,'receiver')
//         ctx.stack.push_with(method,'method')
//         let ret = (method.get_js_slot(JS_VALUE) as Function)(rec, args)
//                 stack.push(ret)
//         return NilObj()
//     }
//     if (method.is_kind_of("BytecodeMethod")) {
//         d.p("weve got a bytecode method")
//         d.p(method.get_js_slot('bytecode'))
//         ctx.stack.push(new Obj("bytecode",ObjectProto,{bytecode:ctx.bytecode}))
//         ctx.stack.push(NumObj(ctx.pc+1))
//         ctx.bytecode = method.get_js_slot('bytecode') as ByteCode
//         ctx.stack.push(ctx.scope)
//         d.p("the receiver is " + rec.print())
//         ctx.stack.push(rec)
//         d.p("the method is " + method.print())
//         ctx.stack.push(method)
//         args.forEach((arg) => {
//             ctx.stack.push(arg)
//         })
//         ctx.scope = new ActivationObj(`block-activation`, method, {
//             receiver:rec,
//             method:method,
//             args:args,
//         })
//         // set pc
//         ctx.pc = 0
//         //  setup args
//         return NilObj()
//     }
//     if (method.name === 'Block') {
//         method.parent = rec
//         if (method.name === 'Block' && method.get_js_slot("bytecode") !== undefined) {
//             ctx.stack.push(new Obj("bytecode",ObjectProto,{bytecode:ctx.bytecode}))
//             ctx.stack.push(NumObj(ctx.pc+1))
//             ctx.bytecode = method.get_js_slot('bytecode') as ByteCode
//             ctx.stack.push(ctx.scope)
//             ctx.stack.push(rec)
//             ctx.stack.push(method)
//             ctx.scope = new ActivationObj(`block-activation`, method, {})
//             // set pc
//             ctx.pc = 0
//             //  setup args
//             return NilObj()
//         }
//
//         let meth = method.get_js_slot('value') as unknown
//         if (meth instanceof Obj && meth.is_kind_of("NativeMethod")) {
//             let ret = (meth.get_js_slot(JS_VALUE) as Function)(method, args)
//             stack.push(ret)
//             return NilObj()
//         }
//         if (meth instanceof Function) {
//             let ret = meth(method, args)
//             stack.push(ret)
//             return NilObj()
//         }
//     }
//     d.error("method is", method)
//     d.p("is native method?", method.is_kind_of('NativeMethod'))
//     d.p("is block method?", method.is_kind_of('Block'))
//     throw new Error("shouldn't be here")
// }
export function execute_op(op: ByteOp, ctx:Context): Obj {
    let name = op[0]
    ctx.pc++
    if(name === 'halt') {
        ctx.running = false
        return NilObj()
    }
    if(name === 'return') {
        console.log("doing return with stack", ctx.stack.print_small())
        let value = ctx.stack.pop() // get the value
        ctx.stack.pop() // pop the method off
        ctx.stack.pop() // pop off the receiver
        ctx.scope = ctx.stack.pop() as Obj // restore the cope
        let pc = ctx.stack.pop() as Obj
        console.log("got the pc from the stack as", pc.print())
        ctx.pc = pc._get_js_number()
        let bytecode = ctx.stack.pop() as Obj
        ctx.bytecode = bytecode.get_js_slot('bytecode') as ByteCode
        // push the return value back on
        ctx.stack.push_with(value,'return')
        return NilObj()
    }
    if (name === 'load-literal-number') {
        ctx.stack.push_with(NumObj(op[1] as number),'literal')
        return NilObj()
    }
    if (name === 'load-literal-string') {
        ctx.stack.push_with(StrObj(op[1] as string),'literal')
        return NilObj()
    }
    if (name === 'create-literal-block') {
        let blk = op[1] as BlockLiteral
        let desc = AstToString(blk)
        let bytecode = blk.body.map(a => compile_bytecode(a)).flat()
        let blk2 = new BytecodeMethod(blk.parameters.map(id => id.name), bytecode, BlockProto )
        // blk2.parent = ctx.scope
        ctx.stack.push_with(blk2,desc)
        return NilObj()
    }
    if (name === 'load-plain-id') {
        ctx.stack.push_with(ctx.scope.lookup_slot(op[1] as string),op[1]as string)
        return NilObj()
    }
    if (name === 'lookup-message') {
        let message = op[1] as string
        let rec: Obj = ctx.stack.pop() as Obj
        let method = rec.lookup_slot(message)
        if(typeof method == 'function') {
            d.p(`error. method '${message}' on ${rec.print()} is unwrapped JS function`)
            throw new Error(`unwrapped js function: ${message} on ${rec.print()}`)
        }
        if (method.isNil()) {
            d.p("couldn't find the message")
            method = new Obj("MissingMethod",ObjectProto,{name:message})
        }
        ctx.stack.push_with(rec,'receiver')
        ctx.stack.push_with(method,message)
        return NilObj()
    }
    if (name === 'send-message') {
        let arg_count = op[1] as number
        let method = ctx.stack.getFromEnd(-arg_count);
        (method as unknown as Method).dispatch(ctx,arg_count);
        return NilObj()
    }
    if (name === 'assign') {
        let value = ctx.stack.pop()
        let name = ctx.stack.pop()
        ctx.scope._make_method_slot(name._get_js_string(), value)
        return NilObj()
    }
    if (name === 'return') {
        let value = ctx.stack.pop() as Obj
        let ret = new Obj('non-local-return',ctx.scope.parent,{})
        ret._is_return = true
        ret._make_method_slot('value',value)
        ret._make_method_slot('target',ctx.scope.parent as Obj)
        return ret
    }
    if (name === 'jump-if-true') {
        let distance = op[1] as number
        let value = ctx.stack.pop() as Obj
        d.p("current value is",value.print())
        if(value._get_js_boolean() === true) {
            d.p("jumping by ", distance)
            ctx.pc = distance;
        } else {
            d.p("not jumping")
        }
        return NilObj()
        // return ret
    }
    if(name === 'return-from-bytecode-call') {
        d.p('return from a bytecode call')
        //keep the return value
        let ret = ctx.stack.pop() as Obj
        let oldInfo = ctx.stack.pop() as Obj
        ctx.pc = oldInfo?._method_slots.get('pc') as number;
        ctx.scope = oldInfo?._method_slots.get('scope') as Obj;
        ctx.bytecode = oldInfo?._method_slots.get('bytecode') as ByteCode;
        ctx.stack.push_with(ret,'returned')
        d.p("now the stack is")
        d.p(ctx.stack.print_small())
        return NilObj()
    }
    throw new Error(`unknown bytecode operation '${name}'`)
}

export function execute_bytecode(code: ByteCode, scope: Obj): Obj {
    d.p("start executing", code)
    let ctx:Context = {
        scope: scope,
        bytecode: code,
        pc: 0,
        stack: new STStack(),
        running:true
    }

    d.indent()
    while(ctx.running) {
        d.green(`==========  ${ctx.pc}`)
        d.green(`Stack: ${ctx.stack.print_small()}`)
        d.green(`scope is ${ctx.scope.print()}`)
        if(ctx.pc >= ctx.bytecode.length) {
            console.log("we are done")
            ctx.running = false
            break;
        }

        let op = ctx.bytecode[ctx.pc]
        d.red(`Op: ${op[0]} ${op[1]}`)
        let ret = execute_op(op, ctx)
        d.green(`Stack: ${ctx.stack.print_small()}`)
        if (ret.is_kind_of("Exception")) {
            d.error("returning exception")
            d.outdent()
            return ret
        }
    }
    d.outdent()
    d.p("done executing")
    d.p("stack left " + ctx.stack.size())

    if (ctx.stack.size() > 0) {
        let last = ctx.stack.pop() as Obj
        d.p("returning",last.print())
        if (last && last._is_return) last = last.get_slot('value') as Obj;
        return last
    } else {
        return NilObj()
    }
}

export function compile_bytecode(ast: Ast): ByteCode {
    d.p("compiling", AstToString(ast))
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

export function bval(source: string, scope: Obj) {
    let bytecode = compile_bytecode(parse(source,'BlockBody'))
    // console.log("bytecode is",bytecode)
    let ret_bcode  =  execute_bytecode(bytecode,scope)
    // console.log("returned",ret_bcode.print())
}
