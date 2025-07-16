import { Children, code } from "@alloy-js/core";

export interface ClientTestOptions {}

export function ClientTestOptions(_props: ClientTestOptions) {
  if (process.env.TYPESPEC_JS_EMITTER_TESTING !== "true") {
    return null;
  }

  return code`
    allowInsecureConnection: true,
    retryOptions: {
      maxRetries: 1,
    }`;
}

export function addClientTestOptions(
  options: Children[],
  settings: { location?: "front" | "back" } = { location: "front" },
) {
  if (process.env.TYPESPEC_JS_EMITTER_TESTING === "true") {
    const testOptions = <ClientTestOptions />;
    if (settings.location === "front") {
      options.unshift(testOptions);
    } else {
      options.push(testOptions);
    }
  }
}
