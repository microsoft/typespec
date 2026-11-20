// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel.Primitives;
using System.Collections.Generic;
using Microsoft.TypeSpec.Generator.ClientModel.Snippets;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    public sealed partial class ModelSerializationExtensionsDefinition
    {
        private const string IsBuildableMethodName = "IsBuildable";
        internal const string ToWireOptionsMethodName = "ToWireOptions";

        private ProxyReadEligibilityDefinition? _proxyReadEligibility;
        private ProxyReadEligibilityDefinition ProxyReadEligibility => _proxyReadEligibility ??= new(this, _t);

        protected override TypeProvider[] BuildNestedTypes() => [ProxyReadEligibility];

        private MethodProvider[] BuildModelProxyMethods()
        {
            MethodProvider shouldReadThroughProxy = BuildShouldReadThroughProxyMethodProvider();
            return ValueExpression.Empty.ToApi<ClientPipelineApi>().SupportsModelProxies
                ? [shouldReadThroughProxy, BuildToWireOptionsMethodProvider()]
                : [shouldReadThroughProxy];
        }

        // Clients keep the shared wire options when no proxies are configured so model reads and writes keep their fast paths.
        private MethodProvider BuildToWireOptionsMethodProvider()
        {
            var modelProxiesParameter = new ParameterProvider("modelProxies", FormattableStringHelpers.Empty, typeof(IList<ModelProxy>));
            var signature = new MethodSignature(
                Name: ToWireOptionsMethodName,
                Modifiers: _methodModifiers,
                Parameters: [modelProxiesParameter],
                ReturnType: typeof(ModelReaderWriterOptions),
                Description: null,
                ReturnDescription: null);

            var body = new MethodBodyStatement[]
            {
                new IfStatement(modelProxiesParameter.Property(nameof(ICollection<ModelProxy>.Count)).Equal(Int(0)))
                {
                    Return(WireOptionsField)
                },
                Declare("options", typeof(ModelReaderWriterOptions), New.Instance(typeof(ModelReaderWriterOptions), ModelReaderWriterOptionsSnippets.WireFormat), out var options),
                new ForEachStatement(typeof(ModelProxy), "proxy", modelProxiesParameter, false, out var proxy)
                {
                    options.Property(nameof(ModelReaderWriterOptions.Proxies)).Invoke(nameof(IList<ModelProxy>.Add), proxy).Terminate()
                },
                Return(options)
            };

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        // ShouldReadThroughProxy<T>(this ModelReaderWriterOptions options, ModelReaderWriterContext context)
        //     => options.Proxies.Count > 0 && ProxyReadEligibility<T>.IsBuildable(context);
        private MethodProvider BuildShouldReadThroughProxyMethodProvider()
        {
            var optionsParameter = new ParameterProvider("options", FormattableStringHelpers.Empty, typeof(ModelReaderWriterOptions));
            var contextParameter = new ParameterProvider("context", FormattableStringHelpers.Empty, typeof(ModelReaderWriterContext));
            var signature = new MethodSignature(
                Name: ModelSerializationExtensionsSnippets.ShouldReadThroughProxyMethodName,
                Modifiers: _methodModifiers,
                Parameters: [optionsParameter, contextParameter],
                ReturnType: typeof(bool),
                Description: null,
                ReturnDescription: null,
                GenericArguments: [_t]);

            var isBuildable = Static(ProxyReadEligibility.Type).Invoke(IsBuildableMethodName, [contextParameter]);
            var body = Return(optionsParameter.As<ModelReaderWriterOptions>().ProxiesCount().GreaterThan(Int(0)).And(isBuildable));

            return new MethodProvider(signature, body, this, XmlDocProvider.Empty);
        }

        /// <summary>
        /// Caches, per model type, whether the generated <see cref="ModelReaderWriterContext"/> can build the type so
        /// nested reads don't repeat the context lookup. Generated code only passes the library's own context, so the
        /// result for a type never changes.
        /// </summary>
        private sealed class ProxyReadEligibilityDefinition : TypeProvider
        {
            private readonly ModelSerializationExtensionsDefinition _declaringType;
            private readonly CSharpType _t;
            private readonly FieldProvider _stateField;

            public ProxyReadEligibilityDefinition(ModelSerializationExtensionsDefinition declaringType, CSharpType t)
            {
                _declaringType = declaringType;
                _t = t;
                // 0 = unknown, 1 = buildable, 2 = not buildable. An int keeps the cached value tear-free.
                _stateField = new FieldProvider(FieldModifiers.Private | FieldModifiers.Static, typeof(int), "s_state", this);
            }

            protected override TypeProvider? BuildDeclaringTypeProvider() => _declaringType;

            protected override string BuildRelativeFilePath() => _declaringType.RelativeFilePath;

            protected override string BuildName() => "ProxyReadEligibility";

            protected override TypeSignatureModifiers BuildDeclarationModifiers()
                => TypeSignatureModifiers.Private | TypeSignatureModifiers.Static | TypeSignatureModifiers.Class;

            protected override CSharpType[] GetTypeArguments() => [_t];

            protected override FieldProvider[] BuildFields() => [_stateField];

            protected override MethodProvider[] BuildMethods()
            {
                var contextParameter = new ParameterProvider("context", FormattableStringHelpers.Empty, typeof(ModelReaderWriterContext));
                var signature = new MethodSignature(
                    Name: IsBuildableMethodName,
                    Modifiers: MethodSignatureModifiers.Public | MethodSignatureModifiers.Static,
                    Parameters: [contextParameter],
                    ReturnType: typeof(bool),
                    Description: null,
                    ReturnDescription: null);

                var tryGetTypeBuilder = contextParameter.Invoke(
                    nameof(ModelReaderWriterContext.TryGetTypeBuilder),
                    [TypeOf(_t), Identifier("_").AsArgument(isOut: true)]);
                var body = new MethodBodyStatement[]
                {
                    Declare("state", typeof(int), _stateField, out var state),
                    new IfStatement(state.Equal(Int(0)))
                    {
                        state.Assign(new TernaryConditionalExpression(tryGetTypeBuilder, Int(1), Int(2))).Terminate(),
                        _stateField.Assign(state).Terminate()
                    },
                    Return(state.Equal(Int(1)))
                };

                return [new MethodProvider(signature, body, this, XmlDocProvider.Empty)];
            }
        }
    }
}
