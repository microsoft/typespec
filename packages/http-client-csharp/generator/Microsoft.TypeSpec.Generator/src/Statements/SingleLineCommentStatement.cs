// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.TypeSpec.Generator.Statements
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

        internal override void Write(CodeWriter writer)
        {
            writer.WriteLine($"// {Message}");
        }
    }
}
