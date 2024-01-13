export default ["packages/*/vite.config.[m]ts"];

export const defaultTypeSpecVitestConfig = {
  test: {
    ...defaultTypeSpecVitestConfig
    watchExclude: [],
  },
};
