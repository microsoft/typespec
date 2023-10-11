---
jsApi: true
title: "[I] LineAndCharacter"

---
Identifies the position within a source file by line number and offset from
beginning of line.

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `character` | `number` | The offset in UTF-16 code units to the character from the beginning of the<br />line. 0-based.<br /><br />NOTE: This is not necessarily the same as what a given text editor might<br />call the "column". Tabs, combining characters, surrogate pairs, and so on<br />can all cause an editor to report the column differently. Indeed, different<br />text editors report different column numbers for the same position in a<br />given document. |
| `line` | `number` | The line number. 0-based. |
