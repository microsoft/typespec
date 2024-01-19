declare module "*.png";
declare module "*.json";
declare module "!!raw-loader!@site/static/*" {
  const contents: string;
  export = contents;
}
