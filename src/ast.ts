export type NumAst = {
    type: 'num',
    value: number,
}
export type StrAst = {
    type:'str',
    value: string,
}
export type GroupAst = {
    type:'group',
    value: Ast[]
}
export type StmtAst = {
    type: 'stmt',
    value: Ast[],
}
export type IdAst = {
    type:'id',
    value:string,
}
export type BlockAst = {
    type:'block',
    value: Ast[],
}
export type Ast = GroupAst | BlockAst | StmtAst | NumAst | StrAst | IdAst


export const Num = (value: number): NumAst => ({type: 'num', value})
export const Str = (value: string): StrAst => ({type: 'str', value})
export const Id = (value: string): IdAst => ({type: 'id', value})
export const Stmt = (...args: Ast[]): StmtAst => ({type: 'stmt', value: Array.from(args)})
export const Grp = (...args: Ast[]): GroupAst => ({type: 'group', value: Array.from(args)})
export const Blk = (...args: Ast[]): BlockAst => ({type: 'block', value: Array.from(args)})