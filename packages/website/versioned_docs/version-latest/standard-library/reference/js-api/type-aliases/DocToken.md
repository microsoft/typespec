---
jsApi: true
title: "[T] DocToken"

---
```ts
type DocToken: 
  | Token.NewLine
  | Token.Whitespace
  | Token.ConflictMarker
  | Token.Star
  | Token.At
  | Token.CloseBrace
  | Token.Identifier
  | Token.Hyphen
  | Token.DocText
  | Token.DocCodeSpan
  | Token.DocCodeFenceDelimiter
  | Token.EndOfFile;
```
