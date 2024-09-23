# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from enum import Enum

basic_latin_chars = {
    " ": "Space",
    "!": "ExclamationMark",
    '"': "QuotationMark",
    "#": "NumberSign",
    "$": "DollarSign",
    "%": "PercentSign",
    "&": "Ampersand",
    "'": "Apostrophe",
    "(": "LeftParenthesis",
    ")": "RightParenthesis",
    "*": "Asterisk",
    "+": "PlusSign",
    ",": "Comma",
    "-": "HyphenMinus",
    ".": "FullStop",
    "/": "Slash",
    "0": "Zero",
    "1": "One",
    "2": "Two",
    "3": "Three",
    "4": "Four",
    "5": "Five",
    "6": "Six",
    "7": "Seven",
    "8": "Eight",
    "9": "Nine",
    ":": "Colon",
    ";": "Semicolon",
    "<": "LessThanSign",
    "=": "EqualSign",
    ">": "GreaterThanSign",
    "?": "QuestionMark",
    "@": "AtSign",
    "[": "LeftSquareBracket",
    "\\": "Backslash",
    "]": "RightSquareBracket",
    "^": "CircumflexAccent",
    "`": "GraveAccent",
    "{": "LeftCurlyBracket",
    "|": "VerticalBar",
    "}": "RightCurlyBracket",
    "~": "Tilde",
}


class PadType(str, Enum):
    MODEL = "Model"
    ENUM_CLASS = "Enum"
    METHOD = "_method"
    PARAMETER = "_parameter"
    ENUM_VALUE = "_enum"
    PROPERTY = "_property"
    OPERATION_GROUP = "Operations"


_always_reserved = [
    "and",
    "as",
    "assert",
    "break",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "exec",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "try",
    "while",
    "with",
    "yield",
    "async",
    "await",
    "int",
]

RESERVED_MODEL_PROPERTIES = [
    "keys",
    "items",
    "values",
    "popitem",
    "clear",
    "update",
    "setdefault",
    "pop",
    "get",
]

RESERVED_WORDS = {
    PadType.METHOD: [*_always_reserved],
    PadType.PARAMETER: [
        "self",
        # these are kwargs we've reserved for our generated operations
        "content_type",
        "accept",
        "cls",
        "polling",
        "continuation_token",  # for LRO calls
        # these are transport kwargs
        # https://github.com/Azure/azure-sdk-for-python/blob/master/sdk/core/azure-core/CLIENT_LIBRARY_DEVELOPER.md#transport
        "connection_timeout",
        "connection_verify",
        "connection_cert",
        "connection_data_block_size",
        "use_env_settings",
        # the following aren't in the readme, but @xiangyan99 said these are also transport kwargs
        "read_timeout",
        "proxies",
        "cookies",
        # these are policy kwargs
        # https://github.com/Azure/azure-sdk-for-python/blob/master/sdk/core/azure-core/CLIENT_LIBRARY_DEVELOPER.md#available-policies
        "base_headers",
        "headers",
        "request_id",
        "auto_request_id",
        "base_user_agent",
        "user_agent",
        "user_agent_overwrite",
        "user_agent_use_env",
        "user_agent",
        "sdk_moniker",
        "logging_enable",
        "logger",
        "response_encoding",
        "proxies",
        "raw_request_hook",
        "raw_response_hook",
        "network_span_namer",
        "tracing_attributes",
        "permit_redirects",
        "redirect_max",
        "redirect_remove_headers",
        "redirect_on_status_codes",
        "permit_redirects",
        "redirect_max",
        "redirect_remove_headers",
        "redirect_on_status_codes",
        "retry_total",
        "retry_connect",
        "retry_read",
        "retry_status",
        "retry_backoff_factor",
        "retry_backoff_max",
        "retry_mode",
        "retry_on_status_codes",
        "retry_total",
        "retry_connect",
        "retry_read",
        "retry_status",
        "retry_backoff_factor",
        "retry_backoff_max",
        "retry_mode",
        "retry_on_status_codes",
        *_always_reserved,
    ],
    PadType.MODEL: ["enum", *_always_reserved],
    PadType.PROPERTY: ["self", *_always_reserved],
    PadType.ENUM_CLASS: ["enum", *_always_reserved],
    PadType.ENUM_VALUE: ["mro", *_always_reserved],
    PadType.OPERATION_GROUP: [*_always_reserved],
}

CADL_RESERVED_WORDS = {
    PadType.PARAMETER: ["stream"],
    PadType.PROPERTY: RESERVED_MODEL_PROPERTIES,
}

REDEFINED_BUILTINS = [  # we don't pad, but we need to do lint ignores
    "id",
    "min",
    "max",
    "filter",
    "property",
]

BUILTIN_PACKAGES = [
    "array",
    "atexit",
    "binascii",
    "builtins",
    "cmath",
    "errno",
    "faulthandler",
    "fcntl",
    "gc",
    "grp",
    "itertools",
    "marshal",
    "math",
    "posix",
    "pwd",
    "pyexpat",
    "select",
    "spwd",
    "sys",
    "syslog",
    "time",
    "unicodedata",
    "xxsubtype",
    "zlib",
]
