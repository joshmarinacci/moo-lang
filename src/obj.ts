import {JoshLogger} from "./util.ts";
import util from "node:util";


export type OpType
    = 'lookup-message'
    | 'send-message'
    | 'load-literal-number'
    | 'load-plain-id'
    | 'load-literal-string'
    | 'create-literal-block'
    | 'assign'
    | 'halt'
    | 'jump-if-true'
    | 'return-from-bytecode-call'
    | 'return-message'
    | 'pop'
export type ByteOp = [OpType, unknown]
export type ByteCode = Array<ByteOp>;

export type Context = {
    scope:Obj,
    bytecode:Array<ByteOp>,
    pc:number,
    stack:STStack,
    running: boolean
    label: string
}

export class STStack {
    private data: Array<[Obj,string]>;
    constructor() {
        this.data = []
    }

    print_small():string {
        return ' ' + this.data.map(o => o[0].print() + '-' + o[1]).join(', ')
    }

    print_large() {
        return this.data.map(a => `${a[0].print()} - ${a[1]}`).join('\n')
    }

    pop():Obj {
        return this.data.pop()[0]
    }

    push(obj: Obj) {
        this.data.push([obj,'unnamed'])
    }

    push_with(obj: Obj, label: string) {
        this.data.push([obj,label])
    }

    size() {
        return this.data.length
    }

    getFromEnd(number: number):Obj {
        return this.data[this.data.length + number - 1][0]
    }

    items():Array<[Obj,string]> {
        return this.data.slice()
    }
}

export type Stack<T> = Array<T>
export type NativeMethodSignature = (rec:Obj, args:Array<Obj>, vm:VMState) => Obj;

export class VMState {
    currentContext:Context
    contexts:Stack<Context>
    running:boolean
    constructor(scope:Obj, code:ByteCode) {
        let ctx:Context = {
            scope:scope,
            bytecode:code,
            pc:0,
            label:'vm-start-context',
            stack: new STStack(),
            running:true,
        }
        this.running=true;
        this.contexts=[ctx]
        this.currentContext=ctx;
    }

    stack_print_small() {
        return this.currentContext.stack.print_small()
    }

    pushContext(ctx: Context) {
        this.contexts.push(ctx)
        this.currentContext = this.contexts[this.contexts.length - 1]
    }

    popContext() {
        this.contexts.pop()
        this.currentContext = this.contexts[this.contexts.length - 1]
    }
}

const d = new JoshLogger()
d.disable()

export const JS_VALUE = "_jsvalue"

export class Obj {
    name: string;
    parent: Obj|null;
    _data_slots: Map<string, Obj>;
    _method_slots: Map<string, Obj>;
    _is_return: boolean;
    private _hash_value: string;
    uuid: string;
    constructor(name: string, parent: Obj|null, props:Record<string,unknown>) {
        this.uuid = Math.random().toString(36);
        this._hash_value = "obj_"+(Math.random()*1_000_000)
        this.name = name;
        this.parent = parent
        this._data_slots = new Map<string,Obj>
        this._method_slots = new Map<string,Obj>
        this._is_return = false;
        for(let key in props) {
            this._method_slots.set(key,props[key])
        }
    }

