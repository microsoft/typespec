const json = "json";
const xml = "xml";
const application = "application";
const text = "text";

export function parseMediaType(mediaType: string) {
  if (mediaType) {
    const parsed =
      /(application|audio|font|example|image|message|model|multipart|text|video|x-(?:[0-9A-Za-z!#$%&'*+.^_`|~-]+))\/([0-9A-Za-z!#$%&'*.^_`|~-]+)\s*(?:\+([0-9A-Za-z!#$%&'*.^_`|~-]+))?\s*(?:;.\s*(\S*))?/g.exec(
        mediaType,
      );
    if (parsed) {
      return {
        type: parsed[1],
        subtype: parsed[2],
        suffix: parsed[3],
        parameter: parsed[4],
      };
    }
  }
  return undefined;
}

export function isMediaTypeTextPlain(mediaType: string): boolean {
  const mt = parseMediaType(mediaType);

  return mt ? mt.type === text && mt.subtype === "plain" : false;
}

export function isMediaTypeOctetStream(mediaType: string): boolean {
  const mt = parseMediaType(mediaType);

  return mt ? mt.type === application && mt.subtype === "octet-stream" : false;
}

export function isMediaTypeJson(mediaType: string): boolean {
  const mt = parseMediaType(mediaType);
  return mt
    ? (mt.subtype === json || mt.subtype === "jsonl" || mt.suffix === json) &&
        (mt.type === application || mt.type === text)
    : false;
}

export function isMediaTypeXml(mediaType: string): boolean {
  const mt = parseMediaType(mediaType);
  return mt
    ? (mt.subtype === xml || mt.suffix === xml) && (mt.type === application || mt.type === text)
    : false;
}
