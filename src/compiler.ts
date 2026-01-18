import type {Ast} from "./ast.ts";
import type {ByteCode, ByteOp} from "./obj.ts";

export function compile_bytecode(ast: Ast): ByteCode {
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
            [['return-message', 0]],
        ].flat() as ByteCode
    }
    if (ast.type === 'keyword-call') {
        let message_name = ast.args.map(arg => arg.name.name).join("")
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
        if (ast.message.name === 'halt') {
            return [
                ['halt', 0]
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
        let codes: Array<ByteOp> = [
            ['load-literal-string', temp_var],
            ['load-plain-id', 'List'],
            ['lookup-message', 'clone'],
            ['send-message', 0],
            ['return-message', 0],
            ['assign', null],
        ]
        ast.body.map(value => {
            let bt = compile_bytecode(value)
            codes.push(['load-plain-id', temp_var])
            codes.push(['lookup-message', 'add:'])
            bt.forEach(code => codes.push(code))
            codes.push(['send-message', 1])
            codes.push(['return-message', 0])
            codes.push(['pop', 0])// get rid of the nil result from 'add:'.
        })
        codes.push(['load-plain-id', temp_var])
        return codes
    }
    if (ast.type === 'map-literal') {
        const temp_var = 'temp-map-var'
        let codes: Array<ByteOp> = [
            ['load-literal-string', temp_var],
            ['load-plain-id', 'Dict'],
            ['lookup-message', 'clone'],
            ['send-message', 0],
            ['return-message', 0],
            ['assign', null],
        ]
        ast.body.map(pair => {
            let bt = compile_bytecode(pair.value)
            codes.push(['load-plain-id', temp_var])
            codes.push(['lookup-message', 'at:set:'])
            bt.forEach(code => {
                codes.push(['load-literal-string', pair.name.name])
                codes.push(code)
            })
            codes.push(['send-message', 2])
            codes.push(['return-message', 0])
            codes.push(['pop', 0])// get rid of the nil result from 'at:set:'.
        })
        codes.push(['load-plain-id', temp_var])
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
            [['return-nonlocal',0]]
        ].flat() as ByteCode
    }
    throw new Error(`unknown ast type ${ast.type}`)
}