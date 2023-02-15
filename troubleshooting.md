# Troubleshooting TypeSpec common issues

## `Cannot find package 'x' imported from 'y'` but not using this package

This is most likely due to package y having a `peerDependency` on package `x` and package x wasn't installed.
Verify the version of npm you are using. Before version 7 peerDependencies would not get installed automatically and you would have to manually install them.

### Solutions

- Update npm `npm install -g npm`
- If you cannot update npm, then adding the dependencies to your project dependency should resolve the issue `npm install x`
