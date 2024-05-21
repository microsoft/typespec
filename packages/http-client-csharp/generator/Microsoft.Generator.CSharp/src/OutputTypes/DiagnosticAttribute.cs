// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp
{
    public class DiagnosticAttribute
    {
        public DiagnosticAttribute(string name, ValueExpression value)
        {
            Name = name;
            Value = value;
        }

        public string Name { get; }
        public ValueExpression Value { get; }
    }
}
