// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp.Expressions
{
    public sealed record FormattableStringToExpression(FormattableString Value) : ValueExpression
    {
        internal override void Write(CodeWriter writer)
        {
            writer.Append(Value);
        }
    }
}
