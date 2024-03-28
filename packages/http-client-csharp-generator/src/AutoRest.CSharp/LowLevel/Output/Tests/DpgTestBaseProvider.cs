// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Builders;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using Azure.Core.TestFramework;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.LowLevel.Output.Tests
{
    internal class DpgTestBaseProvider : ExpressionTypeProvider
    {
        private static readonly Parameter IsAsyncParameter = new("isAsync", null, typeof(bool), null, ValidationType.None, null);

        private readonly IEnumerable<LowLevelClient> _clients;

        public DpgTestBaseProvider(string defaultNamespace, IEnumerable<LowLevelClient> clients, DpgTestEnvironmentProvider dpgTestEnvironment, SourceInputModel? sourceInputModel) : base(defaultNamespace, sourceInputModel)
        {
            TestEnvironment = dpgTestEnvironment;
            DefaultNamespace = $"{defaultNamespace}.Tests";
            DefaultName = $"{ClientBuilder.GetRPName(defaultNamespace)}TestBase";
            _clients = clients;
            Inherits = new CSharpType(typeof(RecordedTestBase<>), TestEnvironment.Type);
            DeclarationModifiers = TypeSignatureModifiers.Public | TypeSignatureModifiers.Partial;
        }

        public DpgTestEnvironmentProvider TestEnvironment { get; }

        protected override string DefaultNamespace { get; }

        protected override string DefaultName { get; }

        protected override IEnumerable<Method> BuildConstructors()
        {
            yield return new(new ConstructorSignature(
                    Type: Type,
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
            foreach (var method in CreateClientMethods.Values)
            {
                yield return method;
            }
        }

        private Dictionary<CSharpType, Method>? _createClientMethods;

        public Dictionary<CSharpType, Method> CreateClientMethods => _createClientMethods ??= EnsureCreateClientMethods();

        private Dictionary<CSharpType, Method> EnsureCreateClientMethods()
        {
            var result = new Dictionary<CSharpType, Method>();
            foreach (var client in _clients)
            {
                if (client.IsSubClient)
                    continue;

                var ctor = client.GetEffectiveCtor(includeClientOptions: true);

                if (ctor == null)
                    continue;

                var signature = new MethodSignature(
                    Name: $"Create{client.Type.Name}",
                    Summary: null,
                    Description: null,
                    Modifiers: MethodSignatureModifiers.Protected,
                    ReturnType: client.Type,
                    ReturnDescription: null,
                    Parameters: ctor.Parameters.Where(p => !p.Type.EqualsIgnoreNullable(client.ClientOptions.Type)).ToArray()
                );

                var method = new Method(signature, BuildClientFactoryMethodBody(client, ctor).ToArray());

                result.Add(client.Type, method);
            }

            return result;
        }

        private IEnumerable<MethodBodyStatement> BuildClientFactoryMethodBody(LowLevelClient client, MethodSignatureBase signature)
        {
            var clientOptionType = client.ClientOptions.Type;
            var optionsVar = new VariableReference(clientOptionType, "options");
            var newOptionsExpression = new InvokeStaticMethodExpression(null, "InstrumentClientOptions", new[] { New.Instance(clientOptionType) });

            yield return Declare(optionsVar, newOptionsExpression);

            var clientVar = new VariableReference(client.Type, "client");
            var newClientArguments = signature.Parameters.Where(p => !p.Type.EqualsIgnoreNullable(clientOptionType)).Select<Parameter, ValueExpression>(p => (ParameterReference)p).Append(optionsVar);
            var newClientExpression = New.Instance(client.Type, newClientArguments.ToArray());

            yield return Declare(clientVar, newClientExpression);

            yield return Return(new InvokeStaticMethodExpression(null, "InstrumentClient", new[] { clientVar }));
        }
    }
}
