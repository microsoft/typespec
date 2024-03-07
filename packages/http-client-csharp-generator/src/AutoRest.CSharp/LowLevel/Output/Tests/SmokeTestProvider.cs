// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Samples.Models;
using NUnit.Framework;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.LowLevel.Output.Tests
{
    internal class SmokeTestProvider : DpgClientTestProvider
    {
        public SmokeTestProvider(string defaultNamespace, LowLevelClient client, SourceInputModel? sourceInputModel) : base($"{defaultNamespace}.Tests", $"{client.Declaration.Name}Tests", client, sourceInputModel)
        {
        }

        protected override IEnumerable<string> BuildUsings()
        {
            if (Configuration.IsBranded)
                yield return "Azure.Identity"; // we need this using because we might need to call `new DefaultAzureCredential` from `Azure.Identity` package, but Azure.Identity package is not a dependency of the generator project.
        }

        protected override IEnumerable<Method> BuildMethods()
        {
            // smoke test only have one method, here we only takes the first or nothing
            var firstSample = _client.ClientMethods.SelectMany(m => m.Samples).FirstOrDefault();
            if (firstSample is not null)
            {
                yield return BuildSmokeTestMethod(firstSample);
            }
        }

        private Method BuildSmokeTestMethod(DpgOperationSample sample)
        {
            var signature = new MethodSignature(
                Name: "SmokeTest",
                Summary: null,
                Description: null,
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: null,
                ReturnDescription: null,
                Parameters: Array.Empty<Parameter>(),
                Attributes: GetMethodAttributes());

            return new Method(signature, BuildSomkeTestMethodBody(sample).ToArray());
        }

        private IEnumerable<MethodBodyStatement> BuildSomkeTestMethodBody(DpgOperationSample sample)
        {
            var clientVariableStatements = new List<MethodBodyStatement>();
            var newClientStatement = BuildGetClientStatement(sample, sample.ClientInvocationChain, clientVariableStatements, out var clientVar);

            yield return clientVariableStatements;
            yield return newClientStatement;

            yield return Assertions.IsNotNull(clientVar);
        }

        protected override string GetMethodName(DpgOperationSample sample, bool isAsync)
        {
            var builder = new StringBuilder();

            if (sample.ResourceName is not null)
                builder.Append(sample.ResourceName).Append('_');

            builder.Append(sample.InputOperationName)
                .Append('_').Append(sample.ExampleKey);

            if (sample.IsConvenienceSample)
            {
                builder.Append("_Convenience");
            }

            // do not append Async here because the test method is always using the async version of the operation

            return builder.ToString();
        }

        protected override CSharpAttribute[] GetMethodAttributes() => _attributes;

        private static readonly CSharpAttribute[] _attributes = new[] { new CSharpAttribute(typeof(TestAttribute)) };

        protected override IEnumerable<MethodBodyStatement> BuildResponseStatements(DpgOperationSample sample, VariableReference resultVar)
        {
            yield break;
        }
    }
}
