// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;

namespace Microsoft.Generator.CSharp.Providers
{
    /// <summary>
    /// Represents a C# method consisting of a signature, body, and expression.
    /// </summary>
    public class ConstructorProvider
    {
        public ConstructorSignature Signature { get; }
        public MethodBodyStatement? BodyStatements { get; }
        public ValueExpression? BodyExpression { get; }
        public XmlDocProvider? XmlDocs { get; }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected ConstructorProvider()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="ConstructorProvider"/> class with a body statement and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyStatements">The method body.</param>
        /// <param name="enclosingType">The enclosing type.</param>
        /// <param name="xmlDocProvider">The XML documentation provider.</param>
        public ConstructorProvider(ConstructorSignature signature, MethodBodyStatement bodyStatements, TypeProvider enclosingType, XmlDocProvider? xmlDocProvider = default)
        {
            Signature = signature;
            bool skipParamValidation = !signature.Modifiers.HasFlag(MethodSignatureModifiers.Public);
            var paramHash = MethodProviderHelpers.GetParamhash(signature.Parameters, skipParamValidation);
            BodyStatements = MethodProviderHelpers.GetBodyStatementWithValidation(signature.Parameters, bodyStatements, paramHash);
            XmlDocs = xmlDocProvider ?? (MethodProviderHelpers.IsMethodPublic(enclosingType.DeclarationModifiers, signature.Modifiers)
                ? MethodProviderHelpers.BuildXmlDocs(signature.Parameters, signature.Description, null, paramHash)
                : null);
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="ConstructorProvider"/> class with a body expression and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyExpression">The method body expression.</param>
        /// <param name="enclosingType">The enclosing type.</param>
        /// <param name="xmlDocProvider">The XML documentation provider.</param>
        public ConstructorProvider(ConstructorSignature signature, ValueExpression bodyExpression, TypeProvider enclosingType, XmlDocProvider? xmlDocProvider = default)
        {
            Signature = signature;
            BodyExpression = bodyExpression;
            XmlDocs = xmlDocProvider ?? (MethodProviderHelpers.IsMethodPublic(enclosingType.DeclarationModifiers, signature.Modifiers)
                ? MethodProviderHelpers.BuildXmlDocs(signature.Parameters, signature.Description, null, null)
                : null);
        }
    }
}
