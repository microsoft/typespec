// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.TypeSpec.Generator.Expressions;
using Microsoft.TypeSpec.Generator.Input;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using Microsoft.TypeSpec.Generator.Snippets;
using Microsoft.TypeSpec.Generator.Statements;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.Utilities
{
    internal static class ExperimentalApiHelpers
    {
        public static bool IsExperimentalAttribute(AttributeStatement attribute)
            => attribute.Type.FullyQualifiedName == typeof(ExperimentalAttribute).FullName;

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
            method.Update(suppressions: MergeSuppressions(
                method.Suppressions,
                GetDependencySuppressions(operation.Experimental),
                operation.Parameters.SelectMany(parameter => GetReferenceSuppressions(parameter.Type)),
                operation.Responses.SelectMany(response => GetReferenceSuppressions(response.BodyType))));
        }

        public static SuppressionStatement[] GetDependencySuppressions(InputExperimentalDetails? details)
            => CreateSuppressions(details?.DependsOn ?? []);

        public static SuppressionStatement[] GetTypeSuppressions(InputType? type)
            => MergeSuppressions(
                GetDependencySuppressions(type?.Experimental),
                GetReferenceSuppressions((type as InputModelType)?.BaseModel));

        public static SuppressionStatement[] GetReferenceSuppressions(InputType? type)
        {
            var collector = new DiagnosticCollector();
            collector.AddReference(type);
            return CreateSuppressions(collector.Ids.Order(StringComparer.Ordinal));
        }

        public static SuppressionStatement[] GetReferenceSuppressions(CSharpType? type)
        {
            if (type is null)
            {
                return [];
            }
            var suppressions = new List<SuppressionStatement>();
            suppressions.AddRange(GetReferenceSuppressions(type.DeclaringType));
            foreach (var argument in type.Arguments)
            {
                suppressions.AddRange(GetReferenceSuppressions(argument));
            }
            if (type.IsArray)
            {
                suppressions.AddRange(GetReferenceSuppressions(type.ElementType));
            }
            if (CodeModelGenerator.Instance.TypeFactory.CSharpTypeMap.TryGetValue(type, out var provider) && provider is not null)
            {
                var custom = GetAttributeSuppressions(provider.CustomCodeView?.Attributes ?? []);
                suppressions.AddRange(custom.Length > 0 ? custom : GetAttributeSuppressions(provider.Attributes));
                if (type.IsLiteral && type.Literal is EnumTypeMember member)
                {
                    suppressions.AddRange(GetAttributeSuppressions(provider.Properties.Where(p => p.Name == member.Name).SelectMany(p => p.Attributes)));
                    suppressions.AddRange(GetAttributeSuppressions(provider.Fields.Where(f => f.Name == member.Name).SelectMany(f => f.Attributes)));
                }
            }
            return MergeSuppressions(suppressions);
        }

        public static SuppressionStatement[] GetAttributeSuppressions(IEnumerable<AttributeStatement> attributes)
        {
            var ids = new List<string>();
            foreach (var attribute in attributes)
            {
                if (!IsExperimentalAttribute(attribute))
                {
                    continue;
                }
                var argument = attribute.Arguments.Single();
                while (argument is ScopedApi scoped)
                {
                    argument = scoped.Original;
                }
                if (argument is not LiteralExpression { Literal: string id })
                {
                    throw new InvalidOperationException("Experimental attributes must have a constant string diagnostic ID.");
                }
                ids.Add(id);
            }
            return CreateSuppressions(ids);
        }

        public static SuppressionStatement[] GetMemberSuppressions(PropertyProvider property)
            => MergeSuppressions(property.Suppressions, GetReferenceSuppressions(property.Type), GetAttributeSuppressions(property.Attributes));

        public static SuppressionStatement[] GetMemberSuppressions(FieldProvider field)
            => MergeSuppressions(field.Suppressions, GetReferenceSuppressions(field.Type), GetAttributeSuppressions(field.Attributes));

        public static MethodBodyStatement Suppress(MethodBodyStatement statement, params IEnumerable<SuppressionStatement>[] suppressions)
        {
            foreach (var suppression in MergeSuppressions(suppressions).Reverse())
            {
                statement = new SuppressionStatement(statement, suppression.Code, suppression.Justification);
            }
            return statement;
        }

        public static SuppressionStatement[] GetOperationSuppressions(InputOperation operation)
        {
            var collector = new DiagnosticCollector();
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
