// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.ArgumentSnippets;

namespace Microsoft.TypeSpec.Generator
{
    internal static class MethodProviderHelpers
    {
        public static Dictionary<ParameterValidationType, List<ParameterProvider>>? GetParamHash(MethodSignatureBase signature)
        {
            Dictionary<ParameterValidationType, List<ParameterProvider>>? paramHash = null;
            if (!ShouldSkipParameterValidation(signature))
            {
                paramHash = new();
                foreach (var parameter in signature.Parameters)
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

        public static MethodBodyStatement GetBodyStatementWithValidation(IEnumerable<ParameterProvider> parameters, MethodBodyStatement bodyStatements, Dictionary<ParameterValidationType, List<ParameterProvider>>? paramHash)
        {
            if (paramHash is null || bodyStatements == MethodBodyStatement.Empty)
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
            foreach (var parameter in parameters)
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

        public static XmlDocProvider BuildXmlDocs(MethodSignatureBase signature)
        {
            var parametersList = new List<XmlDocParamStatement>();
            foreach (var parameter in signature.Parameters)
            {
                parametersList.Add(new XmlDocParamStatement(parameter));
            }

            var exceptionHash = new Dictionary<Type, List<ParameterProvider>>();
            if (!ShouldSkipParameterValidation(signature))
            {
                foreach (var parameter in signature.Parameters)
                {
                    if (parameter.Validation == ParameterValidationType.AssertNotNull)
                    {
                        AddArgumentNullException(parameter);
                    }
                    else if (parameter.Validation == ParameterValidationType.AssertNotNullOrEmpty)
                    {
                        AddArgumentNullException(parameter);
                        AddArgumentException(parameter);
                    }
                }
            }

            var exceptions = new List<XmlDocExceptionStatement>();
            foreach (var kvp in exceptionHash)
            {
                exceptions.Add(new XmlDocExceptionStatement(kvp.Key, kvp.Value));
            }

            var returnDescription = (signature as MethodSignature)?.ReturnDescription;

            var docs = new XmlDocProvider(
                signature.Description is null ? null : new XmlDocSummaryStatement([signature.Description]),
                parametersList,
                exceptions,
                returnDescription is null ? null : new XmlDocReturnsStatement(returnDescription));

            return docs;

            void AddArgumentNullException(ParameterProvider parameter)
            {
                if (!exceptionHash.ContainsKey(typeof(ArgumentNullException)))
                {
                    exceptionHash[typeof(ArgumentNullException)] = [];
                }

                exceptionHash[typeof(ArgumentNullException)].Add(parameter);
            }
            void AddArgumentException(ParameterProvider parameter)
            {
                if (!exceptionHash.ContainsKey(typeof(ArgumentException)))
                {
                    exceptionHash[typeof(ArgumentException)] = [];
                }

                exceptionHash[typeof(ArgumentException)].Add(parameter);
            }
        }

        private static bool ShouldSkipParameterValidation(MethodSignatureBase signature)
        {
            // Skip parameter validation for private methods, as they are not exposed to the public API.
            return !signature.Modifiers.HasFlag(MethodSignatureModifiers.Public);
        }
    }
}
