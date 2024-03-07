// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Output.Builders;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;
using Azure.Core;
using Azure.Core.Extensions;

namespace AutoRest.CSharp.Common.Output.Models.Types
{
    internal class AspDotNetExtensionTypeProvider : TypeProvider
    {
        private const string AspDotNetExtensionNamespace = "Microsoft.Extensions.Azure";

        internal string FullName => $"{Type.Namespace}.{Type.Name}";

        private IReadOnlyList<LowLevelClient> _clients;
        private IReadOnlyList<LowLevelClient> _topLevelClients;

        public AspDotNetExtensionTypeProvider(IReadOnlyList<LowLevelClient> clients, string clientNamespace, SourceInputModel? sourceInputModel) : base(AspDotNetExtensionNamespace, sourceInputModel)
        {
            DefaultName = $"{ClientBuilder.GetRPName(clientNamespace)}ClientBuilderExtensions".ToCleanName();
            //TODO: very bad design that this list is empty when we leave the constructor and is filled in at some point in the future.
            //creates lots of opportunity run into issues with iterators
            _clients = clients;
            _topLevelClients = _clients.Where(client => client is { IsSubClient: false, Declaration.Accessibility: "public" }).ToList();
        }

        public FormattableString Description => $"Extension methods to add {_topLevelClients.GetClientTypesFormattable()} to client builder";

        protected override string DefaultName { get; }

        protected override string DefaultAccessibility => "public";

        private Dictionary<MethodSignature, (IEnumerable<FormattableString> Parameters, IEnumerable<FormattableString> ParameterValues)>? _extensionMethods;
        public IReadOnlyDictionary<MethodSignature, (IEnumerable<FormattableString> Parameters, IEnumerable<FormattableString> ParameterValues)> ExtesnsionMethods => _extensionMethods ??= EnsureExtensionMethods();

        private Dictionary<MethodSignature, (IEnumerable<FormattableString> Parameters, IEnumerable<FormattableString> ParameterValues)> EnsureExtensionMethods()
        {
            var result = new Dictionary<MethodSignature, (IEnumerable<FormattableString> Parameters, IEnumerable<FormattableString> ParameterValues)>();
            foreach (var client in _topLevelClients)
            {
                var returnType = new CSharpType(typeof(IAzureClientBuilder<,>), client.Type, client.ClientOptions.Type);
                foreach (var ctor in client.PrimaryConstructors)
                {
                    var signatureParameters = new List<Parameter>() { FactoryBuilderParameter };
                    var parameterDeclarations = new List<FormattableString>();
                    var parameterValues = new List<FormattableString>();
                    var includeCredential = false;
                    foreach (var parameter in ctor.Parameters)
                    {
                        if (parameter.Type.EqualsIgnoreNullable(client.ClientOptions.Type))
                        {
                            // do not put the ClientOptions on the signature
                            var options = new CodeWriterDeclaration("options");
                            parameterDeclarations.Insert(0, $"{options:D}"); // options are always the first in the callback signature
                            parameterValues.Add($"{options:I}");
                        }
                        else if (parameter.Type.EqualsIgnoreNullable(typeof(TokenCredential)))
                        {
                            // do not put the TokenCredential on the signature
                            includeCredential = true;
                            var cred = new CodeWriterDeclaration("cred");
                            parameterDeclarations.Add($"{cred:D}");
                            parameterValues.Add($"{cred:I}");
                        }
                        else
                        {
                            // for other parameters, we do not put it on the declarations because they are on the method signature
                            signatureParameters.Add(parameter);
                            parameterValues.Add($"{parameter.Name:I}");
                        }
                    }

                    FormattableString summary = $"Registers a {client.Type:C} instance";
                    var constrait = includeCredential
                        ? (FormattableString)$"{typeof(IAzureClientFactoryBuilderWithCredential)}"
                        : $"{typeof(IAzureClientFactoryBuilder)}";
                    var signature = new MethodSignature(
                        $"Add{client.Declaration.Name}",
                        summary,
                        summary,
                        MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                        returnType,
                        null,
                        signatureParameters,
                        GenericArguments: new[] { TBuilderType },
                        GenericParameterConstraints: new Dictionary<CSharpType, FormattableString>()
                        {
                            [TBuilderType] = constrait
                        });
                    result.Add(signature, (parameterDeclarations, parameterValues));
                }
            }

            return result;
        }

        private IEnumerable<MethodSignature>? _extensionMethodsWithoutCallback;
        public IEnumerable<MethodSignature> ExtensionMethodsWithoutCallback => _extensionMethodsWithoutCallback ??= EnsureExtensionMethodsWithoutCallback();

        private IEnumerable<MethodSignature> EnsureExtensionMethodsWithoutCallback()
        {
            foreach (var client in _topLevelClients)
            {
                var returnType = new CSharpType(typeof(IAzureClientBuilder<,>), client.Type, client.ClientOptions.Type);

                FormattableString summary = $"Registers a {client.Type:C} instance";
                yield return new MethodSignature(
                    $"Add{client.Declaration.Name}",
                    summary,
                    summary,
                    MethodSignatureModifiers.Public | MethodSignatureModifiers.Static | MethodSignatureModifiers.Extension,
                    returnType,
                    null,
                    new[] { FactoryBuilderParameter, ConfigurationParameter },
                    GenericArguments: new[] { TBuilderType, TConfigurationType },
                    GenericParameterConstraints: new Dictionary<CSharpType, FormattableString>()
                    {
                        [TBuilderType] = $"{typeof(IAzureClientFactoryBuilderWithConfiguration<>)}"
                    });
            }
        }

        private Parameter? _factoryBuilderParameter;
        public Parameter FactoryBuilderParameter => _factoryBuilderParameter ??= new Parameter(
            "builder",
            $"The builder to register with.",
            TBuilderType,
            null,
            ValidationType.None,
            null);

        private Parameter? _configurationParameter;
        public Parameter ConfigurationParameter => _configurationParameter ??= new Parameter(
            "configuration",
            $"The configuration values.",
            TConfigurationType,
            null,
            ValidationType.None,
            null);

        private static CSharpType? _builderType;
        private static CSharpType? _configurationType;
        // these two properties are getting the open generic parameter type of `TBuilder` and `TConfiguration` so that we could use them on the generated generic method
        // since there is no method to manually construct this kind of open generic argument types.
        private static CSharpType TBuilderType => _builderType ??= typeof(Template<>).GetGenericArguments()[0];
        private static CSharpType TConfigurationType => _configurationType ??= typeof(IAzureClientFactoryBuilderWithConfiguration<>).GetGenericArguments()[0];

        // this is a private type that provides the open generic type argument "TBuilder" for us to use in the geenrated code
        private class Template<TBuilder> { }
    }
}
