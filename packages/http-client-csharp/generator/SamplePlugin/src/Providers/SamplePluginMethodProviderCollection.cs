// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
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
            var methods = base.BuildMethods();
            var updatedMethods = new List<MethodProvider>();

            foreach (var method in methods)
            {
                // Only add tracing to protocol methods. Convenience methods will call into protocol methods.
                if (method is ClientMethodProvider { IsProtocol: false })
                {
                    updatedMethods.Add(method);
                    continue;
                }

                var ex = new VariableExpression(typeof(Exception), "ex");
                var decl = new DeclarationExpression(ex);
                updatedMethods.Add(new MethodProvider(
                    method.Signature,
                    new TryCatchFinallyStatement(
                        new[] {
                        InvokeConsoleWriteLine(Literal($"Entering method {method.Signature.Name}.")),  method.BodyStatements! },
                        new CatchExpression(
                            decl,
                            new[]
                            {
                                InvokeConsoleWriteLine(new FormattableStringExpression("An exception was thrown: {0}", new[] {ex})),
                                Throw()
                            }),
                        InvokeConsoleWriteLine(Literal($"Exiting method {method.Signature.Name}."))),
                    _enclosingType));
            }

            return updatedMethods;
        }
    }
}
