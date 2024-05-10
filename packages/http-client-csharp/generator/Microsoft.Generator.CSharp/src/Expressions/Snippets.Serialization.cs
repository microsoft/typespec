// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.Expressions
{
    public static partial class Snippets
    {
        internal static class Serialization
        {
            public static StringExpression WireFormat = Literal("W");
            public static StringExpression JsonFormat = Literal("J");
            public static StringExpression XmlFormat = Literal("X");
        }
    }
}
