// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.ClientModel.Providers;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Logging.Plugin
{
    internal class LoggingMethodProviderCollection : ScmMethodProviderCollection
    {
        public LoggingMethodProviderCollection(InputServiceMethod serviceMethod, TypeProvider enclosingType)
            : base(serviceMethod, enclosingType)
        {
        }

        protected override IReadOnlyList<ScmMethodProvider> BuildMethods()
        {
            // Add the base methods.
            var methods = base.BuildMethods();

            foreach (var method in methods)
            {
                // Convert to a method with a body statement so we can add tracing.
                ConvertToBodyStatementMethodProvider(method);

                var tryExp = new TryExpression(
                [
                    InvokeConsoleWriteLine(Literal($"Entering method {method.Signature.Name}.")),
                    method.BodyStatements!
                ]);
                List<CatchExpression> catches =
                [
                    Catch(Declare("ex", out ScopedApi<Exception> ex),
                    [
                        InvokeConsoleWriteLine(new FormattableStringExpression(
                            $"An exception was thrown in method {method.Signature.Name}: {{0}}", [ex])),
                        Throw()
                    ])
                ];
                var finallyStatement = new FinallyExpression(InvokeConsoleWriteLine(Literal($"Exiting method {method.Signature.Name}.")));
                var statements = new TryCatchFinallyStatement(
                    tryExp,
                    catches,
                    finallyStatement);

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
