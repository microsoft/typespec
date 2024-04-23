// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Represents a method consisting of a signature, body, and expression.
    /// </summary>
    public sealed record Method
    {
        // The method kind.
        public string Kind { get; }
        public MethodSignatureBase Signature { get; }
        public MethodBodyStatement? Body { get; }
        public ValueExpression? BodyExpression { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="Method"/> class with a body statement and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="body">The method body.</param>
        /// <param name="kind">The method kind.</param>
        public Method(MethodSignatureBase signature, MethodBodyStatement body, string kind)
        {
            Signature = signature;
            Body = body;
            Kind = kind;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="Method"/> class with a body expression and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyExpression">The method body expression.</param>
        /// <param name="kind">The method kind.</param>
        public Method(MethodSignatureBase signature, ValueExpression bodyExpression, string kind)
        {
            Signature = signature;
            BodyExpression = bodyExpression;
            Kind = kind;
        }
    }
}
