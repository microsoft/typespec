// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// cspell:ignore Retryable

using System;
using System.ClientModel.Primitives;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class Classifier2xxAnd4xxDefinition : TypeProvider
    {
        public Classifier2xxAnd4xxDefinition(TypeProvider declaringType)
        {
            DeclaringTypeProvider = declaringType;
        }

        protected override string BuildName() => "Classifier2xxAnd4xx";

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", $"{DeclaringTypeProvider!.Name}.RestClient.cs");

        protected override TypeSignatureModifiers GetDeclarationModifiers()
            => TypeSignatureModifiers.Private | TypeSignatureModifiers.Class;

        protected override MethodProvider[] BuildMethods()
        {
            return [BuildTryClassifyErrorMethod(), BuildTryClassifyRetryMethod()];
        }

        protected override CSharpType[] BuildImplements()
        {
            return [typeof(PipelineMessageClassifier)];
        }

        private MethodProvider BuildTryClassifyRetryMethod()
        {
            var messageParam = new ParameterProvider("message", FormattableStringHelpers.Empty, typeof(PipelineMessage));
            var exceptionParam = new ParameterProvider("exception", FormattableStringHelpers.Empty, typeof(Exception));
            var isRetryableParam = new ParameterProvider("isRetryable", FormattableStringHelpers.Empty, typeof(bool), isOut: true);
            var signature = new MethodSignature(
                "TryClassify",
                FormattableStringHelpers.Empty,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                typeof(bool),
                null,
                [messageParam, exceptionParam, isRetryableParam]);
            return new MethodProvider(
                signature,
                new MethodBodyStatements(
                [
                    isRetryableParam.Assign(False).Terminate(),
                    Return(False)
                ]),
                this);
        }

        private MethodProvider BuildTryClassifyErrorMethod()
        {
            var messageParam = new ParameterProvider("message", FormattableStringHelpers.Empty, typeof(PipelineMessage));
            var isErrorParam = new ParameterProvider("isError", FormattableStringHelpers.Empty, typeof(bool), isOut: true);
            var signature = new MethodSignature(
                "TryClassify",
                FormattableStringHelpers.Empty,
                MethodSignatureModifiers.Public | MethodSignatureModifiers.Override,
                typeof(bool),
                null,
                [messageParam, isErrorParam]);
            return new MethodProvider(
                signature,
                new MethodBodyStatements(
                [
                    isErrorParam.Assign(False).Terminate(),
                    new IfStatement(messageParam.Property("Response").Equal(Null))
                    {
                        Return(False)
                    },
                    isErrorParam.Assign(new SwitchExpression(messageParam.Property("Response").Property("Status"),
                    [
                        new SwitchCaseExpression(
                            ValueExpression.Empty.GreaterThanOrEqual(Literal(200)).AndExpr(ValueExpression.Empty.LessThan(Literal(300))),
                            False),
                        new SwitchCaseExpression(
                            ValueExpression.Empty.GreaterThanOrEqual(Literal(400)).AndExpr(ValueExpression.Empty.LessThan(Literal(500))),
                            False),
                        SwitchCaseExpression.Default(True)
                    ])).Terminate(),
                    Return(True)
                ]),
                this);
        }
    }
}
