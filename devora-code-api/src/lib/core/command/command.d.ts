interface CommandBase<TType extends string> {
    id: string;
    readonly type: TType;
}
export type Command<TType extends string = string, TPayload = unknown> = unknown extends TPayload ? CommandBase<TType> & {
    readonly payload?: TPayload;
} : CommandBase<TType> & {
    readonly payload: TPayload;
};
export {};
//# sourceMappingURL=command.d.ts.map