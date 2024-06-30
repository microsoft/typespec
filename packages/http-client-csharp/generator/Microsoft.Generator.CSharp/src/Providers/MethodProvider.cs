// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.ArgumentSnippet;

namespace Microsoft.Generator.CSharp.Providers
{
    /// <summary>
    /// Represents a C# method consisting of a signature, body, and expression.
    /// </summary>
    public class MethodProvider
    {
        public MethodSignatureBase Signature { get; }
        public MethodBodyStatement? BodyStatements { get; }
        public ValueExpression? BodyExpression { get; }
        public XmlDocProvider? XmlDocs { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="MethodProvider"/> class with a body statement and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyStatements">The method body.</param>
        /// <param name="enclosingType">The enclosing type.</param>
        /// <param name="xmlDocProvider">The XML documentation provider.</param>
        public MethodProvider(MethodSignatureBase signature, MethodBodyStatement bodyStatements, TypeProvider enclosingType, XmlDocProvider? xmlDocProvider = default)
        {
            Signature = signature;
            bool skipParamValidation = !signature.Modifiers.HasFlag(MethodSignatureModifiers.Public);
            var paramHash = GetParamhash(skipParamValidation);
            BodyStatements = GetBodyStatementWithValidation(bodyStatements, paramHash);
            XmlDocs = xmlDocProvider ?? (IsMethodPublic(enclosingType.DeclarationModifiers, signature.Modifiers) ? BuildXmlDocs(paramHash) : null);
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="MethodProvider"/> class with a body expression and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyExpression">The method body expression.</param>
        /// <param name="enclosingType">The enclosing type.</param>
        /// <param name="xmlDocProvider">The XML documentation provider.</param>
        public MethodProvider(MethodSignatureBase signature, ValueExpression bodyExpression, TypeProvider enclosingType, XmlDocProvider? xmlDocProvider = default)
        {
            Signature = signature;
            BodyExpression = bodyExpression;
            XmlDocs = xmlDocProvider ?? (IsMethodPublic(enclosingType.DeclarationModifiers, signature.Modifiers) ? BuildXmlDocs(null) : null);
        }

        private static bool IsMethodPublic(TypeSignatureModifiers typeModifiers, MethodSignatureModifiers methodModifiers)
        {
            if (!typeModifiers.HasFlag(TypeSignatureModifiers.Public))
                return false;

            if (methodModifiers.HasFlag(MethodSignatureModifiers.Public) || (methodModifiers.HasFlag(MethodSignatureModifiers.Protected) && !methodModifiers.HasFlag(MethodSignatureModifiers.Private)))
                return true;

            return false;
        }

        private Dictionary<ParameterValidationType, List<ParameterProvider>>? GetParamhash(bool skipParamValidation)
        {
            Dictionary<ParameterValidationType, List<ParameterProvider>>? paramHash = null;
            if (!skipParamValidation)
            {
                paramHash = new();
                foreach (var parameter in Signature.Parameters)
                {
                    if (parameter.Validation == ParameterValidationType.None)
                        continue;

                    if (!paramHash.ContainsKey(parameter.Validation))
                        paramHash[parameter.Validation] = new List<ParameterProvider>();
                    paramHash[parameter.Validation].Add(parameter);
                }
            }
            return paramHash;
        }

        private MethodBodyStatement GetBodyStatementWithValidation(MethodBodyStatement bodyStatements, Dictionary<ParameterValidationType, List<ParameterProvider>>? paramHash)
        {
            if (paramHash is null)
                return bodyStatements;

            int count = 0;
            foreach (var kvp in paramHash)
            {
                if (kvp.Key == ParameterValidationType.None)
                    continue;
                count += kvp.Value.Count;
            }

            if (count == 0)
                return bodyStatements;

            MethodBodyStatement[] statements = new MethodBodyStatement[count + 2];
            int index = 0;
            foreach (var parameter in Signature.Parameters)
            {
                if (parameter.Validation != ParameterValidationType.None)
                {
                    statements[index] = ValidateParameter(parameter);
                    index++;
                }
            }
            statements[index] = MethodBodyStatement.EmptyLine;
            index++;

            statements[index] = bodyStatements;

            return statements;
        }

        private XmlDocProvider? BuildXmlDocs(Dictionary<ParameterValidationType, List<ParameterProvider>>? paramHash)
        {
            var docs = new XmlDocProvider();
            if (Signature.Description is not null)
                docs.Summary = new XmlDocSummaryStatement([Signature.Description]);

            foreach (var parameter in Signature.Parameters)
            {
                docs.Params.Add(new XmlDocParamStatement(parameter.Name, parameter.Description));
            }

            if (paramHash is not null)
            {
                foreach (var kvp in paramHash)
                {
                    docs.Exceptions.Add(new XmlDocExceptionStatement(kvp.Key, kvp.Value));
                }
            }

            if (Signature is MethodSignature methodSignature && methodSignature.ReturnDescription is not null)
                docs.Returns = new XmlDocReturnsStatement(methodSignature.ReturnDescription);

            return docs;
        }
    }
}
