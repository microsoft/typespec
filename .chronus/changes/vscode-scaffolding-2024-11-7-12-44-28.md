---
changeKind: feature
packages:
  - typespec-vscode
---

Support "Create TypeSpec Project" in vscode command and EXPLORER when no folder opened
Add Setting "typespec.initTemplatesUrls" where user can configure additional template to use to create TypeSpec project
example:
```
{
  "typespec.initTemplatesUrls": [
    {
      "name": "displayName",
      "url": "https://urlToTheFileContainsTemplates"
    }],
}
```
Support "Install TypeSpec Compiler/CLI globally" in vscode command to install TypeSpec compiler globally easily

