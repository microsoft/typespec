export interface MimeType {
  type: string;
  subtype: string;
  suffix?: string;
}

const regex =
  /^(application|audio|font|example|image|message|model|multipart|text|video|x-(?:[0-9A-Za-z!#$%&'*+.^_`|~-]+))\/([0-9A-Za-z!#$%&'*+.^_`|~-]+)$/;

export function parseMimeType(mimeType: string): MimeType | undefined {
  const match = mimeType.match(regex);

  if (match == null) {
    return undefined;
  }
  const type: MimeType = {
    type: match[1],
    ...parseSubType(match[2]),
  };

  return type;
}

function parseSubType(value: string): Pick<MimeType, "subtype" | "suffix"> {
  if (!value.includes("+")) return { subtype: value };

  const [subtype, suffix] = value.split("+", 2);
  return { subtype, suffix };
}
