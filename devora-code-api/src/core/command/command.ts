// Basis-Struktur ohne das Payload-Feld
interface CommandBase<TType extends string> {
  id: string;
  readonly type: TType;
}

// Der magische Typ: Wenn TPayload unbekannt/leer ist -> optional, sonst -> required
export type Command<TType extends string = string, TPayload = unknown> = 
  unknown extends TPayload
    ? CommandBase<TType> & { readonly payload?: TPayload } // Optional
    : CommandBase<TType> & { readonly payload: TPayload };  // Erforderlich!

