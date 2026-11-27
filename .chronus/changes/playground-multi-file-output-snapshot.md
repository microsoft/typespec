---
changeKind: fix
packages:
  - "@typespec/playground"
---

Keep every retained output file on the latest successful compilation after a later compile fails. Multi-file output could previously show an older copy of a file, or be blank if that file had not been opened.
