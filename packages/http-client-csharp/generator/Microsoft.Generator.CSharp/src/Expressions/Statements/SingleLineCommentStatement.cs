// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record SingleLineCommentStatement(FormattableString Message) : MethodBodyStatement
    {
        public SingleLineCommentStatement(string message) : this(FormattableStringHelpers.FromString(message))
        { }
    }
}
