import vscode from "vscode";
import { createTypeSpecSymbolNameRangeResolver } from "./symbol-range.js";

export interface SymbolSnapshot {
  symbolKey: string;
  symbol: vscode.DocumentSymbol;
  ownText: string;
}

export function createSymbolSnapshots(
  document: vscode.TextDocument,
  symbols: readonly vscode.DocumentSymbol[],
  parentKey = "",
): SymbolSnapshot[] {
  const snapshots: SymbolSnapshot[] = [];
  const occurrences = new Map<string, number>();
  for (const symbol of symbols) {
    const identity = `${symbol.kind}:${symbol.name}`;
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);
    const symbolKey = `${parentKey}/${identity}:${occurrence}`;
    const children = [...symbol.children].sort((left, right) =>
      left.range.start.compareTo(right.range.start),
    );
    const ownText: string[] = [];
    let cursor = symbol.range.start;
    for (const child of children) {
      ownText.push(document.getText(new vscode.Range(cursor, child.range.start)));
      cursor = child.range.end;
    }
    ownText.push(document.getText(new vscode.Range(cursor, symbol.range.end)));
    snapshots.push(
      { symbolKey, symbol, ownText: ownText.join("").replace(/\s+/g, " ").trim() },
      ...createSymbolSnapshots(document, symbol.children, symbolKey),
    );
  }
  return snapshots;
}

export function createSymbolHoverRangeResolver(document: vscode.TextDocument) {
  const resolveSymbolNameRange = createTypeSpecSymbolNameRangeResolver(document.getText());
  return (symbol: vscode.DocumentSymbol): vscode.Range => {
    const nameRange = resolveSymbolNameRange(
      document.offsetAt(symbol.range.start),
      document.offsetAt(symbol.range.end),
    );
    return nameRange
      ? new vscode.Range(document.positionAt(nameRange.pos), document.positionAt(nameRange.end))
      : symbol.selectionRange;
  };
}
