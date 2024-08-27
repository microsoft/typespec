import { Children, SourceFile } from "@alloy-js/core";
import { usePackage } from "./python-package.jsx";

export interface InitFileProps {
  children?: Children;
}

export function InitFile(prop: InitFileProps) {
  const packageContext = usePackage();
  const symbolNames = packageContext?.scope.getSymbolNames();
  
  return (
    <SourceFile path="__init__.py" filetype="python">
      {prop.children}
    </SourceFile>
  );
}
