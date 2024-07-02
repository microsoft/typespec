---
jsApi: true
title: "[I] Sym"

---
## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `declarations` | `readonly` | readonly [`Node`](../type-aliases/Node.md)[] | Nodes which contribute to this declaration |
| `exports?` | `readonly` | `SymbolTable` | Externally visible symbols contained inside this symbol. E.g. all declarations in a namespace, or members of an enum. |
| `flags` | `readonly` | [`SymbolFlags`](../enumerations/SymbolFlags.md) | - |
| `id?` | `readonly` | `number` | A unique identifier for this symbol. Used to look up the symbol links. |
| `members?` | `readonly` | `SymbolTable` | Symbols for members of this symbol which must be referenced off the parent symbol and cannot be referenced by other means (i.e. by unqualified lookup of the symbol name). |
| `metatypeMembers?` | `readonly` | `SymbolTable` | Symbol table |
| `name` | `readonly` | `string` | The name of the symbol |
| `parent?` | `readonly` | [`Sym`](Sym.md) | The symbol containing this symbol, if any. E.g. for things declared in a namespace, this refers to the namespace. |
| `symbolSource?` | `readonly` | [`Sym`](Sym.md) | For using symbols, this is the used symbol. |
| `type?` | `readonly` | [`Type`](../type-aliases/Type.md) | For late-bound symbols, this is the type referenced by the symbol. |
| `value?` | `readonly` | (...`args`: `any`[]) => `any` | For decorator and function symbols, this is the JS function implementation. |
