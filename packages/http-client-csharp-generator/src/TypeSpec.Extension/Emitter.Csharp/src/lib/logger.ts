// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import * as winston from "winston";

export enum LoggerLevel {
    ERROR = "error",
    WARN = "warn",
    INFO = "info",
    DEBUG = "debug",
    VERBOSE = "verbose"
}

export var logger: winston.Logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: LoggerLevel.INFO
        })
    ]
});
