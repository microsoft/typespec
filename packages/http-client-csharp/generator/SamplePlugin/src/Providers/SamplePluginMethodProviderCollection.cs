// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Generator.CSharp;
using Microsoft.Generator.CSharp.ClientModel.Providers;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Input;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.SamplePlugin;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace SamplePlugin.Providers
{
    internal class SamplePluginMethodProviderCollection : ScmMethodProviderCollection
    {
        private string _cleanOperationName;
        private string _createRequestMethodName;
        public SamplePluginMethodProviderCollection(InputOperation operation, TypeProvider enclosingType)
            : base(operation, enclosingType)
        {
            _cleanOperationName = operation.Name;
            _createRequestMethodName = "Create" + _cleanOperationName + "Request";
        }

        protected override IReadOnlyList<MethodProvider> BuildMethods()
        {
            var methods = base.BuildMethods();
            var tracedMethods = new List<MethodProvider>();
            foreach (var method in methods)
            {
                var ex = new VariableExpression(typeof(Exception), "ex");
                var decl = new DeclarationExpression(ex);
                tracedMethods.Add(new MethodProvider(
                    method.Signature,
                    new TryCatchFinallyStatement(
                        new[] {
                        new InvokeStaticMethodExpression(typeof(Console), "WriteLine", Literal($"Entering method {method.Signature.Name}.")).Terminate(),  method.BodyStatements! },
                        new CatchExpression(
                            decl,
                            new[]
                            {
                                new InvokeStaticMethodExpression(typeof(Console), "WriteLine", new FormattableStringExpression("An exception was thrown: {0}", new[] {ex})).Terminate(),
                                Throw()
                            }),
                        new InvokeStaticMethodExpression(typeof(Console), "WriteLine", Literal($"Exiting method {method.Signature.Name}.")).Terminate()),
                    _enclosingType));
            }

            return tracedMethods;
        }
    }
}
