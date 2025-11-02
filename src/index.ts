console.log('Happy developing ✨')
class BaseObject {
    private slots: Map<string,BaseObject>;
    private proto: BaseObject | null;
    constructor(proto: BaseObject | null) {
        this.proto = proto;
        this.slots = new Map<string,BaseObject>();
    }
    getSlot(name: string):BaseObject|undefined {
        if (!this.slots.has(name)) {
            console.log(`slot ${name} not found. checking parent`);
            return this.proto?.getSlot(name);
        }
        return this.slots.get(name)
    }

    setSlot(name: string, value: BaseObject) {
        this.slots.set(name,value)
    }
    call(name:string, args:BaseObject[]):BaseObject {
        console.log(`calling ${name}`);
        if (name == "clone") {
            return this.call_clone(args);
        }
        let fn = this.getSlot(name);
        console.log("fn is",fn);
        return (fn as MethodImpl).invoke(this,args);
    }

    private call_clone(args: any[]) {
        return new BaseObject(this)
    }
}
let global = new BaseObject(null);
global.setSlot("Object", new BaseObject(null));

class MethodImpl extends BaseObject {
    impl: Function
    constructor(proto:BaseObject|null, impl:Function) {
        super(proto);
        this.impl = impl;
    }
    invoke(self:BaseObject, args:BaseObject[]) {
        console.log("invoking " + this.impl, " with self", self)
        let res = this.impl.apply(self,args)
        console.log("resulted in ",res)
        return res
    }
    toString() {
        return `Method(${this.impl})`
    }
}
/*
 4 + 5
 */

class LNum extends BaseObject {
    private value: number;
    constructor(value:number) {
        super(null)
        this.value = value;
    }
    toString() {
        return `LNum(${this.value})`
    }
}

function testAdding() {
    let add = new MethodImpl(null, function (rhs: LNum) {
        return new LNum(this.value + rhs.value)
    })
    console.log("adding");
    let a = new LNum(4);
    a.setSlot("add", add)
    let b = new LNum(5);
    b.setSlot("add", add)
    console.log("a is", a)
    let c = a.call("add", [b])
    console.log("c is ", c);
}


function testDog() {
// let Object = global.getSlot("Object")
    let Obj = global.getSlot("Object") as BaseObject;
    console.log("object is ", Obj)
    global.setSlot("Dog", Obj.call("clone", []))
    console.log("Dog is", global.getSlot("Dog"))

    let speak_method = new MethodImpl(null, function (rhs: any) {
        console.log("speaking with args", rhs.toString())
    })
    global.getSlot("Dog")?.setSlot("speak", speak_method);
    global.getSlot("Dog")?.call("speak", [new LNum(2)])

    global.setSlot("dog", global.getSlot("Dog")?.call("clone", []));
    global.getSlot("dog")?.call("speak", [new LNum(2)])

}

