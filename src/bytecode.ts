import {type ByteCode, NilObj, Obj, ObjectProto, VMState} from "./obj.ts";
import {AstToString, type BlockLiteral} from "./ast.ts";
import {JoshLogger} from "./util.ts";
import {NumObj} from "./number.ts";
import {StrObj} from "./string.ts";
import {BlockProto} from "./block.ts";
import {parse} from "./parser.ts";
import {compile_bytecode} from "./compiler.ts";
import {
    handle_return_from_bytecode_call,
    handle_return_message,
    handle_send_message
} from "./dispatch.ts";

let d = new JoshLogger()
d.disable()

export class BytecodeMethod extends Obj {
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
