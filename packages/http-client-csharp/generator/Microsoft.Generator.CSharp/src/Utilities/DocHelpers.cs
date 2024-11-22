// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.Generator.CSharp.Utilities
{
    internal class DocHelpers
    {
        public static string GetDescription(string? summary, string? doc, string defaultDescription = "")
        {
            return (summary, doc) switch
            {
                (null or "", null or "") => defaultDescription,
                (string s, null or "") => s,
                _ => doc,
            };
        }
    }
}
