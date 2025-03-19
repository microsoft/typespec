// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

export interface HeaderValueParameters {
  value: string;
  verbatim: string;
  params: { [k: string]: string };
}

/**
 * Parses a header value that may contain additional parameters (e.g. `text/html; charset=utf-8`).
 * @param headerValueText - the text of the header value to parse
 * @returns an object containing the value and a map of parameters
 */
export function parseHeaderValueParameters<Header extends string | undefined>(
  headerValueText: Header,
): undefined extends Header ? HeaderValueParameters | undefined : HeaderValueParameters {
  if (headerValueText === undefined) {
    return undefined as any;
  }

  const idx = headerValueText.indexOf(";");
  const [value, _paramsText] =
    idx === -1
      ? [headerValueText, ""]
      : [headerValueText.slice(0, idx), headerValueText.slice(idx + 1)];

  let paramsText = _paramsText;

  // Parameters are a sequence of key=value pairs separated by semicolons, but the value may be quoted in which case it
  // may contain semicolons. We use a regular expression to iteratively split the parameters into key=value pairs.
  const params: { [k: string]: string } = {};

  let match;

  // TODO: may need to support ext-parameter (e.g. "filename*=UTF-8''%e2%82%ac%20rates" => { filename: "€ rates" }).
  // By default we decoded everything as UTF-8, and non-UTF-8 agents are a dying breed, but we may need to support
  // this for completeness. If we do support it, we'll prefer an ext-parameter over a regular parameter. Currently, we'll
  // just treat them as separate keys and put the raw value in the parameter.
  //
  // https://datatracker.ietf.org/doc/html/rfc5987#section-3.2.1
  while ((match = paramsText.match(/\s*([^=]+)=(?:"([^"]+)"|([^;]+));?/))) {
    const [, key, quotedValue, unquotedValue] = match;

    params[key.trim()] = quotedValue ?? unquotedValue;

    paramsText = paramsText.slice(match[0].length);
  }

  return {
    value: value.trim(),
    verbatim: headerValueText,
    params,
  };
}
