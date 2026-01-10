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
    private ast: BlockLiteral | undefined;
    constructor(parameterNames:Array<string>, bytecode:ByteCode, parent:Obj, ast?:BlockLiteral) {
        super('BytecodeMethod',parent,{});
        this.names = parameterNames
        this.bytecode = bytecode
        this.bytecode.push(['return-from-bytecode-call',null])
        this.ast = ast
    }
    // print(): string {
    //     return this.name + " [ " + util.inspect(this.bytecode) + ' ]'
    // }

    dispatch(ctx: Context, act:Obj): void {
        d.p("BytecodeMethod.dispatch: executing", this.print())
        d.p("bytecode is", this.bytecode)
        d.p('stack is',ctx.stack.print_small())
        let args = act.get_slot('args') as unknown as Array<Obj>
        d.p('args are',args.map(a => a.print()))
        d.p("this names is",this.names)
        if(args.length !== this.names.length){
            throw new Error(`arg count not equal to parameter length ${this.names.length}`)
        }
        let method = act.get_slot('method')
        d.p('method is', method.print())
        let rec = act.get_slot('receiver')
        d.p('rec is',rec.print())
        d.p("the receiver is " + rec.print())
        d.p("the method is " + method.print())
        d.p("we've got a bytecode method")
        act._make_method_slot('bytecode',ctx.bytecode)
        act._make_method_slot('scope',ctx.scope)
        act._make_method_slot('pc',ctx.pc)
        act._make_method_slot('stack',ctx.stack)
        ctx.bytecode = this.bytecode
        ctx.scope = act
        ctx.scope.parent = rec
        ctx.stack = new STStack()
        for (let i = 0; i < this.names.length; i++) {
            let param = this.names[i]
            d.p(`param '${param}'`, args[i].print())
            ctx.scope._make_method_slot(param, args[i])
        }
        ctx.pc = 0
    }
    cleanup(ctx: Context, act: Obj) {
        let ret = act.get_slot('return')
        if(!ret) ret = NilObj()
        d.p('ret is', ret.print())
        ctx.stack.push_with(ret,'return value from ' + this.name)
    }

    lookup_slot(name: string): Obj {
        if(name === 'self') {
            return this.parent.lookup_slot(name)
        }
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

export const BLOCK_ACTIVATION = "block-activation"
export function eval_block_obj(method:Obj, args:Array<Obj>) {
    d.p(`bytecode eval block obj: ${method.print()}`)
    d.p("bytecode is: " + method.get_js_slot("bytecode"))
    if (method.name === 'Block' && method.get_js_slot("bytecode") !== undefined) {
        let bytecode = method.get_js_slot('bytecode') as ByteCode;
        let scope = new ActivationObj(BLOCK_ACTIVATION, method, {})
        execute_bytecode(bytecode, scope)
    }
}
export function execute_op(op: ByteOp, ctx:Context): Obj {
    let name = op[0]
    ctx.pc++
    if(name === 'halt') {
        ctx.running = false
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
        let blk2 = new BytecodeMethod(blk.parameters.map(id => id.name), bytecode, BlockProto, blk)
        if(BlockProto.lookup_slot('whileTrue:')) {
            blk2._make_method_slot('whileTrue:', BlockProto.lookup_slot('whileTrue:'))
        }
        // set the parent to the enclosing scope
        blk2._make_method_slot("description",StrObj(desc))
        blk2.parent = ctx.scope
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
        d.p("sending message")
        d.p("stack before ", ctx.stack.print_small())
        let arg_count = op[1] as number
        let args = []
        for(let i=0; i<arg_count; i++) {
            args.push(ctx.stack.pop())
        }
        args.reverse()
        let method = ctx.stack.pop()
        let rec = ctx.stack.pop()
        let act = new ActivationObj(BLOCK_ACTIVATION, ctx.scope, {
            receiver:rec,
            method:method,
            args:args,
        });
        d.p("pushed activation")
        ctx.stack.push_with(act,`for ${method.print()} ${act.uuid}`);
        d.p('stack after',ctx.stack.print_small());
        // console.log("method is",act.get_slot('method'));
        (act.get_slot('method') as unknown as Method).dispatch(ctx,act);
        return NilObj()
    }
    if (name === 'return-message') {
        d.p("doing return message")
        let act = ctx.stack.pop()
        d.p('activation is',act.print())
        d.p('method is', act.get_slot('method').print());
        (act.get_slot('method') as unknown as Method).cleanup(ctx,act);
        return NilObj()
    }
    if (name === 'assign') {
        let value = ctx.stack.pop()
        let name = ctx.stack.pop()
        ctx.scope._make_method_slot(name._get_js_string(), value)
        return NilObj()
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
    if (name === 'return-from-bytecode-call') {
        d.p('return from a bytecode call')
        //keep the return value
        let ret = ctx.stack.pop() as Obj
        d.p("the return value is", ret.print())
        d.p("now the stack is")
        d.p(ctx.stack.print_small())
        let act = ctx.scope
        d.p('activation is',act.print())
        d.p('method is', act.get_slot('method').print());
        d.p('doing BytecodeMethod cleanup')
        let bytecode = act.get_slot('bytecode')
        d.p("old bytecode is", bytecode)
        let scope = act.get_slot('scope')
        d.p("old scope is",scope.print())
        let pc = act.get_slot('pc')
        let stack = act.get_slot('stack') as unknown as STStack
        act._make_method_slot('return',ret)
        d.p("old pc is",pc)
        ctx.bytecode = bytecode
        ctx.scope = scope
        ctx.pc = pc
        ctx.stack = stack
        return NilObj()
    }
    if( name === 'pop') {
        d.p("removing from the stack")
        ctx.stack.pop()
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
            d.p("we are done")
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
    d.p("compiling", AstToString(ast), ast.type)
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
            [['return-message',0]],
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
        codes.push(['load-plain-id',temp_var])
        return codes
    }
    if (ast.type === 'map-literal') {
        const temp_var = 'temp-map-var'
        let codes:Array<ByteOp> = [
            ['load-literal-string',temp_var],
            ['load-plain-id','Dict'],
            ['lookup-message','clone'],
            ['send-message',0],
            ['return-message',0],
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
            codes.push(['return-message',0])
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
            // [['return', null]]
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
