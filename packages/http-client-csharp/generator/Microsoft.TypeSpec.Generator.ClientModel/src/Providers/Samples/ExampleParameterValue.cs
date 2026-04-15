// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers.Samples
{
    /// <summary>
    /// Represents a parameter value in a sample. Supports two modes:
    /// - <see cref="Value"/>: raw example data that will be converted to a C# expression later
    /// - <see cref="Expression"/>: a pre-built C# expression (used for known parameters like credentials, endpoints)
    /// </summary>
    public class ExampleParameterValue
    {
        public ExampleParameterValue(string name, CSharpType type, InputExampleValue value)
        {
            Name = name;
            Type = type;
            Value = value;
        }

        public ExampleParameterValue(string name, CSharpType type, ValueExpression expression)
        {
            Name = name;
            Type = type;
            Expression = expression;
        }

        /// <summary>
        /// The parameter name.
        /// </summary>
        public string Name { get; }

        /// <summary>
        /// The C# type of the parameter.
        /// </summary>
        public CSharpType Type { get; }

        /// <summary>
        /// Raw example data from the spec or mock builder. Will be converted to a
        /// <see cref="ValueExpression"/> via <see cref="ExampleValueExpressionBuilder"/>.
        /// Mutually exclusive with <see cref="Expression"/>.
        /// </summary>
        public InputExampleValue? Value { get; }

        /// <summary>
        /// A pre-built C# expression. Used for known parameters (credentials, endpoints)
        /// where the expression is fixed regardless of example data.
        /// Mutually exclusive with <see cref="Value"/>.
        /// </summary>
        public ValueExpression? Expression { get; }
    }
}
