// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.ArgumentSnippets;

namespace Microsoft.Generator.CSharp.Providers
{
    /// <summary>
    /// Represents a C# method consisting of a signature, body, and expression.
    /// </summary>
    public class MethodProvider
    {
        public MethodSignature Signature { get; private set; }
        public MethodBodyStatement? BodyStatements { get; private set;}
        public ValueExpression? BodyExpression { get; private set;}
        public XmlDocProvider? XmlDocs { get; private set;}

        public TypeProvider EnclosingType { get; }

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
            var paramHash = MethodProviderHelpers.GetParamhash(signature.Parameters, skipParamValidation);
            BodyStatements = MethodProviderHelpers.GetBodyStatementWithValidation(signature.Parameters, bodyStatements, paramHash);
            XmlDocs = xmlDocProvider ?? (MethodProviderHelpers.IsMethodPublic(enclosingType.DeclarationModifiers, signature.Modifiers)
                ? MethodProviderHelpers.BuildXmlDocs(signature.Parameters, signature.Description, signature.ReturnDescription, paramHash)
                : null);
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
            XmlDocs = xmlDocProvider ?? (MethodProviderHelpers.IsMethodPublic(enclosingType.DeclarationModifiers, signature.Modifiers)
                ? MethodProviderHelpers.BuildXmlDocs(signature.Parameters, signature.Description, signature.ReturnDescription, null)
                : null);
            EnclosingType = enclosingType;
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
                XmlDocs = xmlDocProvider;
            }
        }
    }
}
