import { FunctionComponent, Suspense, lazy } from "react";
import style from "./swagger-ui.module.css";

export interface SwaggerUIProps {
  readonly spec: string;
}

const LazySwaggerUI = lazy(() => import("swagger-ui-react") as any);

export const SwaggerUI: FunctionComponent<SwaggerUIProps> = (props) => {
  return (
    <Suspense fallback={<div />}>
      <div className={style["swagger-ui-container"]}>
        <LazySwaggerUI spec={props.spec} />
      </div>
    </Suspense>
  );
};
