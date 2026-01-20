import {JS_VALUE, type NativeMethodSignature, NilObj, Obj, STStack, VMState} from "./obj.ts";
import {BytecodeMethod, execute_op} from "./bytecode.ts";
import {JoshLogger} from "./util.ts";


export const BLOCK_ACTIVATION = "block-activation"

let d = new JoshLogger()
d.disable()

export class ActivationObj extends Obj {
    constructor(parent: Obj, props: Record<string, unknown>) {
        super(BLOCK_ACTIVATION, parent, props)
    }

    print(): string {
        return "Activation(" + this.lookup_slot("method").print() + ")"
    }

    lookup_slot(name: string): Obj {
        if (name === 'self') {
            // @ts-ignore
            return this.parent.lookup_slot(name)
        }
        return super.lookup_slot(name);
    }
}

export function handle_send_message(vm: VMState, rec: Obj, method: Obj, args: any[], scope: Obj) {
    d.p("handle_send_message " + method.print())
    d.p("    args are " + args.map(a => a.print()))
    d.indent()
    let act = new ActivationObj(scope, {
        receiver: rec,
        method: method,
        args: args,
    });
    vm.currentContext.stack.push_with(act, `for ${method.print()} ${act.uuid}`);
    if (method instanceof BytecodeMethod) {
        d.p("it is a bytecode method")
        vm.pushContext({
            label: method.label,
            bytecode: method.bytecode,
            scope: act,
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
    if (meth.name === 'MissingMethod') {
        throw new Error(`${meth.print()} is missing method`)
    }
    if (meth.name == 'NativeMethod') {
        d.p("really invoking native method")
        let args = act.get_slot('args') as unknown as Array<Obj>
        // let meth = act.get_slot('method')
        let rec = act.get_slot('receiver')
        let ret = (meth.get_js_slot(JS_VALUE) as NativeMethodSignature)(rec, args, vm)
        if (ret instanceof Obj) {
            act._make_method_slot('return', ret)
        }
        vm.popContext()
        d.outdent()
    }
    return act
}

export function handle_return_from_bytecode_call(vm: VMState) {
    d.p("handle_return_from_bytecode_call")
    let ret = vm.currentContext.stack.pop();
    let act = vm.currentContext.scope
    act._make_method_slot('return', ret)
    vm.popContext()
    vm.currentContext.stack.pop()
    vm.currentContext.stack.push_with(act, 'act')
    d.p("after handle return from bytecode stack is")
    d.p(vm.stack_print_small())
}

export function handle_return_message(vm: VMState) {
    d.p("handle_return_message")
    let ctx = vm.currentContext
    let act = ctx.stack.pop();
    if (act.name !== 'block-activation') {
        console.log('act is', act);
        throw new Error("not block activation")
    }
    let meth = act.get_slot('method')
    if (meth.name === 'NativeMethod') {
        d.p("handling return from a native method")
        let ret = act.get_slot('return')
        if (!ret) ret = NilObj()
        if(ret.name === 'non-local-return') {
            console.log("this is a nonlocal return")
            console.log("the target scope is " + ret.get_slot('target').print())
            console.log("current scope is " + vm.currentContext.scope.print())
            if(vm.currentContext.scope === ret.get_slot('target')) {
                act._make_method_slot('return',ret.get_slot('value'));
                console.log('we are at the right exit point. early return.')
                vm.popContext();
                vm.currentContext.stack.pop()
                vm.currentContext.stack.push_with(act,'act')
                return;
            }
        }
        vm.currentContext.stack.push_with(ret, `ret from ${meth.print()}`)
    } else {
        let ret = act.get_slot('return')
        if (!ret) ret = NilObj()
        d.p("putting the return value on the stack")
        if(ret.name === 'non-local-return') {
            console.log("this is a nonlocal return")
            console.log("the target scope is " + ret.get_slot('target').print())
            console.log("current scope is " + vm.currentContext.scope.print())
        }
        vm.currentContext.stack.push_with(ret, `ret from ${meth.print()}`)
    }
    d.outdent()
}

function ending_dispatch(vm: VMState) {
    d.p('now vm context is: ' + vm.top().label)
    vm.currentContext.stack.pop()
    d.outdent()
}

export function eval_block_obj(vm: VMState, method: Obj, args: Array<Obj>) {
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