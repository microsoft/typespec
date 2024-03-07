// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.IO;

namespace AutoRest.CodeModel
{
    internal static class StringExtensions
    {
        //https://stackoverflow.com/a/41176852/294804
        public static IEnumerable<string> ToLines(this string value, bool removeEmptyLines = false)
        {
            using var sr = new StringReader(value);
            string? line;
            while ((line = sr.ReadLine()) != null)
            {
                if (removeEmptyLines && String.IsNullOrWhiteSpace(line))
                    continue;
                yield return line;
            }
        }
    }
}
