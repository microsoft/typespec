// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Output.Models.Serialization;
using AutoRest.CSharp.Output.Models.Shared;
using AutoRest.CSharp.Utilities;
using static AutoRest.CSharp.Output.Models.FieldModifiers;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Output.Models
{
    internal class ClientFields : IReadOnlyCollection<FieldDeclaration>
    {
        public FieldDeclaration? AuthorizationHeaderConstant { get; }
        public FieldDeclaration? AuthorizationApiKeyPrefixConstant { get; }
        public FieldDeclaration? ScopesConstant { get; }

        public FieldDeclaration ClientDiagnosticsProperty { get; }
        public FieldDeclaration PipelineField { get; }
        public FieldDeclaration? EndpointField { get; }

        public CodeWriterScopeDeclarations ScopeDeclarations { get; }

        private readonly FieldDeclaration? _keyAuthField;
        private readonly FieldDeclaration? _tokenAuthField;
        private readonly IReadOnlyList<FieldDeclaration> _fields;
        private readonly IReadOnlyDictionary<string, FieldDeclaration> _parameterNamesToFields;
        private static readonly FormattableString ClientDiagnosticsDescription = $"The ClientDiagnostics is used to provide tracing support for the client library.";

        public IReadOnlyList<FieldDeclaration> CredentialFields { get; }

        public static ClientFields CreateForClient(IEnumerable<Parameter> parameters, InputAuth authorization) => new(parameters, authorization);

        public static ClientFields CreateForRestClient(IEnumerable<Parameter> parameters) => new(parameters, null);

        private ClientFields(IEnumerable<Parameter> parameters, InputAuth? authorization)
        {
            ClientDiagnosticsProperty = new(ClientDiagnosticsDescription, Internal | ReadOnly, Configuration.ApiTypes.ClientDiagnosticsType, KnownParameters.ClientDiagnostics.Name.FirstCharToUpperCase(), SerializationFormat.Default, writeAsProperty: true);
            PipelineField = new(Private | ReadOnly, Configuration.ApiTypes.HttpPipelineType, "_" + KnownParameters.Pipeline.Name);

            var parameterNamesToFields = new Dictionary<string, FieldDeclaration>();
            var fields = new List<FieldDeclaration>();
            var credentialFields = new List<FieldDeclaration>();
            var properties = new List<FieldDeclaration>();

            if (authorization != null)
            {
                parameterNamesToFields[KnownParameters.Pipeline.Name] = PipelineField;
                parameterNamesToFields[KnownParameters.ClientDiagnostics.Name] = ClientDiagnosticsProperty;

                if (authorization.ApiKey is not null)
                {
                    AuthorizationHeaderConstant = new(Private | Const, typeof(string), "AuthorizationHeader", Literal(authorization.ApiKey.Name), SerializationFormat.Default);
                    _keyAuthField = new(Private | ReadOnly, KnownParameters.KeyAuth.Type.WithNullable(false), "_" + KnownParameters.KeyAuth.Name);

                    fields.Add(AuthorizationHeaderConstant);
                    fields.Add(_keyAuthField);
                    if (authorization.ApiKey.Prefix is not null)
                    {
                        AuthorizationApiKeyPrefixConstant = new(Private | Const, typeof(string), "AuthorizationApiKeyPrefix", Literal(authorization.ApiKey.Prefix), SerializationFormat.Default);
                        fields.Add(AuthorizationApiKeyPrefixConstant);
                    }
                    credentialFields.Add(_keyAuthField);
                    parameterNamesToFields[KnownParameters.KeyAuth.Name] = _keyAuthField;
                }

                if (authorization.OAuth2 is not null)
                {
                    var scopeExpression = New.Array(typeof(string), true, authorization.OAuth2.Scopes.Select(Literal).ToArray());
                    ScopesConstant = new(Private | Static | ReadOnly, typeof(string[]), "AuthorizationScopes", scopeExpression, SerializationFormat.Default);
                    _tokenAuthField = new(Private | ReadOnly, KnownParameters.TokenAuth.Type.WithNullable(false), "_" + KnownParameters.TokenAuth.Name);

                    fields.Add(ScopesConstant);
                    fields.Add(_tokenAuthField);
                    credentialFields.Add(_tokenAuthField);
                    parameterNamesToFields[KnownParameters.TokenAuth.Name] = _tokenAuthField;
                }

                fields.Add(PipelineField);
            }

            foreach (Parameter parameter in parameters)
            {
                var field = parameter == KnownParameters.ClientDiagnostics ? ClientDiagnosticsProperty : parameter == KnownParameters.Pipeline ? PipelineField : parameter.IsResourceIdentifier
                        ? new FieldDeclaration($"{parameter.Description}", Public | ReadOnly, parameter.Type, parameter.Name.FirstCharToUpperCase(), SerializationFormat.Default, writeAsProperty: true)
                        : new FieldDeclaration(Private | ReadOnly, parameter.Type, "_" + parameter.Name);

                if (field.WriteAsProperty)
                {
                    properties.Add(field);
                }
                else
                {
                    fields.Add(field);
                }
                parameterNamesToFields.Add(parameter.Name, field);

                if (parameter.Name == KnownParameters.Endpoint.Name && parameter.Type.EqualsIgnoreNullable(KnownParameters.Endpoint.Type))
                {
                    EndpointField = field;
                }
            }

            fields.AddRange(properties);
            if (authorization != null)
            {
                fields.Add(ClientDiagnosticsProperty);
            }

            _fields = fields;
            _parameterNamesToFields = parameterNamesToFields;
            CredentialFields = credentialFields;
            ScopeDeclarations = new CodeWriterScopeDeclarations(fields.Select(f => f.Declaration));
        }

        public FieldDeclaration? GetFieldByParameter(string parameterName, CSharpType parameterType)
            => parameterName switch
            {
                "credential" when _keyAuthField != null && parameterType.EqualsIgnoreNullable(_keyAuthField.Type) => _keyAuthField,
                "credential" when _tokenAuthField != null && parameterType.EqualsIgnoreNullable(_tokenAuthField.Type) => _tokenAuthField,
                var name => _parameterNamesToFields.TryGetValue(name, out var field) ? parameterType.Equals(field.Type) ? field : null : null
            };

        public FieldDeclaration? GetFieldByParameter(Parameter parameter)
            => GetFieldByParameter(parameter.Name, parameter.Type);

        public IEnumerator<FieldDeclaration> GetEnumerator() => _fields.GetEnumerator();
        IEnumerator IEnumerable.GetEnumerator() => _fields.GetEnumerator();
        public int Count => _fields.Count;
    }
}
