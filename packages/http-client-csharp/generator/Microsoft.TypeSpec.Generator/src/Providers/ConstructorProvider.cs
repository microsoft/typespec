// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Represents a C# method consisting of a signature, body, and expression.
    /// </summary>
    public class ConstructorProvider
    {
        public ConstructorSignature Signature { get; private set; }
        public MethodBodyStatement? BodyStatements { get; private set; }
        public ValueExpression? BodyExpression { get; private set; }
        public XmlDocProvider? XmlDocs => _xmlDocs ??= BuildXmlDocs();
        private XmlDocProvider? _xmlDocs;

        public TypeProvider EnclosingType { get; }

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
            var paramHash = MethodProviderHelpers.GetParamHash(signature.Parameters, skipParamValidation);
            BodyStatements = MethodProviderHelpers.GetBodyStatementWithValidation(signature.Parameters, bodyStatements, paramHash);
            _xmlDocs = xmlDocProvider ?? MethodProviderHelpers.BuildXmlDocs(signature.Parameters, signature.Description, null, paramHash);
            EnclosingType = enclosingType;
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
            _xmlDocs = xmlDocProvider ?? MethodProviderHelpers.BuildXmlDocs(signature.Parameters, signature.Description, null, null);
            EnclosingType = enclosingType;
        }

        private XmlDocProvider? BuildXmlDocs()
        {
            return MethodProviderHelpers.BuildXmlDocs(
                Signature.Parameters,
                Signature.Description,
                null,
                BodyStatements != null ?
                    MethodProviderHelpers.GetParamHash(
                        Signature.Parameters,
                        !Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)) :
                    null);
        }

        public void Update(
            MethodBodyStatement? bodyStatements = null,
            ConstructorSignature? signature = null,
            ValueExpression? bodyExpression = null,
            XmlDocProvider? xmlDocs = null)
        {
            if (signature != null)
            {
                Signature = signature;
                // rebuild the XML docs if the signature changed
                _xmlDocs = BuildXmlDocs();
            }
            if (bodyExpression != null)
            {
                BodyExpression = bodyExpression;
                BodyStatements = null;
            }
            if (bodyStatements != null)
            {
                BodyStatements = bodyStatements;
                BodyExpression = null;
            }
            if (xmlDocs != null)
            {
                _xmlDocs = xmlDocs;
            }
        }
    }
}
