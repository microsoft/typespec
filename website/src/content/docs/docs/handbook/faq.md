---
id: faq
title: FAQ
---

#### I'm getting the error `Cannot find package 'x' imported from 'y'`, but I'm not using this package. Why?

This issue typically arises when package 'y' has a `peerDependency` on package 'x', and package 'x' isn't installed. This can occur if you're using a package manger that doesn't auto install implicit peer dependencies. It is the case for

- `npm` (before version 7)
- `yarn`

##### How can I fix this?

| Package Manager | Action                                                            |
| --------------- | ----------------------------------------------------------------- |
| `npm`           | Upgrade npm `npm install -g npm`                                  |
| `yarn`          | Add `x` intermediate dependency to your package.json dependencies |
