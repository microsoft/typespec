﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp.Tests
{
    internal record MockExpression : ValueExpression
    {
        public override void Write(CodeWriter writer)
        {
            writer.AppendRaw("Custom implementation");
        }
    }
}
