// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    /// <summary>
    /// Represents a C# method consisting of a signature, body, and expression.
    /// </summary>
    public sealed class MethodProvider
    {
        /// <summary>
        /// The kind of method of type <see cref="CSharpMethodKinds"/>.
        /// </summary>
        public CSharpMethodKinds Kind { get; }
        public MethodSignatureBase Signature { get; }
        public MethodBodyStatement? BodyStatements { get; }
        public ValueExpression? BodyExpression { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="MethodProvider"/> class with a body statement and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyStatements">The method body.</param>
        /// <param name="kind">The method kind <see cref="CSharpMethodKinds"/>.</param>
        public MethodProvider(MethodSignatureBase signature, MethodBodyStatement bodyStatements, CSharpMethodKinds? kind = null)
        {
            Signature = signature;
            BodyStatements = bodyStatements;
            Kind = kind ?? new CSharpMethodKinds("Undefined");
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="MethodProvider"/> class with a body expression and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyExpression">The method body expression.</param>
        /// <param name="kind">The method kind <see cref="CSharpMethodKinds"/>.</param>
        public MethodProvider(MethodSignatureBase signature, ValueExpression bodyExpression, CSharpMethodKinds? kind = null)
        {
            Signature = signature;
            BodyExpression = bodyExpression;
            Kind = kind ?? new CSharpMethodKinds("Undefined");
        }
    }
}
