import {
    AnyNot,
    InputStream,
    Lit,
    OneOrMore,
    Or, ParseResult,
    Range,
    Seq,
    ws,
    ZeroOrMore
} from "./parser.ts";
import {
    Binary,
    Grp,
    PlnId,
    Method,
    Num,
    Str,
    SymId,
    Unary,
    KeyId,
    Keyword,
    KArg,
    Ass,
} from "./ast2.ts";
import type {PlainId, SymbolId, Ast2, KeywordArgument} from "./ast2.ts"
import type {Rule} from "./parser.ts"

export function p(rule:Rule, cb:(pass:ParseResult)=>unknown):Rule {
    return function (input:InputStream) {
        let pass = rule(input)
        if (pass.succeeded()) {
            pass.ast = cb(pass)
        }
        return pass
    }
}


const rawColon = Lit(":")
const rawOpenParen = Lit("(")
const LParen = ws(rawOpenParen)
const rawCloseParen = Lit(")")
const RParen = ws(rawCloseParen)
const Underscore = Lit("_")
const Digit = Range("0","9");
const Alpha = Or(Range("a","z"),Range("A","Z"));
const AlphaNumUnder = Or(Alpha, Digit, Underscore);
const rawAssignOperator = Lit(":=")
const AssignOperator = ws(rawAssignOperator)
const QQ = Lit('"')
const Q = Lit("'")

const rawPlainId = p(Seq(Alpha, OneOrMore(AlphaNumUnder)),(res) => PlnId(res.slice))
const PlainId = ws(rawPlainId)
const SymbolLiteral = Or(
    Lit("+"),Lit("-"),Lit("*"),Lit("/"),
    Lit("<"),Lit(">"),Lit(":"),Lit("="),Lit("!"))

const rawSymbolId = p(OneOrMore(SymbolLiteral),(res) => SymId(res.slice))
const SymbolID = ws(rawSymbolId)
const rawKeywordID = p(Seq(Alpha, OneOrMore(AlphaNumUnder), rawColon), (res) => KeyId(res.slice))
const KeywordID = ws(rawKeywordID)

const NumberLiteral = p(Seq(Digit,ZeroOrMore(Or(Digit,Underscore))),(res) => Num(parseInt(res.slice.replace('_', ''))))
const QStringLiteral = p(Seq(Q,ZeroOrMore(AnyNot(Q)),Q),(res) => Str(res.slice.substring(1, res.slice.length - 1)))
const QQStringLiteral = p(Seq(QQ,ZeroOrMore(AnyNot(QQ)),QQ),(res) => Str(res.slice.substring(1, res.slice.length - 1)))
const StringLiteral = Or(QStringLiteral, QQStringLiteral)



let Solo = Lit("dummy")

const Simple = Or(Solo, NumberLiteral, StringLiteral,PlainId)
const Group       = p(Seq(LParen, Simple, RParen),(res) => Grp(res.ast[1]))
const UnarySend = p(Or(Group,Simple),(res) => {
    let id = res.ast as Ast2
    if(id.type != 'plain-identifier') throw new Error(`unary arg must be an identifier: ${id.type}`)
    return Unary(res.ast as PlainId)
})
const BinarySend = p(Seq(SymbolID, Or(Group,Simple)),(res) => {
    let operator = res.ast[0] as Ast2
    if(operator.type != 'symbol-identifier') throw new Error(`binary operator must be symbol identifier: ${operator.type}`)
    let value = res.ast[1] as Ast2
    return Binary(operator,value)
})
const KeywordArg = p(Seq(KeywordID, Simple),(res) => {
    let keyword = res.ast[0] as Ast2
    if(keyword.type != 'keyword-id') throw new Error(`keyword must be a keyword identifier: ${keyword.type}`)
    let value = res.ast[1] as Ast2
    return KArg(keyword, value)
})
const KeywordSend = p(OneOrMore(KeywordArg), (res) => {
    let args = res.ast as unknown as Array<KeywordArgument>
    for(let arg of args) {
        if (arg.type != 'keyword-argument') throw new Error(`keyword must be a keyword identifier: ${arg.type}`)
    }
    return Keyword(...args)
})
const MessageSend = p(Seq(Or(Group,Simple), Or(KeywordSend, BinarySend, UnarySend)),(res)=> Method(res.ast[0], res.ast[1]))
const Assignment = p(Seq(PlainId, AssignOperator, Or(Group,MessageSend, Simple)),(res) => {
    let target = res.ast[0] as Ast2
    if(target.type != 'plain-identifier') throw new Error(`assignment target be a plain identifier: ${target.type}`)
    return Ass(target,res.ast[2])
})
Solo = Or(Assignment, MessageSend, NumberLiteral, StringLiteral, PlainId)

export const SoloExp = (input:InputStream) => Solo(input)

