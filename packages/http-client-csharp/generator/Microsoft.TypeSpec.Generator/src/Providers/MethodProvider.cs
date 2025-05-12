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
    public class MethodProvider
    {
        public MethodSignature Signature { get; private set; }
        public MethodBodyStatement? BodyStatements { get; private set;}
        public ValueExpression? BodyExpression { get; private set;}

        public XmlDocProvider? XmlDocs => _xmlDocs ??= BuildXmlDocs();
        private XmlDocProvider? _xmlDocs;

        public virtual TypeProvider EnclosingType { get; }

        // for mocking
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        protected MethodProvider()
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="MethodProvider"/> class with a body statement and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyStatements">The method body.</param>
        /// <param name="enclosingType">The enclosing type.</param>
        /// <param name="xmlDocProvider">The XML documentation provider.</param>
        public MethodProvider(MethodSignature signature, MethodBodyStatement bodyStatements, TypeProvider enclosingType, XmlDocProvider? xmlDocProvider = default)
        {
            Signature = signature;
            bool skipParamValidation = !signature.Modifiers.HasFlag(MethodSignatureModifiers.Public);
            var paramHash = MethodProviderHelpers.GetParamHash(signature.Parameters, skipParamValidation);
            BodyStatements = MethodProviderHelpers.GetBodyStatementWithValidation(signature.Parameters, bodyStatements, paramHash);
            _xmlDocs = xmlDocProvider;
            EnclosingType = enclosingType;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="MethodProvider"/> class with a body expression and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyExpression">The method body expression.</param>
        /// <param name="enclosingType">The enclosing type.</param>
        /// <param name="xmlDocProvider">The XML documentation provider.</param>
        public MethodProvider(MethodSignature signature, ValueExpression bodyExpression, TypeProvider enclosingType, XmlDocProvider? xmlDocProvider = default)
        {
            Signature = signature;
            BodyExpression = bodyExpression;
            _xmlDocs = xmlDocProvider;
            EnclosingType = enclosingType;
        }

        private XmlDocProvider? BuildXmlDocs()
        {
            return MethodProviderHelpers.BuildXmlDocs(
                Signature.Parameters,
                Signature.Description,
                Signature.ReturnDescription,
                BodyStatements != null ?
                    MethodProviderHelpers.GetParamHash(
                        Signature.Parameters,
                        !Signature.Modifiers.HasFlag(MethodSignatureModifiers.Public)) :
                    null);
        }

        public void Update(
            MethodSignature? signature = null,
            MethodBodyStatement? bodyStatements = null,
            ValueExpression? bodyExpression = null,
            XmlDocProvider? xmlDocProvider = null)
        {
            if (signature != null)
            {
                Signature = signature;
                // rebuild the XML docs if the signature changes
                _xmlDocs = BuildXmlDocs();
            }
            if (bodyStatements != null)
            {
                BodyStatements = bodyStatements;
                BodyExpression = null;
            }
            if (bodyExpression != null)
            {
                BodyExpression = bodyExpression;
                BodyStatements = null;
            }
            if (xmlDocProvider != null)
            {
                _xmlDocs = xmlDocProvider;
            }
        }
    }
}
