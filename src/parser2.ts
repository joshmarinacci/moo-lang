import {
    AnyNot,
    InputStream,
    Lit,
    OneOrMore,
    Or,
    produce,
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


const rawColon = Lit(":")
const rawOpenParen = Lit("(")
const OpenParen = ws(rawOpenParen)
const rawCloseParen = Lit(")")
const CloseParen = ws(rawCloseParen)
const Underscore = Lit("_")
const Digit = Range("0","9");
const Alpha = Or(Range("a","z"),Range("A","Z"));
const AlphaNumUnder = Or(Alpha, Digit, Underscore);
const rawAssignOperator = Lit(":=")
const AssignOperator = ws(rawAssignOperator)
const QQ = Lit('"')
const Q = Lit("'")

const rawPlainId = produce(Seq(Alpha, OneOrMore(AlphaNumUnder)),(res) => PlnId(res.slice))
const PlainId = ws(rawPlainId)
const SymbolLiteral = Or(
    Lit("+"),Lit("-"),Lit("*"),Lit("/"),
    Lit("<"),Lit(">"),Lit(":"),Lit("="),Lit("!"))

const rawSymbolId = produce(OneOrMore(SymbolLiteral),(res) => SymId(res.slice))
const SymbolID = ws(rawSymbolId)
const rawKeywordID = produce(Seq(Alpha, OneOrMore(AlphaNumUnder), rawColon), (res) => KeyId(res.slice))
const KeywordID = ws(rawKeywordID)

const NumberLiteral =produce( Seq(Digit,ZeroOrMore(Or(Digit,Underscore))),(res) => Num(parseInt(res.slice.replace('_', ''))))
const QStringLiteral = produce(Seq(Q,ZeroOrMore(AnyNot(Q)),Q),(res) => Str(res.slice.substring(1, res.slice.length - 1)))
const QQStringLiteral = produce(Seq(QQ,ZeroOrMore(AnyNot(QQ)),QQ),(res) => Str(res.slice.substring(1, res.slice.length - 1)))
export const StringLiteral = Or(QStringLiteral, QQStringLiteral)



let SoloExp1 = Lit("dummy")

const Simple = Or(SoloExp1, NumberLiteral, StringLiteral,PlainId)
const Group2       = produce(Seq(OpenParen, Simple, CloseParen),(res) => {
    // console.log("group",res)
    return Grp([res.production[1]])
})
const UnarySend = produce(Or(Group2,Simple),(res) => {
    let id = res.production as Ast2
    if(id.type != 'plain-identifier') throw new Error(`unary arg must be an identifier: ${id.type}`)
    return Unary(res.production as PlainId)
})
const BinarySend = produce(Seq(SymbolID, Or(Group2,Simple)),(res) => {
    let operator = res.production[0] as Ast2
    if(operator.type != 'symbol-identifier') throw new Error(`binary operator must be symbol identifier: ${operator.type}`)
    let value = res.production[1] as Ast2
    return Binary(operator,value)
})
const KeywordArg = produce(Seq(KeywordID, Simple),(res) => {
    let keyword = res.production[0] as Ast2
    if(keyword.type != 'keyword-id') throw new Error(`keyword must be a keyword identifier: ${keyword.type}`)
    let value = res.production[1] as Ast2
    return KArg(keyword, value)
})
const KeywordSend = produce(OneOrMore(KeywordArg), (res) => {
    let args = res.production as unknown as Array<KeywordArgument>
    for(let arg of args) {
        if (arg.type != 'keyword-argument') throw new Error(`keyword must be a keyword identifier: ${arg.type}`)
    }
    return Keyword(args)
})
export const MessageSend = produce(Seq(Or(Group2,Simple), Or(KeywordSend, BinarySend, UnarySend)),(res)=> {
    // console.log("send",res.production[0],res.production[1])
    return Method(res.production[0],res.production[1])
})
const Assignment = produce(Seq(PlainId, AssignOperator, Or(Group2,MessageSend)),(res) => {
    // console.log("assignment", res.production[0],res.production[2])
    let target = res.production[0] as Ast2
    if(target.type != 'plain-identifier') throw new Error(`assignment target be a plain identifier: ${target.type}`)
    return Ass(target,res.production[2])
})
SoloExp1 = Or(Assignment, MessageSend, NumberLiteral, StringLiteral, PlainId)

export const SoloExp3 =(input:InputStream) => SoloExp1(input)

