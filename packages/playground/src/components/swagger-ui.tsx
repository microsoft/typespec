import { FunctionComponent, useEffect, useRef, useState } from "react";
export interface SwaggerUIProps {
  spec: string;
}

export const SwaggerUI: FunctionComponent<SwaggerUIProps> = (props) => {
  // const uiRef = useRef(null);
  // const uiInstance = useRef<any>(null);
  // const [swaggerUI, setSwaggerUILib] = useState<
  //   { createSwaggerUI: typeof import("swagger-ui") } | undefined
  // >(undefined);
  // useEffect(() => {
  //   void import("swager-ui" as any).then((lib) => {
  //     setSwaggerUILib({ createSwaggerUI: lib.default });
  //   });
  // }, [setSwaggerUILib]);

  // useEffect(() => {
  //   if (swaggerUI === undefined) {
  //     return;
  //   }
  //   if (uiInstance.current === null) {
  //     uiInstance.current = swaggerUI.createSwaggerUI({
  //       domNode: uiRef.current,
  //       spec: {},
  //     });
  //   }
  //   uiInstance.current.specActions.updateSpec(props.spec);
  // }, [uiRef.current, swaggerUI, props.spec]);

  // return (
  //   <div
  //     css={{
  //       width: "100%",
  //       height: "100%",
  //       overflow: "auto",
  //     }}
  //     ref={uiRef}
  //   ></div>
  // );

  const uiRef = useRef(null);
  const uiInstance = useRef<any>(null);
  const [swaggerUI, setSwaggerUILib] = useState<
    { swaggerUIComp: typeof import("swagger-ui-react").default } | undefined
  >(undefined);
  useEffect(() => {
    void import("swagger-ui-react").then((lib) => {
      setSwaggerUILib({ swaggerUIComp: lib.default });
    });
  }, [setSwaggerUILib]);

  // useEffect(() => {
  //   if (swaggerUI === undefined) {
  //     return;
  //   }
  //   if (uiInstance.current === null) {
  //     uiInstance.current = swaggerUI.createSwaggerUI({
  //       domNode: uiRef.current,
  //       spec: {},
  //     });
  //   }
  //   uiInstance.current.specActions.updateSpec(props.spec);
  // }, [uiRef.current, swaggerUI, props.spec]);

  // return (
  //   <div
  //     css={{
  //       width: "100%",
  //       height: "100%",
  //       overflow: "auto",
  //     }}
  //     ref={uiRef}
  //   ></div>
  // );

  if (swaggerUI === undefined) {
    return null;
  }
  return <swaggerUI.swaggerUIComp spec={props.spec} />;
  // return <SwaggerUILib spec={props.spec} />;
};
