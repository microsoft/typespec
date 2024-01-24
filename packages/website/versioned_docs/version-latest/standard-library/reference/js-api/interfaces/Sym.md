---
jsApi: true
title: "[I] Sym"

---
## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `readonly` | `declarations` | readonly [`Node`](../type-aliases/Node.md)[] | Nodes which contribute to this declaration |
| `readonly` | `exports?` | `SymbolTable` | Externally visible symbols contained inside this symbol. E.g. all declarations<br />in a namespace, or members of an enum. |
| `readonly` | `flags` | [`SymbolFlags`](../enumerations/SymbolFlags.md) | - |
| `readonly` | `id?` | `number` | A unique identifier for this symbol. Used to look up the symbol links. |
| `readonly` | `members?` | `SymbolTable` | Symbols for members of this symbol which must be referenced off the parent symbol<br />and cannot be referenced by other means (i.e. by unqualified lookup of the symbol<br />name). |
| `readonly` | `metatypeMembers?` | `SymbolTable` | Symbol table |
| `readonly` | `name` | `string` | The name of the symbol |
| `readonly` | `parent?` | [`Sym`](Sym.md) | The symbol containing this symbol, if any. E.g. for things declared in<br />a namespace, this refers to the namespace. |
| `readonly` | `symbolSource?` | [`Sym`](Sym.md) | For using symbols, this is the used symbol. |
| `readonly` | `type?` | [`Type`](../type-aliases/Type.md) | For late-bound symbols, this is the type referenced by the symbol. |
| `readonly` | `value?` | (...`args`) => `any` | - |
