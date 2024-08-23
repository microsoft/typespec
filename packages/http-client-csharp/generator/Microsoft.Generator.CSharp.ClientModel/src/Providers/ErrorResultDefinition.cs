// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Primitives;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel.Providers
{
    internal class ErrorResultDefinition : TypeProvider
    {
        private class ErrorResultTemplate<T> { }

        private CSharpType _t = typeof(ErrorResultTemplate<>).GetGenericArguments()[0];
        private FieldProvider _responseField;
        private FieldProvider _exceptionField;
        private VariableExpression _response;
        private VariableExpression _exception;

        public ErrorResultDefinition()
        {
            _responseField = new FieldProvider(FieldModifiers.Private | FieldModifiers.ReadOnly, typeof(PipelineResponse), "_response", this);
            _exceptionField = new FieldProvider(FieldModifiers.Private | FieldModifiers.ReadOnly, typeof(ClientResultException), "_exception", this);
            _response = new VariableExpression(_responseField.Type, _responseField.Declaration);
            _exception = new VariableExpression(_exceptionField.Type, _exceptionField.Declaration);
        }

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "ErrorResult";

        protected override CSharpType[] GetTypeArguments()
        {
            return [_t];
        }

        protected override CSharpType[] BuildImplements()
        {
            return [new CSharpType(typeof(ClientResult<>), _t)];
        }

        protected override FieldProvider[] BuildFields()
        {
            return [_responseField, _exceptionField];
        }

        protected override ConstructorProvider[] BuildConstructors()
        {
            return [BuildCtor()];
        }

        private ConstructorProvider BuildCtor()
        {
            var response = new ParameterProvider("response", FormattableStringHelpers.Empty, typeof(PipelineResponse));
            var exception = new ParameterProvider("exception", FormattableStringHelpers.Empty, typeof(ClientResultException));
            var baseInitializer = new ConstructorInitializer(true, new List<ValueExpression> { Default, response });
            var signature = new ConstructorSignature(Type, null, MethodSignatureModifiers.Public, [response, exception], Initializer: baseInitializer);
            return new ConstructorProvider(signature, new MethodBodyStatement[]
            {
                _response.Assign(response).Terminate(),
                _exception.Assign(exception).Terminate(),
            }, this);
        }

        protected override PropertyProvider[] BuildProperties()
        {
            return [BuildValue()];
        }

        private PropertyProvider BuildValue()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.Public | MethodSignatureModifiers.Override, _t, "Value", new ExpressionPropertyBody(
                ThrowExpression(_exception)),
                this);
        }
    }
}
