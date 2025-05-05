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
        public static Dictionary<ParameterValidationType, List<ParameterProvider>>? GetParamhash(IEnumerable<ParameterProvider> parameters, bool skipParamValidation)
        {
            Dictionary<ParameterValidationType, List<ParameterProvider>>? paramHash = null;
            if (!skipParamValidation)
            {
                paramHash = new();
                foreach (var parameter in parameters)
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

        public static XmlDocProvider? BuildXmlDocs(IEnumerable<ParameterProvider> parameters, FormattableString? description, FormattableString? returnDescription, Dictionary<ParameterValidationType, List<ParameterProvider>>? paramHash)
        {
            var parametersList = new List<XmlDocParamStatement>();
            foreach (var parameter in parameters)
            {
                parametersList.Add(new XmlDocParamStatement(parameter));
            }

            var exceptions = new List<XmlDocExceptionStatement>();
            if (paramHash is not null)
            {
                foreach (var kvp in paramHash)
                {
                    exceptions.Add(new XmlDocExceptionStatement(kvp.Key, kvp.Value));
                }
            }

            var docs = new XmlDocProvider(
                description is null ? null : new XmlDocSummaryStatement([description]),
                parametersList,
                exceptions,
                returnDescription is null ? null : new XmlDocReturnsStatement(returnDescription));

            return docs;
        }
    }
}
