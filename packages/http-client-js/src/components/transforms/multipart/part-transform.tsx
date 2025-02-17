import * as ay from "@alloy-js/core";
import { HttpOperationPart } from "@typespec/http";
import { ArrayPartTransform } from "./array-part-transform.jsx";
import { FilePartTransform } from "./file-part-transform.jsx";
import { SimplePartTransform } from "./simple-part-transform.jsx";

export interface HttpPartTransformProps {
  part: HttpOperationPart;
  itemRef: ay.Children;
}

export function HttpPartTransform(props: HttpPartTransformProps) {
  if (props.part.multi) {
    return <ArrayPartTransform part={props.part} itemRef={props.itemRef}/>;
  }

  if (props.part.filename) {
    return <FilePartTransform part={props.part} itemRef={props.itemRef} />;
  }

  return <SimplePartTransform part={props.part} itemRef={props.itemRef} />;
}
