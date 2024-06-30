// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace SamplePlugin.Providers
{
    internal class SamplePluginMethodProviderCollection : ScmMethodProviderCollection
    {
        public SamplePluginMethodProviderCollection(InputOperation operation, TypeProvider enclosingType)
            : base(operation, enclosingType)
        {
        }

        protected override IReadOnlyList<MethodProvider> BuildMethods()
        {
            var methods = new List<MethodProvider>();
            methods.AddRange(base.BuildMethods());
            methods.Add(
                new ClientMethodProvider(
                    new MethodSignature(
                        $"TestExpressionBodyConversion{_operation.Name}",
                        $"Test expression body conversion.",
                        MethodSignatureModifiers.Public,
                        typeof(int),
                        $"Returns an int",
                        Array.Empty<ParameterProvider>()),
                    Literal(42),
                    _enclosingType) { IsProtocol = true });
            var updatedMethods = new List<MethodProvider>();

            foreach (var method in methods)
            {
                // Only add tracing to protocol methods. Convenience methods will call into protocol methods.
                if (method is ClientMethodProvider { IsProtocol: false })
                {
                    updatedMethods.Add(method);
                    continue;
                }

                var transformedMethod = method.ToBodyStatementMethodProvider();

                var ex = new VariableExpression(typeof(Exception), "ex");
                var decl = new DeclarationExpression(ex);
                updatedMethods.Add(new MethodProvider(
                    transformedMethod.Signature,
                    new TryCatchFinallyStatement(
                        new[] {
                            // TODO translate BodyExpression into BodyStatement?
                        InvokeConsoleWriteLine(Literal($"Entering method {transformedMethod.Signature.Name}.")),  transformedMethod.BodyStatements! },
                        new CatchExpression(
                            decl,
                            new[]
                            {
                                InvokeConsoleWriteLine(new FormattableStringExpression("An exception was thrown: {0}", new[] {ex})),
                                Throw()
                            }),
                        InvokeConsoleWriteLine(Literal($"Exiting method {transformedMethod.Signature.Name}."))),
                    _enclosingType));
            }

            return updatedMethods;
        }
    }
}
