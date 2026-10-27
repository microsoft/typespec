import { code, refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { useClientLibrary } from "@typespec/http-client";
import { flattenClients } from "../../utils/client-discovery.js";
import { isFormUrlEncodedContentType } from "../../utils/form-urlencoded.js";

export function getEncodeFormUrlEncodedRef() {
  return refkey("encodeFormUrlEncoded", "function", "static-helpers");
}

export function libraryNeedsFormUrlEncoded(library: ReturnType<typeof useClientLibrary>): boolean {
  const operations = library.topLevel
    .flatMap((client) => flattenClients(client))
    .flatMap((client) => client.operations);

  return operations.some((operation) => {
    const body = operation.httpOperation.parameters.body;
    return (
      body?.bodyKind === "single" &&
      body.type.kind === "Model" &&
      isFormUrlEncodedContentType(body.contentTypes[0])
    );
  });
}

export function FormUrlEncodedHelpers() {
  const library = useClientLibrary();
  if (!libraryNeedsFormUrlEncoded(library)) {
    return null;
  }

  return (
    <ts.SourceFile path="form-urlencoded.ts">
      <ts.FunctionDeclaration
        name="encodeFormUrlEncoded"
        export
        refkey={getEncodeFormUrlEncodedRef()}
        returnType="string | null | undefined"
        parameters={[
          {
            name: "input",
            optional: true,
            type: "Record<string, unknown> | null",
          },
        ]}
      >
        {code`
          if (input == null) {
            return input;
          }

          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(input)) {
            if (value === undefined || value === null) {
              continue;
            }
            if (Array.isArray(value)) {
              for (const item of value) {
                if (item === undefined || item === null) {
                  continue;
                }
                params.append(key, typeof item === "object" ? JSON.stringify(item) : String(item));
              }
              continue;
            }
            params.append(key, typeof value === "object" ? JSON.stringify(value) : String(value));
          }
          return params.toString();
        `}
      </ts.FunctionDeclaration>
    </ts.SourceFile>
  );
}