    _make_data_slot(name:string, obj:Obj) {
        if(!obj) {
            throw new Error(`cannot make data slot ${name}. value is null`)
        }
        this._data_slots.set(name,obj)
        this._make_method_slot(name,NatMeth((rec:Obj,args:Array<Obj>):Obj =>{
            return rec._get_data_slot(name)
        },`${name} getter`))
        this._make_method_slot(name+":",NatMeth((rec:Obj,args:Array<Obj>):Obj =>{
            return rec._set_data_slot(name,args[0])
        },`${name} setter`))
    }
    _get_data_slot(name:string):Obj {
        if (!this._data_slots.has(name)) {
            if(this.parent) {
                return this.parent._get_data_slot(name)
            } else {
                console.error(`no such data slot ${name}`)
                return NilObj()
            }
        } else {
            return this._data_slots.get(name)
        }
    }
    _set_data_slot(name:string, value:Obj):Obj {
        if(this._data_slots.has(name)) {
            this._data_slots.set(name,value)
            return NilObj()
        } else {
            if (this.parent) {
                return this.parent._set_data_slot(name,value)
            } else {
                return NilObj()
            }
        }
    }
    _make_method_slot(name: string, obj: Obj) {
        if(obj === null || obj == undefined) {
            throw new Error(`cannot make method slot ${name}. value is null`)
        }
        this._method_slots.set(name,obj)
    }
    _make_js_slot(name: string, value:unknown) {
        this._method_slots.set(name,value)
    }
    print():string {
        return this._safe_print(5)
    }
    _print_parent_chain():string {
        let str = this.print()
        if(this.parent) str += ",  " + this.parent._print_parent_chain()
        return str
    }
    _safe_print(depth:number):string {
        if (depth < 1) {
            return this.name
        }
        if (this.name === 'Global') return `Global Scope`
        if (this.name === 'NumberLiteral') {
            return `NumberLiteral (${this._get_js_number()})`;
        }
        if (this.name === 'jsvalue') {
            let jsval = this.get_slot('jsval') as unknown
            let txt:string = typeof jsval
            if(typeof jsval === 'string') {
                txt = `string: "${jsval}"`
            }
            if(typeof jsval === 'number') {
                txt = `number: ${jsval}`
            }
            if(typeof jsval === 'undefined') {
                txt = 'undefined'
            }

            return `JSValue(${txt})`
        }
        if (this.name === 'StringLiteral') {
            return `String(${this._get_js_string()})`;
        }
        if (this.name === 'SymbolReference') {
            return `SymbolReference (${this._get_js_string()})`;
        }
        if (this.name === 'BooleanLiteral') {
            return `Boolean(${this._get_js_boolean()})`;
        }
        if (this.name === 'Dict' || this.name === 'DictProto') {
            let rec = this._get_js_record()
            let contents = Object.keys(rec).map(k => k + ':' + rec[k].print())
            return `Dict (${contents.join(', ')})`
        }
        if (this.name === 'NilLiteral') {
            return `Nil`
        }
        if (this.name === 'NativeMethod') {
            return `NativeMethod`
            // return `NativeMethod (${this._get_js_unknown()})`
        }
        if (this.name === 'Exception') {
            return `Exception: ${this.get_slot('message')}`
        }
        if (this.name === 'Block') {
            return `Block (${util.inspect(this.get_slot('bytecode'))}`
        }
        if (this.name === 'List' || this.name === 'ListProto') {
            return `List: {${this._get_js_array().map(v => v._safe_print(depth-1)).join(', ')}}`
        }
        let slots = Array.from(this._data_slots.keys()).map(key => {
            let val:unknown = this._data_slots.get(key)
            if (val instanceof Obj) {
                val = val._safe_print(depth - 1)
            }
            return key + ":" + val
        })
        let parent = this.parent?this.parent._safe_print(1):'nil'
        parent = ''
        return `${this.name} {${slots.join(' ')}} ${parent} `
    }
    // has_slot(name: string) {
    //     return this._method_slots.has(name)
    // }
    get_slot(name: string):Obj {
        return this._method_slots.get(name)
    }
    _list_slot_names():string[] {
        return Array.from(this._method_slots.keys())
    }
    lookup_slot(name: string):Obj {
        if (name === 'self') {
            return this
        }
        return this._safe_lookup_slot(name, 20);
    }
    _safe_lookup_slot(name: string, depth: number): Obj {
        if(depth < 1) {
            throw new Error("recursed too deep!")
        }
        if(this._method_slots.has(name)) {
            return this._method_slots.get(name)
        }
        if(this.parent) {
            if (this.parent.isNil()) {
            } else {
                return this.parent._safe_lookup_slot(name, depth - 1)
            }
        }
        d.warn(`slot not found!: '${name}'`)
        // throw new Error(`slot not found! "${name}"`)
        return NilObj()
    }
    get_js_slot(name: string):unknown {
        return this._method_slots.get(name)
    }
    _get_js_number():number {
        return this.get_js_slot(JS_VALUE) as number
    }
    _get_js_string():string {
        return this.get_js_slot(JS_VALUE) as string
    }
    _get_js_boolean():boolean {
        return this.get_js_slot(JS_VALUE) as boolean
    }
    _get_js_array():Array<Obj> {
        return this.get_js_slot(JS_VALUE) as Array<Obj>
    }
    _get_js_record():Record<string,Obj> {
        return this.get_js_slot(JS_VALUE) as Record<string,Obj>
    }
    _get_js_unknown():unknown {
        return this.get_js_slot(JS_VALUE) as unknown
    }
    _set_js_unknown(value:unknown) {
        this._method_slots.set(JS_VALUE,value as Obj)
    }

