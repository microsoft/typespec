// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;

namespace AutoRest.CSharp.Utilities
{
    internal static class JsonExtensions
    {
        public static string ToJsonArray(this IEnumerable<string>? values) => values != null ? $"[{String.Join(",", values.Select(v => $@"""{v}"""))}]" : "[]";
        public static string ToJsonArray(this IEnumerable<int>? values) => values != null ? $"[{String.Join(",", values.Select(v => v.ToString()))}]" : "[]";
        public static string ToJsonArray(this IEnumerable<object>? values) => values != null ? $"[{String.Join(",", values.Select(sl => sl.ToString()))}]" : "[]";

        public static string ToJsonBool(this bool value) => value ? "true" : "false";

        public static string TextOrEmpty(this object? value, string text) => value != null ? text : String.Empty;


        public static string? ToStringLiteral(this string? text) =>
            !String.IsNullOrEmpty(text)
                ? text
                    .Replace("\\", "\\\\") // backslashes
                    .Replace("\"", "\\\"") // quotes
                    .Replace("\0", "\\0") // nulls
                    .Replace("\a", "\\a") // alert
                    .Replace("\b", "\\b") // backspace
                    .Replace("\f", "\\f") // form feed
                    .Replace("\n", "\\n") // newline
                    .Replace("\r", "\\r") // return
                    .Replace("\t", "\\t") // tab
                    .Replace("\v", "\\v") // vertical tab
                : text;

        public static string ToJsonStringOrNull(this string? text) => !text.IsNullOrEmpty() ? $@"""{text}""" : "null";
    }
}
