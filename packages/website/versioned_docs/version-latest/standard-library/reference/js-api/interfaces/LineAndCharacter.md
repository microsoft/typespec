[JS Api](../index.md) / LineAndCharacter

# Interface: LineAndCharacter

Identifies the position within a source file by line number and offset from
beginning of line.

## Table of contents

### Properties

- [character](LineAndCharacter.md#character)
- [line](LineAndCharacter.md#line)

## Properties

### character

• **character**: `number`

The offset in UTF-16 code units to the character from the beginning of the
line. 0-based.

NOTE: This is not necessarily the same as what a given text editor might
call the "column". Tabs, combining characters, surrogate pairs, and so on
can all cause an editor to report the column differently. Indeed, different
text editors report different column numbers for the same position in a
given document.

___

### line

• **line**: `number`

The line number. 0-based.
