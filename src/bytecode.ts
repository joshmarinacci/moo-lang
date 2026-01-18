import {
    type ByteCode,
    JS_VALUE,
    type Method,
    type NativeMethodSignature,
    NilObj,
    Obj,
    ObjectProto,
    STStack,
    VMState
} from "./obj.ts";
import {AstToString, type BlockLiteral} from "./ast.ts";
import {JoshLogger} from "./util.ts";
import {NumObj} from "./number.ts";
import {StrObj} from "./string.ts";
import {BlockProto} from "./block.ts";
import {parse} from "./parser.ts";
import {compile_bytecode} from "./compiler.ts";

let d = new JoshLogger()
d.disable()

function handle_send_message(vm: VMState, rec: Obj, method: Obj, args: any[], scope: Obj) {
    d.p("handle_send_message " + method.print())
    d.p("    args are " + args.map(a => a.print()))
    d.indent()
    let act = new ActivationObj(scope, {
        receiver:rec,
        method:method,
        args:args,
    });
    vm.currentContext.stack.push_with(act,`for ${method.print()} ${act.uuid}`);
    if(method instanceof BytecodeMethod) {
        d.p("it is a bytecode method")
        vm.pushContext({
            label:method.label,
            bytecode:method.bytecode,
            scope:act,
            running: vm.currentContext.running,
            pc: 0,
            stack: new STStack()
        })
        act.parent = rec
        // set up the input parameters
        for (let i = 0; i < method.names.length; i++) {
            let param = method.names[i]
            act._make_method_slot(param, args[i])
        }
    } else {
        d.p("its a native method")
        vm.pushContext({
            label: 'bytecode-method',
            bytecode: [],
            scope: act,
            running: vm.currentContext.running,
            pc: 0,
            stack: new STStack()
        })
    }

    let meth = act.get_slot('method');
    if(meth.name === 'MissingMethod') {
        throw new Error(`${meth.print()} is missing method`)
    }
    if(meth.name == 'NativeMethod') {
        d.p("really invoking native method")
        let args = act.get_slot('args') as unknown as Array<Obj>
        // let meth = act.get_slot('method')
        let rec = act.get_slot('receiver')
        let ret = (meth.get_js_slot(JS_VALUE) as NativeMethodSignature)(rec, args,vm)
        if(ret instanceof Obj) {
            act._make_method_slot('return',ret)
        }
        d.p("the return value was " + act.get_slot("return").print())
        vm.popContext()
        d.outdent()
    }
    return act
}
function handle_return_from_bytecode_call(vm: VMState) {
    d.p("handle_return_from_bytecode_call")
    let ret = vm.currentContext.stack.pop();
    let act = vm.currentContext.scope
    act._make_method_slot('return', ret)
    vm.popContext()
    vm.currentContext.stack.pop()
    vm.currentContext.stack.push_with(act,'act')
    d.p("after handle return from bytecode stack is")
    d.p(vm.stack_print_small())
}
function handle_return_message(vm: VMState) {
    d.p("handle_return_message")
    let ctx = vm.currentContext
    let act = ctx.stack.pop();
    if(act.name !== 'block-activation') {
        console.log('act is',act);
        throw new Error("not block activation")
    }
    let meth = act.get_slot('method')
    if(meth.name === 'NativeMethod') {
        d.p("handling return from a native method")
        let ret = act.get_slot('return')
        if(!ret) ret = NilObj()
        vm.currentContext.stack.push_with(ret,'return value from ')
    } else {
        let ret = act.get_slot('return')
        if(!ret) ret = NilObj()
        d.p("putting the return value on the stack")
        vm.currentContext.stack.push_with(ret,'return value from ')
    }
    d.outdent()
}
function ending_dispatch(vm: VMState) {
    d.p('now vm context is: ' + vm.top().label)
    vm.currentContext.stack.pop()
    d.outdent()
}

