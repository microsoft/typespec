import { MANIFEST } from "@cadl-lang/compiler";
import { FunctionComponent } from "react";

export const Footer: FunctionComponent = () => {
  return (
    <div className="footer">
      <div className="item">
        <span>Cadl Version </span>
        <span>{MANIFEST.version}</span>
      </div>
      <div className="item">
        <span>Commit </span>
        <span>{MANIFEST.commit.slice(0, 6)}</span>
      </div>
    </div>
  );
};
