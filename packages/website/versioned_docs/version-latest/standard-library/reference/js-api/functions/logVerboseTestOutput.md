---
jsApi: true
title: "[F] logVerboseTestOutput"

---
```ts
logVerboseTestOutput(messageOrCallback): void
```

Verbose output is enabled by default for runs in mocha explorer in VS Code,
where the output is nicely associated with the individual test, and disabled
by default for command line runs where we don't want to spam the console.

If the steps taken to produce the message are expensive, pass a callback
instead of producing the message then passing it here only to be dropped
when verbose output is disabled.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `messageOrCallback` | `string` \| (`log`) => `void` |
