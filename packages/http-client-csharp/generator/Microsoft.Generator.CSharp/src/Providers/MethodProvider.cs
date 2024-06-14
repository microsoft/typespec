// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    /// <summary>
    /// Represents a C# method consisting of a signature, body, and expression.
    /// </summary>
    public sealed class MethodProvider
    {
        public MethodSignatureBase Signature { get; }
        public MethodBodyStatement? BodyStatements { get; }
        public ValueExpression? BodyExpression { get; }
        public XmlDocProvider XmlDocs { get; }

        /// <summary>
        /// Initializes a new instance of the <see cref="MethodProvider"/> class with a body statement and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyStatements">The method body.</param>
        public MethodProvider(MethodSignatureBase signature, MethodBodyStatement bodyStatements)
        {
            Signature = signature;
            bool skipParamValidation = !signature.Modifiers.HasFlag(MethodSignatureModifiers.Public);
            List<MethodBodyStatement> statements = skipParamValidation ? new List<MethodBodyStatement>() : [.. GetValidationStatements()];
            statements.Add(bodyStatements);
            BodyStatements = statements;
            XmlDocs = BuildXmlDocs(skipParamValidation);
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="MethodProvider"/> class with a body expression and method signature.
        /// </summary>
        /// <param name="signature">The method signature.</param>
        /// <param name="bodyExpression">The method body expression.</param>
        public MethodProvider(MethodSignatureBase signature, ValueExpression bodyExpression)
        {
            Signature = signature;
            BodyExpression = bodyExpression;
            XmlDocs = BuildXmlDocs(true);
        }


        private IEnumerable<MethodBodyStatement> GetValidationStatements()
        {
            bool wroteValidation = false;
            foreach (var parameter in Signature.Parameters)
            {
                if (parameter.Validation != ParameterValidationType.None)
                {
                    yield return Argument.ValidateParameter(parameter);
                    wroteValidation = true;
                }
            }
            if (wroteValidation)
                yield return EmptyLineStatement;
        }

        private XmlDocProvider BuildXmlDocs(bool skipExceptions)
        {
            var docs = new XmlDocProvider();
            if (Signature.SummaryText is not null)
                docs.Summary = new XmlDocSummaryStatement([Signature.SummaryText]);
            Dictionary<ParameterValidationType, List<ParameterProvider>> paramHash = [];
            foreach (var parameter in Signature.Parameters)
            {
                docs.Params.Add(new XmlDocParamStatement(parameter.Name, parameter.Description));
                if (!skipExceptions && parameter.Validation != ParameterValidationType.None)
                {
                    if (!paramHash.ContainsKey(parameter.Validation))
                        paramHash[parameter.Validation] = new List<ParameterProvider>();
                    paramHash[parameter.Validation].Add(parameter);
                }
            }
            foreach (var kvp in paramHash)
            {
                docs.Exceptions.Add(new XmlDocExceptionStatement(kvp.Key, kvp.Value));
            }
            return docs;
        }
    }
}