export class BytecodeMethod extends Obj implements Method {
    bytecode: ByteCode;
    private names: Array<string>;
    private ast: BlockLiteral | undefined;
    label:string
    constructor(label:string, parameterNames:Array<string>, bytecode:ByteCode, parent:Obj, ast?:BlockLiteral) {
        super('BytecodeMethod',parent,{});
        this.label = label
        this.names = parameterNames
        this.bytecode = bytecode
        this.bytecode.push(['return-from-bytecode-call',null])
        this.ast = ast
    }
    dispatch(vm:VMState, act:Obj): void {
    }
    cleanup(vm:VMState, act: Obj) {
    }
    lookup_slot(name: string): Obj {
        if(name === 'self') return this.parent.lookup_slot(name)
        if(name === 'value') return this;
        if(name === 'valueWith:') return this;
        return super.lookup_slot(name);
    }
    print() {
        return `BytecodeMethod(${this.label})`
    }
}

export const BLOCK_ACTIVATION = "block-activation"

export class ActivationObj extends Obj {
    constructor(parent: Obj, props: Record<string, unknown>) {
        super(BLOCK_ACTIVATION, parent, props)
    }
    print():string {
        return "Activation(" + this.lookup_slot("method").print() + ")"
    }

    lookup_slot(name: string): Obj {
        if (name === 'self') {
            return this.parent.lookup_slot(name)
        }
        return super.lookup_slot(name);
    }
}

export function execute_op(vm:VMState): Obj {
    let ctx = vm.currentContext
    let op = ctx.bytecode[ctx.pc]
    d.p("---")
    d.p(`op: ${op}`)
    d.p(`stack ${vm.stack_print_small()}`)
    d.p(`scope is ${vm.currentContext.scope.print()}`)
    ctx.pc++
    let name = op[0]
    if(name === 'halt') {
        ctx.running = false
        vm.running = false
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
        let blk2 = new BytecodeMethod('anonymous', blk.parameters.map(id => id.name), bytecode, BlockProto, blk)
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
        let arg_count = op[1] as number
        let args = []
        for(let i=0; i<arg_count; i++) {
            args.push(ctx.stack.pop())
        }
        args.reverse()
        let method = ctx.stack.pop()
        let rec = ctx.stack.pop()
        handle_send_message(vm, rec, method, args, ctx.scope);
        return NilObj()
    }
    if (name === 'return-message') {
        handle_return_message(vm);
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
        if(value._get_js_boolean()) {
            ctx.pc = distance;
        }
        return NilObj()
    }
    if (name === 'return-from-bytecode-call') {
        handle_return_from_bytecode_call(vm)
        return NilObj()
    }
    if( name === 'pop') {
        ctx.stack.pop()
        return NilObj()
    }
    throw new Error(`unknown bytecode operation '${name}'`)
}

export function execute_bytecode(code: ByteCode, scope: Obj): Obj {
    let vm = new VMState(scope,code);
    while(vm.running) {
        if(vm.currentContext.pc >= vm.currentContext.bytecode.length) {
            d.p("we are done")
            vm.running = false
            break;
        }

        let ret = execute_op(vm)
        if (ret.is_kind_of("Exception")) {
            d.error("returning exception")
            return ret
        }
    }
    if (vm.currentContext.stack.size() > 0) {
        let last = vm.currentContext.stack.pop() as Obj
        if (last && last._is_return) last = last.get_slot('value') as Obj;
        return last
    } else {
        return NilObj()
    }
}

export function bval(source: string, scope: Obj) {
    let bytecode = compile_bytecode(parse(source,'BlockBody'))
    let ret_bcode  =  execute_bytecode(bytecode,scope)
}

export function eval_block_obj(vm: VMState, method: Obj, args: Array<Obj>) {
    if (!(vm instanceof VMState)) {
        throw new Error("vm not vmstate")
    }
    if (method.name === 'BytecodeMethod') {
        let act = handle_send_message(vm, method, method, args, method);
        while (vm.currentContext.running) {
            if (vm.currentContext.pc >= vm.currentContext.bytecode.length) break;
            execute_op(vm)
        }
        ending_dispatch(vm)
        return act.get_slot('return')
    }
    if (method.name !== 'Block') {
        throw new Error(`trying to eval a method that isn't a block '${method.name}'`)
    }
    let meth = method.get_js_slot('value') as unknown
    if (meth instanceof Obj && meth.is_kind_of("NativeMethod")) {
        return (meth.get_js_slot(JS_VALUE) as NativeMethodSignature)(method, args, vm)
    }
    throw new Error("bad failure on evaluating block object")
}