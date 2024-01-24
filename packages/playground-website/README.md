# TypeSpec Playground Website

A self contained website for the TypeSpec Playground.

## Use

- `npm start` to start in dev mode
- `npm run preview` to build and preview prod mode
- `npm run build` to build for production

## Configuration

To change the default configuration add a `.env.local` file in the root of this package.

The following environment variables are available:

```.env
# Bundle and use local version of TypeSpec libraries
VITE_USE_LOCAL_LIBRARIES=true
```
