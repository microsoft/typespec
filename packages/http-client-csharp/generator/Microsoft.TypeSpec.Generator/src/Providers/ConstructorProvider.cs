// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
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
        public XmlDocProvider XmlDocs { get; private set; }

        public TypeProvider EnclosingType { get; }
        public IReadOnlyList<SuppressionStatement> Suppressions { get; internal set; }

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
        /// <param name="suppressions"> The suppressions for the method.</param>
        public ConstructorProvider(
            ConstructorSignature signature,
            MethodBodyStatement bodyStatements,
            TypeProvider enclosingType,
            XmlDocProvider? xmlDocProvider = default,
            IEnumerable<SuppressionStatement>? suppressions = default)
        {
            Signature = signature;
            var paramHash = MethodProviderHelpers.GetParamHash(signature);
            BodyStatements = MethodProviderHelpers.GetBodyStatementWithValidation(signature.Parameters, bodyStatements, paramHash);
            XmlDocs = xmlDocProvider ?? MethodProviderHelpers.BuildXmlDocs(signature);
            EnclosingType = enclosingType;
            Suppressions = (suppressions as IReadOnlyList<SuppressionStatement>) ?? [];
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="ConstructorProvider"/> class with a body expression and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyExpression">The method body expression.</param>
        /// <param name="enclosingType">The enclosing type.</param>
        /// <param name="xmlDocProvider">The XML documentation provider.</param>
        /// <param name="suppressions"> The suppressions for the method.</param>
        public ConstructorProvider(
            ConstructorSignature signature,
            ValueExpression bodyExpression,
            TypeProvider enclosingType,
            XmlDocProvider? xmlDocProvider = default,
            IEnumerable<SuppressionStatement>? suppressions = default)
        {
            Signature = signature;
            BodyExpression = bodyExpression;
            XmlDocs = xmlDocProvider ?? MethodProviderHelpers.BuildXmlDocs(signature);
            EnclosingType = enclosingType;
            Suppressions = (suppressions as IReadOnlyList<SuppressionStatement>) ?? [];
        }

        public void Update(
            MethodBodyStatement? bodyStatements = null,
            ConstructorSignature? signature = null,
            ValueExpression? bodyExpression = null,
            XmlDocProvider? xmlDocs = null,
            IEnumerable<SuppressionStatement>? suppressions = default)
        {
            if (signature != null)
            {
                Signature = signature;
                // rebuild the XML docs if the signature changed
                XmlDocs = MethodProviderHelpers.BuildXmlDocs(signature);
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
                XmlDocs = xmlDocs;
            }
            if (suppressions != null)
            {
                Suppressions = (suppressions as IReadOnlyList<SuppressionStatement>) ?? [.. suppressions];
            }
        }
    }
}
