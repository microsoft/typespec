// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    public static class ExperimentalApiHelpers
    {
        public static AttributeStatement? BuildAttribute(InputOperation operation)
            => BuildAttribute(operation.Experimental);

        public static AttributeStatement? BuildAttribute(InputExperimentalDetails? details)
        {
            if (details?.DiagnosticId is not { } diagnosticId)
            {
                return null;
            }
            ValidateDiagnosticId(diagnosticId);
            return new AttributeStatement(typeof(ExperimentalAttribute), [Literal(diagnosticId)]);
        }

        public static AttributeStatement[] BuildAttributes(InputExperimentalDetails? details)
            => BuildAttribute(details) is { } attribute ? [attribute] : [];

        public static void AddDependencySuppressions(MethodProvider method, InputOperation operation)
        {
            if (operation.Experimental?.DependsOn is not { Count: > 0 } dependencies)
            {
                return;
            }

            var fileSuppressions = method.EnclosingType.DisabledFileWarnings
                .Select(s => s.Code.ToDisplayString()).ToHashSet(StringComparer.Ordinal);
            method.Update(suppressions: MergeSuppressions(
                method.Suppressions,
                CreateSuppressions(dependencies).Where(s => !fileSuppressions.Contains(s.Code.ToDisplayString()))));
        }

        public static SuppressionStatement[] GetSuppressions(InputType? type)
            => GetSuppressions(type is null ? [] : new[] { type });

        public static SuppressionStatement[] GetSuppressions(IEnumerable<InputType> types)
        {
            var collector = new DiagnosticCollector();
            foreach (var type in types)
            {
                collector.AddDeclaration(type);
            }
            return CreateSuppressions(collector.Ids.Order(StringComparer.Ordinal));
        }

        public static SuppressionStatement[] GetSuppressions(InputClient client)
        {
            var collector = new DiagnosticCollector();
            collector.AddMetadata(client.Experimental);
            collector.AddId(client.Parent?.Experimental?.DiagnosticId);
            foreach (var child in client.Children)
            {
                collector.AddId(child.Experimental?.DiagnosticId);
            }
            foreach (var parameter in client.Parameters)
            {
                collector.AddProperty(parameter);
            }
            foreach (var method in client.Methods)
            {
                foreach (var parameter in method.Parameters.Concat<InputProperty>(method.Operation.Parameters))
                {
                    collector.AddProperty(parameter);
                }
                collector.AddReference(method.Response.Type);
                foreach (var response in method.Operation.Responses)
                {
                    collector.AddReference(response.BodyType);
                }
            }
            return CreateSuppressions(collector.Ids.Order(StringComparer.Ordinal));
        }

        public static SuppressionStatement[] GetParameterSuppressions(IEnumerable<InputProperty> parameters)
        {
            var collector = new DiagnosticCollector();
            foreach (var parameter in parameters)
            {
                collector.AddProperty(parameter);
            }
            return CreateSuppressions(collector.Ids.Order(StringComparer.Ordinal));
        }

        public static SuppressionStatement[] GetSuppressions(InputOperation operation, InputClient? client = null)
        {
            var collector = new DiagnosticCollector();
            collector.AddMetadata(client?.Experimental);
            collector.AddMetadata(operation.Experimental);
            foreach (var parameter in operation.Parameters)
            {
                collector.AddProperty(parameter);
            }
            foreach (var response in operation.Responses)
            {
                collector.AddReference(response.BodyType);
            }
            return CreateSuppressions(collector.Ids.Order(StringComparer.Ordinal));
        }

        public static SuppressionStatement[] MergeSuppressions(params IEnumerable<SuppressionStatement>[] suppressions)
            => [.. suppressions.SelectMany(s => s).DistinctBy(s => s.Code.ToDisplayString())];

        private static SuppressionStatement[] CreateSuppressions(IEnumerable<string> diagnosticIds)
            => [.. diagnosticIds.Distinct(StringComparer.Ordinal).Select(id =>
            {
                ValidateDiagnosticId(id);
                return new SuppressionStatement(null, Literal(id), "This generated code depends on experimental functionality.");
            })];

        private static void ValidateDiagnosticId(string diagnosticId)
        {
            if (!Regex.IsMatch(diagnosticId, @"\A(?:[A-Za-z_][A-Za-z0-9_]*|[0-9]+)\z", RegexOptions.CultureInvariant))
            {
                throw new ArgumentException("Experimental diagnostic IDs must be single C# warning identifiers or decimal warning numbers.", nameof(diagnosticId));
            }
        }

        private sealed class DiagnosticCollector
        {
            private readonly HashSet<InputType> _declarations = [];
            private readonly HashSet<InputType> _references = [];
            public HashSet<string> Ids { get; } = new(StringComparer.Ordinal);

            public void AddId(string? id)
            {
                if (id is not null)
                {
                    ValidateDiagnosticId(id);
                    Ids.Add(id);
                }
            }

            public void AddMetadata(InputExperimentalDetails? details)
            {
                AddId(details?.DiagnosticId);
                foreach (var dependency in details?.DependsOn ?? [])
                {
                    AddId(dependency);
                }
            }

            public void AddProperty(InputProperty property)
            {
                AddMetadata(property.Experimental);
                AddReference(property.Type);
                AddReference(property.DefaultValue?.Type);
            }

            public void AddDeclaration(InputType type)
            {
                if (!_declarations.Add(type))
                {
                    return;
                }
                AddMetadata(type.Experimental);
                if (type is InputModelType model)
                {
                    foreach (var property in model.Properties)
                    {
                        AddProperty(property);
                    }
                    if (model.BaseModel is { } baseModel)
                    {
                        AddDeclaration(baseModel);
                    }
                    AddReference(model.AdditionalProperties);
                    foreach (var derived in model.DerivedModels)
                    {
                        AddReference(derived);
                    }
                }
                else if (type is InputEnumType enumType)
                {
                    foreach (var value in enumType.Values)
                    {
                        AddMetadata(value.Experimental);
                    }
                }
            }

            public void AddReference(InputType? type)
            {
                if (type is null || !_references.Add(type))
                {
                    return;
                }
                AddId(type.Experimental?.DiagnosticId);
                switch (type)
                {
                    case InputArrayType array:
                        AddReference(array.ValueType);
                        break;
                    case InputStreamingType streaming:
                        AddReference(streaming.ValueType);
                        break;
                    case InputDictionaryType dictionary:
                        AddReference(dictionary.KeyType);
                        AddReference(dictionary.ValueType);
                        break;
                    case InputNullableType nullable:
                        AddReference(nullable.Type);
                        break;
                    case InputUnionType union:
                        foreach (var variant in union.VariantTypes)
                        {
                            AddReference(variant);
                        }
                        break;
                    case InputEnumTypeValue value:
                        AddReference(value.EnumType);
                        break;
                }
            }
        }
    }
}
