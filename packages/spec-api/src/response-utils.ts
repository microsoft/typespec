import { MockBody } from "./types.js";

/**
 * Serialize the provided content as json to use in a MockResponse body.
 * @content Object to return as json.
 * @returns {MockBody} response body with application/json content type.
 */
export function json(content: unknown, contentType: string = "application/json"): MockBody {
  return {
    contentType,
    rawContent: JSON.stringify(content),
  };
}

/**
 * Sends the provided XML string in a MockResponse body.
 * The XML declaration prefix will automatically be added to xmlString.
 * @content Object to return as XML.
 * @returns {MockBody} response body with application/xml content type.
 */
export function xml(xmlString: string): MockBody {
  return {
    contentType: "application/xml",
    rawContent: `<?xml version='1.0' encoding='UTF-8'?>` + xmlString,
  };
}