    _let_field(name:string, obj:Obj):void{
        if(!obj) throw new Error(`cannot make method slot ${name}. value is null`)
        this._method_slots.set(name,obj)
    }
    _set_field(name:string, obj:Obj):void {
        if(this._method_slots.has(name)) {
            this._method_slots.set(name,obj)
        } else {
            if(this.parent) {
                this.parent._set_field(name,obj)
            }
        }
    }

    clone() {
        let obj = new Obj(this.name, this.parent, this.getSlots())
        obj._data_slots = new Map<string, Obj>()
        for(let key of this._data_slots.keys()) {
            obj._data_slots.set(key,this._data_slots.get(key))
        }
        return obj
    }

    private getSlots():Record<string, unknown> {
        let slots:Record<string,unknown> = {}
        for(let key of this._method_slots.keys()) {
            slots[key] = this._method_slots.get(key)
        }
        return slots
    }

    to_string():string {
        if (this._get_js_string()) {
            return this._get_js_string()
        }
        return this.print()
    }

    is_kind_of(name: string):boolean {
        if(this.name == name) return true
        if(this.parent) return this.parent.is_kind_of(name)
        return false;
    }

    hash_value() {
        if(this.is_kind_of('NumberProto')) {
            return this._get_js_number()
        }
        if(this.is_kind_of('StringProto')) {
            return this._get_js_string()
        }
        return this._hash_value
    }

    isNil() {
        if(this.name === 'NilLiteral') return true;
        return false;
    }
}

export interface Method {
    dispatch(vm: VMState, act:Obj):void;
    cleanup(vm:VMState, act:Obj):void;
}

