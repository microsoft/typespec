// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.ClientModel;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
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
            // Add the base methods.
            var methods = base.BuildMethods();

            foreach (var method in methods)
            {
                // Only add tracing to protocol methods. Convenience methods will call into protocol methods.
                if (!method.IsServiceCall())
                {
                    continue;
                }

                // Convert to a method with a body statement so we can add tracing.
                ConvertToBodyStatementMethodProvider(method);
                var statements = new TryCatchFinallyStatement(
                    [
                        InvokeConsoleWriteLine(Literal($"Entering method {method.Signature.Name}.")),
                        method.BodyStatements!
                    ],
                    Catch(Declare("ex", out ScopedApi<Exception> ex),
                    [
                        InvokeConsoleWriteLine(new FormattableStringExpression(
                            $"An exception was thrown in method {method.Signature.Name}: {{0}}", new[] { ex })),
                        Throw()
                    ]),
                    [InvokeConsoleWriteLine(Literal($"Exiting method {method.Signature.Name}."))]);

                method.Update(bodyStatements: statements);
            }

            return [..methods];
        }

        private void ConvertToBodyStatementMethodProvider(MethodProvider method)
        {
            if (method.BodyExpression != null)
            {
                MethodBodyStatement statements;
                if (method.BodyExpression is KeywordExpression { Keyword: "throw" } keywordExpression)
                {
                    statements = keywordExpression.Terminate();
                }
                else
                {
                    statements = new KeywordExpression("return", method.BodyExpression).Terminate();
                }
                method.Update(bodyStatements: statements);
            }
        }
    }
}
