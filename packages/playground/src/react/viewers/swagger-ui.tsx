import { Suspense, lazy, type FunctionComponent } from "react";
import "swagger-ui-dist/swagger-ui.css";
import style from "./swagger-ui.module.css";

export interface SwaggerUIProps {
  readonly spec: string;
}

const LazySwaggerUI = lazy(() => import("./react-wrapper.js"));

export const SwaggerUI: FunctionComponent<SwaggerUIProps> = (props) => {
  return (
    <Suspense fallback={<div />}>
      <div className={style["swagger-ui-container"]}>
        <LazySwaggerUI spec={props.spec} />
      </div>
    </Suspense>
  );
};