class NativeMethod extends Obj implements Method {
    private label: string;
    constructor(name:string, label:string, parent:Obj, props:Record<string,unknown>) {
        super(name,parent,props);
        this.label = label
    }
    dispatch(vm: VMState, act:Obj): void {
        let args = act.get_slot('args') as unknown as Array<Obj>
        let meth = act.get_slot('method')
        let rec = act.get_slot('receiver')
        let ret = (this.get_js_slot(JS_VALUE) as NativeMethodSignature)(rec, args,vm)
        if(ret instanceof Obj && !ret.isNil()) {
            act._make_method_slot('return',ret)
        }
    }
    cleanup(vm:VMState, act: Obj) {
        let ret = act.get_slot('return')
        if(!ret) ret = NilObj()
        vm.currentContext.stack.push_with(ret,'return value from ' + this.label)
    }
}
const FNM = (name:string, fun:NativeMethodSignature):Obj => {
    return new NativeMethod("NativeMethod",name,null, {
        '_jsvalue':fun
    })
}
export const JSWrapper = (value:unknown):Obj => {
    return new Obj('jsvalue',ROOT,{jsval:value})
}
export const ROOT = new Obj("ROOT", null,{
    'make_data_slot:with:':FNM('make_data_slot:with:',((rec:Obj, args:Array<Obj>):Obj => {
        rec._make_data_slot(args[0]._get_js_string(), args[1])
        return NilObj()
    })),
    'let:be:':FNM('let:be:',((rec:Obj, args:Array<Obj>):Obj => {
        rec._make_data_slot(args[0]._get_js_string(), args[1])
        return NilObj()
    })),
    'understands:with:':FNM('understands:with:',(rec:Obj, args:Array<Obj>):Obj => {
        let slot_name = args[0]._get_js_string()
        let slot_value = args[1]
        rec._make_method_slot(slot_name,slot_value)
        if (slot_value.name === 'Block') {
            slot_value.parent = rec
        }
        return NilObj();
    }),
    'getSlot:':FNM('getSlot:',(rec:Obj, args:Array<Obj>):Obj => {
        let slot_name = args[0]._get_js_string()
        return rec.get_slot(slot_name)
    }),
    'getJsSlot:':FNM('getJsSlot:',(rec:Obj, args:Array<Obj>):Obj => {
        let slot_name = args[0]._get_js_string()
        let jsval = rec.get_js_slot(slot_name)
        return JSWrapper(jsval)
    }),
    'setJsSlot:to:':(rec:Obj, args:Array<Obj>):Obj => {
        let slot_name = args[0]._get_js_string()
        let jsvalue = args[1]
        rec._set_js_unknown(jsvalue)
        return NilObj()
    },
    'setObjectName:':FNM('setObjectName:',(rec:Obj, args:Array<Obj>):Obj => {
        rec.name = args[0]._get_js_string()
        return NilObj()
    }),
    'clone':FNM('clone',(rec:Obj):Obj => rec.clone()),
    'doesNotUnderstand:':FNM('doesNotUnderstand:',(rec:Obj, args:Array<Obj>):Obj => {
        let msg = args[0]
        let name = msg._get_data_slot('selector')
        return new Obj("Exception", ObjectProto, {"message": `Message not found: '${name._get_js_string()}'`})
    }),
});
export const ObjectProto = new Obj("ObjectProto", ROOT, {})
 const NilProto = new Obj("NilProto",ObjectProto,{});
export const NilObj = () => new Obj("NilLiteral", NilProto, {})

export const NativeMethodProto = new Obj("NativeMethodProto", ObjectProto, {})
export const NatMeth = (fun:NativeMethodSignature,label?:string):Obj => {
    return new NativeMethod("NativeMethod", label?label:'unnamed', NativeMethodProto, {
        '_jsvalue': fun,
    })
}

ROOT._make_method_slot('makeSlot:with:',NatMeth((rec:Obj, args:Array<Obj>):Obj => {
    let slot_name = args[0]._get_js_string()
    let slot_value = args[1]
    rec._make_method_slot(slot_name,slot_value)
    if (slot_value.name === 'BytecodeMethod') {
        slot_value.label = slot_name
    }
    if (slot_value.name === 'Block') {
        slot_value.parent = rec
    }
    return NilObj();
},'makeSlot:with:'))
ROOT._make_method_slot('_let:with:',NatMeth((rec:Obj, args:Array<Obj>,vm:VMState) => {
    rec._let_field(args[0]._get_js_string(), args[1])
    return args[1]
},'_let:with:'))
ROOT._make_method_slot('_set:with:',NatMeth((rec:Obj, args:Array<Obj>,vm:VMState) => {
    rec._set_field(args[0]._get_js_string(), args[1])
    return args[1]
},'_let:with:'))

export function setup_object(scope: Obj) {
    scope._make_method_slot("Object", ObjectProto)
    scope._make_method_slot("Nil", NilProto)
    scope._make_method_slot('nil', NilObj())
}

export function make_native_obj(name: string, proto: Obj, methods: Record<string, NativeMethodSignature>) {
    let wrapped_methods: Record<string, Obj> = {}
    Object.keys(methods).forEach(method => {
        wrapped_methods[method] = NatMeth(methods[method],method)
    })
    return new Obj(name, proto, wrapped_methods);
}