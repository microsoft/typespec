---
jsApi: true
title: "[F] getRootLength"

---
```ts
getRootLength(path): number
```

Returns length of the root part of a path or URL (i.e. length of "/", "x:/", "//server/share/, file:///user/files").

For example:
```ts
getRootLength("a") === 0                   // ""
getRootLength("/") === 1                   // "/"
getRootLength("c:") === 2                  // "c:"
getRootLength("c:d") === 0                 // ""
getRootLength("c:/") === 3                 // "c:/"
getRootLength("c:\\") === 3                // "c:\\"
getRootLength("//server") === 7            // "//server"
getRootLength("//server/share") === 8      // "//server/"
getRootLength("\\\\server") === 7          // "\\\\server"
getRootLength("\\\\server\\share") === 8   // "\\\\server\\"
getRootLength("file:///path") === 8        // "file:///"
getRootLength("file:///c:") === 10         // "file:///c:"
getRootLength("file:///c:d") === 8         // "file:///"
getRootLength("file:///c:/path") === 11    // "file:///c:/"
getRootLength("file://server") === 13      // "file://server"
getRootLength("file://server/path") === 14 // "file://server/"
getRootLength("http://server") === 13      // "http://server"
getRootLength("http://server/path") === 14 // "http://server/"
```

## Parameters

| Parameter | Type |
| :------ | :------ |
| `path` | `string` |
