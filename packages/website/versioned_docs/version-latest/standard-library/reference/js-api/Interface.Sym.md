---
jsApi: true
title: "[I] Sym"

---
## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `readonly` `declarations` | *readonly* [`Node`](Type.Node.md)[] | Nodes which contribute to this declaration |
| `exports`? | `SymbolTable` | Externally visible symbols contained inside this symbol. E.g. all declarations<br />in a namespace, or members of an enum. |
| `readonly` `flags` | [`SymbolFlags`](Enumeration.SymbolFlags.md) | - |
| `id`? | `number` | A unique identifier for this symbol. Used to look up the symbol links. |
| `members`? | `SymbolTable` | Symbols for members of this symbol which must be referenced off the parent symbol<br />and cannot be referenced by other means (i.e. by unqualified lookup of the symbol<br />name). |
| `metatypeMembers`? | `SymbolTable` | Symbol table |
| `readonly` `name` | `string` | The name of the symbol |
| `parent`? | [`Sym`](Interface.Sym.md) | The symbol containing this symbol, if any. E.g. for things declared in<br />a namespace, this refers to the namespace. |
| `symbolSource`? | [`Sym`](Interface.Sym.md) | For using symbols, this is the used symbol. |
| `type`? | [`Type`](Type.Type.md) | For late-bound symbols, this is the type referenced by the symbol. |
| `value`? | (...`args`) => `any` | For decorator and function symbols, this is the JS function implementation. |
