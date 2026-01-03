import process from "node:process"
import {make_standard_scope} from "./standard.ts";
import {Obj} from "./obj.ts";

process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding("utf8");

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const GREEN_BOLD = '\x1b[1;32m'
const BLUE_BOLD = '\x1b[1;34m'
const RESET = '\x1b[0m'; // Resets all attributes

function header() {
    process.stdout.write(`${RED}input is: ${RESET}`+'\n')
}

const scope = make_standard_scope()

class TreeState {
    root:Obj
    selection:string
    // selected:Obj
    path:string[]
    constructor(root:Obj) {
        this.root = root
        // this.selected = root
        this.path = []
        this.selection = ""
    }

    nav_next_item() {
        let names = this.get_selected_children()
        let name = this.selection
        let index = names.indexOf(name)
        if(index < 0) index = 0
        index += 1;
        if(index > names.length-1) index = names.length-1
        name = names.at(index)
        this.selection = name
    }

    nav_prev_item() {
        let names = this.get_selected_children()
        let name = this.selection
        let index = names.indexOf(name)
        if(index < 0) index = 0
        index -= 1;
        if(index < 0) index = 0
        name = names.at(index)
        this.selection = name
    }

    get_selected_item():Obj {
        if(this.path.length === 0) {
            return this.root
        }
        let sel = this.root
        for(let name of this.path) {
            // console.log(`looking at ${name}`)
            sel = sel.lookup_slot(name)
            // console.log('sel is', sel.print())
        }
        return sel
    }
    get_selected_children():string[] {
        return this.get_selected_item()._list_slot_names()
    }

    is_selected_name(name: string):boolean {
        return this.selection === name
    }

    select_item() {
        let name = this.selection
        console.log('selecting item',name)
        let obj = this.get_selected_item().get_slot(name) as unknown
        if(obj instanceof Obj) {
            this.path.push(name)
            // console.log("path is",this.path)
            // console.log("now target is ", this.get_selected_item().print())
            this.selection = this.get_selected_children()[0]
        } else {
            console.log("cannot select. not an object.")
        }
    }

    nav_up_target() {
        // console.log("current path is",this.path)
        let name = this.path.pop()
        if(this.path.length === 0 && name) {
            this.selection = name
        }
    }
}

let state = new TreeState(scope)
state.selection = 'Number'

function print_scope_view(state:TreeState) {
    const l = (...args:unknown[]) => process.stdout.write(args.join("")+"\n")
    l('========== scope =======')
    l(`${state.root.name} > ${state.path.join(' > ')}`)
    for(let name of state.get_selected_children()) {
        if(state.is_selected_name(name)) {
            l(`  * ${name}`)
        } else {
            l(`    ${name}`)
        }
    }
}

const key_bindings = {
    'q':() => {
        process.exit()
    },
    'j':() => {
        state.nav_next_item()
    },
    'k':() => {
        state.nav_prev_item()
    },
    '\r':() => {
        state.select_item()
    },
    '\u001b[A': () => {
        state.nav_prev_item()
    },
    '\u001b[B': () => {
        state.nav_next_item()
    },
    '\u001b[D': () => {
        state.nav_up_target()
    }
}

function clear_screen() {
    process.stdout.write("\x1Bc");
}

process.stdin.on("data", (key:string) => {
    // Ctrl+C
    if (key === "\u0003") {
        process.exit();
    }
    if(key in key_bindings) {
        key_bindings[key]();
        clear_screen()
        print_scope_view(state)
        return
    }
    console.log(JSON.stringify(key));
});
function cleanup() {
    process.stdin.setRawMode(false);
    process.stdin.pause();
}
process.on("exit", cleanup);
process.on("SIGINT", () => {
    cleanup();
    process.exit();
});
process.stdout.write("going\n")
print_scope_view(state)