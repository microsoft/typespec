declare module "*.png";
declare module "!!raw-loader!@site/static/*" {
  const contents: string;
  export = contents;
}
