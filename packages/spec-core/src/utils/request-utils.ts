import { Request } from "express";

export const getRequestBaseUrl = (request: Request): string => `${request.protocol}://${request.get("host")}`;
