---
id: faq
title: FAQ
---

## I'm getting the error `Cannot find package 'x' imported from 'y'`, but I'm not using this package. Why?

This issue typically arises when package 'y' has a `peerDependency` on package 'x', and package 'x' hasn't been installed. This can occur if you're using a version of npm that's older than version 7, as these older versions don't automatically install peerDependencies. You would need to install them manually.

### How can I fix this?

- You can update npm using the command `npm install -g npm`.
- If you're unable to update npm, you can add the dependencies to your project dependency. This should resolve the issue. Use the command `npm install x`.
