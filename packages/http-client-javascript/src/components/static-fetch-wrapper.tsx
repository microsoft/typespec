import { code, refkey } from "@alloy-js/core"
import * as ts from "@alloy-js/typescript"

export const HttpRequestOptionsRefkey = refkey();
export function HttpRequestOptions() {
  return <ts.InterfaceDeclaration export name="HttpRequestOptions" refkey={HttpRequestOptionsRefkey}>
    <ts.InterfaceMember name="method" type="string" />
    <ts.InterfaceMember optional name="headers" type="Record<string, string>" />
    <ts.InterfaceMember optional name="body" type="string" />
  </ts.InterfaceDeclaration>
}

export const HttpFetchRefkey = refkey();
export function HttpFetch() {
  return (
    <ts.FunctionDeclaration export async name="httpFetch"  refkey={HttpFetchRefkey}>
      <ts.FunctionDeclaration.Parameters>url: string, options: <ts.Reference refkey={HttpRequestOptionsRefkey} />
      </ts.FunctionDeclaration.Parameters>
      {code`
        try {
          const response = await fetch(url, options);

          if (!response.ok) {
            throw new Error(\`HTTP error! Status: \${response.status}\`);
          }

          return await response.json();
        } catch (error) {
          console.error('Fetch error:', error);
          throw error;
        }
      `}
    </ts.FunctionDeclaration>
  )
}
