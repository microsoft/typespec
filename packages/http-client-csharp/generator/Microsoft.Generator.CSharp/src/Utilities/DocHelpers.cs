// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Utilities
{
    public class DocHelpers
    {
        public static string? GetDescription(string? summary, string? doc)
        {
            return (summary, doc) switch
            {
                (null or "", null or "") => null,
                (string s, null or "") => s,
                _ => doc,
            };
        }

        public static FormattableString? GetFormattableDescription(string? summary, string? doc)
        {
            return FormattableStringHelpers.FromString(GetDescription(summary, doc));
        }
    }
}
