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
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Samples.Models;
using NUnit.Framework;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.LowLevel.Output.Tests
{
    internal class DpgClientRecordedTestProvider : DpgClientTestProvider
    {
        private static readonly Parameter IsAsyncParameter = new("isAsync", null, typeof(bool), null, ValidationType.None, null);

        private readonly DpgTestBaseProvider _testBaseProvider;

        public DpgClientRecordedTestProvider(string defaultNamespace, LowLevelClient client, DpgTestBaseProvider testBase, SourceInputModel? sourceInputModel) : base($"{defaultNamespace}.Tests", $"{client.Declaration.Name}Tests", client, sourceInputModel)
        {
            _testBaseProvider = testBase;
            Inherits = _testBaseProvider.Type;
        }

        protected override IEnumerable<string> BuildUsings()
        {
            if (Configuration.IsBranded)
                yield return "Azure.Identity"; // we need this using because we might need to call `new DefaultAzureCredential` from `Azure.Identity` package, but Azure.Identity package is not a dependency of the generator project.
        }

        protected override IEnumerable<Method> BuildConstructors()
        {
            yield return new(new ConstructorSignature(
                Type,
                Summary: null,
                Description: null,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: new[] { IsAsyncParameter },
                Initializer: new ConstructorInitializer(
                    IsBase: true,
                    Arguments: new ValueExpression[] { IsAsyncParameter })
                ),
                EmptyStatement);
        }

        protected override IEnumerable<Method> BuildMethods()
        {
            foreach (var sample in _client.ClientMethods.SelectMany(m => m.Samples))
            {
                yield return BuildSampleMethod(sample, true);
            }
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

        private static readonly CSharpAttribute[] _attributes = new[] { new CSharpAttribute(typeof(TestAttribute)), new CSharpAttribute(typeof(IgnoreAttribute), Literal("Please remove the Ignore attribute to let the test method run")) };

        protected override MethodBodyStatement BuildGetClientStatement(DpgOperationSample sample, IReadOnlyList<MethodSignatureBase> methodsToCall, List<MethodBodyStatement> variableDeclarations, out VariableReference clientVar)
        {
            // change the first method in methodToCall to the factory method of that client
            var firstMethod = methodsToCall[0];
            if (firstMethod is ConstructorSignature ctor)
            {
                firstMethod = _testBaseProvider.CreateClientMethods[ctor.Type].Signature;
            }
            var newMethodsToCall = methodsToCall.ToArray();
            newMethodsToCall[0] = firstMethod;
            return base.BuildGetClientStatement(sample, newMethodsToCall, variableDeclarations, out clientVar);
        }

        protected override IEnumerable<MethodBodyStatement> BuildResponseStatements(DpgOperationSample sample, VariableReference resultVar)
        {
            // TODO -- for test methods, we need the response values to generate response validations
            yield break;
        }
    }
}
