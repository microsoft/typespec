// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using BenchmarkDotNet.Attributes;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;

namespace Microsoft.TypeSpec.Generator.Perf
{
    public class MethodProviderBenchmark
    {
        private MethodSignature Signature { get; }
        private MethodBodyStatement BodyStatement = MethodBodyStatement.Empty;
        private Dictionary<ParameterValidationType, List<ParameterProvider>>? ParamHash;

        public MethodProviderBenchmark()
        {
            var parameters = new List<ParameterProvider>
            {
                new ParameterProvider("param1", $"param1", typeof(int)) { Validation = ParameterValidationType.None },
                new ParameterProvider("param2", $"param2", typeof(string)) { Validation = ParameterValidationType.AssertNotNull }
            };
            Signature = new MethodSignature("name", null, MethodSignatureModifiers.Public, null, null, parameters);
            ParamHash = GetParamhash(false);
        }

        [GlobalSetup]
        public void GlobalSetup()
        {
            GeneratorInitializer.Initialize();
        }

        [Benchmark]
        [BenchmarkCategory("ValidationStatements")]
        public void Yieldreturn()
        {
            List<MethodBodyStatement> statements = [.. GetValidationStatementsWithYield()];
            statements.Add(BodyStatement);
        }

        [Benchmark]
        [BenchmarkCategory("ValidationStatements")]
        public void UseList()
        {
            List<MethodBodyStatement> statements = [.. GetValidationStatements()];
            statements.Add(BodyStatement);
        }

        [Benchmark]
        [BenchmarkCategory("ValidationStatements")]
        public void UseSingleList()
        {
            MethodBodyStatement statements = GetStatementsAsSingleList(BodyStatement);
        }

        [Benchmark]
        [BenchmarkCategory("ValidationStatements")]
        public void UseArray()
        {
            MethodBodyStatement statements = GetStatementsWithHash(BodyStatement, ParamHash);
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

        private MethodBodyStatement GetStatementsWithHash(MethodBodyStatement bodyStatements, Dictionary<ParameterValidationType, List<ParameterProvider>>? paramHash)
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
            {
                throw new System.Exception("count is 0");
                //return bodyStatements;
            }

            MethodBodyStatement[] statements = new MethodBodyStatement[count + 2];
            int index = 0;
            foreach (var parameter in Signature.Parameters)
            {
                if (parameter.Validation != ParameterValidationType.None)
                {
                    statements[index] = ArgumentSnippets.ValidateParameter(parameter);
                    index++;
                }
            }
            statements[index] = MethodBodyStatement.EmptyLine;
            index++;

            statements[index] = bodyStatements;

            return statements;
        }

        private MethodBodyStatement GetStatementsAsSingleList(MethodBodyStatement original)
        {
            bool wroteValidation = false;
            List<MethodBodyStatement> statements = new();
            foreach (var parameter in Signature.Parameters)
            {
                if (parameter.Validation != ParameterValidationType.None)
                {
                    statements.Add(ArgumentSnippets.ValidateParameter(parameter));
                    wroteValidation = true;
                }
            }
            if (wroteValidation)
                statements.Add(MethodBodyStatement.EmptyLine);

            statements.Add(original);
            return statements;
        }

        private IEnumerable<MethodBodyStatement> GetValidationStatementsWithYield()
        {
            bool wroteValidation = false;
            foreach (var parameter in Signature.Parameters)
            {
                if (parameter.Validation != ParameterValidationType.None)
                {
                    yield return ArgumentSnippets.ValidateParameter(parameter);
                    wroteValidation = true;
                }
            }
            if (wroteValidation)
                yield return MethodBodyStatement.EmptyLine;
        }

        private IReadOnlyList<MethodBodyStatement> GetValidationStatements()
        {
            bool wroteValidation = false;
            List<MethodBodyStatement> statements = new();
            foreach (var parameter in Signature.Parameters)
            {
                if (parameter.Validation != ParameterValidationType.None)
                {
                    statements.Add(ArgumentSnippets.ValidateParameter(parameter));
                    wroteValidation = true;
                }
            }
            if (wroteValidation)
                statements.Add(MethodBodyStatement.EmptyLine);
            return statements;
        }
    }
}
