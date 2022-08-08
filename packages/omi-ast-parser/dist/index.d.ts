declare const methods: readonly ["Get", "Post", "Put", "Delete", "Patch"];
declare type Method = typeof methods[number];
export interface VariableTree {
    type: "variable";
    name: string;
    format: string;
    repeated: boolean;
}
export interface StructTree {
    type: "struct";
    name: string;
    items: VariableTree[];
}
export interface FunctionTree {
    type: "function";
    name: string;
    method: Method;
    requestArguments: VariableTree[];
    response: VariableTree;
}
export interface ServiceTree {
    type: "service";
    name: string;
    items: FunctionTree[];
}
export declare type AST = VariableTree | StructTree | FunctionTree | ServiceTree;
declare enum Status {
    Init = 1,
    Parsing = 2,
    Fulfilled = 3
}
declare class Parser {
    constructor();
    index: number;
    content: string;
    tree: AST[];
    status: Status;
    formatMap: Map<string, Partial<AST>>;
    setContent(content: string): void;
    wKeyword(word: string): StructTree | ServiceTree | null;
    wVariable(variableStart: string, stopChars: string[]): VariableTree;
    wRequestArguments(): VariableTree[];
    wParseMethod(name: string): Method;
    wFunction(start: string): FunctionTree;
    wIntend(node: Partial<StructTree | ServiceTree>): Partial<StructTree | ServiceTree>;
    wStruct(node: Partial<StructTree>): StructTree;
    wService(node: Partial<ServiceTree>): ServiceTree;
    build(): AST[];
    errorChecker(): void;
    skipSpace(): void;
    readWord(): string;
}
export default Parser;
