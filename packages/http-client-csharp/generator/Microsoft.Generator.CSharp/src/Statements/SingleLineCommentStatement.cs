// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Statements
{
    public sealed class SingleLineCommentStatement : MethodBodyStatement
    {
        public FormattableString Message { get; }

        public SingleLineCommentStatement(FormattableString message)
        {
            Message = message;
        }

        public SingleLineCommentStatement(string message) : this(FormattableStringHelpers.FromString(message))
        { }
    }
}
