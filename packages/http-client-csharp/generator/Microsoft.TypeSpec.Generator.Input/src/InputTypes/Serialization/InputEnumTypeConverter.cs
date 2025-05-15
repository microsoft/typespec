// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TypeSpec.Generator.Input
{
    internal sealed class InputEnumTypeConverter : JsonConverter<InputEnumType>
    {
        private readonly TypeSpecReferenceHandler _referenceHandler;

        public InputEnumTypeConverter(TypeSpecReferenceHandler referenceHandler)
        {
            _referenceHandler = referenceHandler;
        }

        public override InputEnumType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
            => reader.ReadReferenceAndResolve<InputEnumType>(_referenceHandler.CurrentResolver) ?? CreateEnumType(ref reader, null, null, options, _referenceHandler.CurrentResolver);

        public override void Write(Utf8JsonWriter writer, InputEnumType value, JsonSerializerOptions options)
            => throw new NotSupportedException("Writing not supported");

        public static InputEnumType CreateEnumType(ref Utf8JsonReader reader, string? id, string? name, JsonSerializerOptions options, ReferenceResolver resolver)
        {
            if (id == null)
            {
                reader.TryReadReferenceId(ref id);
            }

            id = id ?? throw new JsonException();

            // create an empty enum to resolve circular references
            var enumType = new InputEnumType(
                name: name!,
                @namespace: null!,
                crossLanguageDefinitionId: null!,
                access: null,
                deprecation: null,
                summary: null,
                doc: null,
                usage: InputModelTypeUsage.None,
                valueType: null!,
                values: Array.Empty<InputEnumTypeValue>(),
                isExtensible: false);
            resolver.AddReference(id, enumType);

            string? @namespace = null;
            string? crossLanguageDefinitionId = null;
            string? access = null;
            string? deprecation = null;
            string? summary = null;
            string? doc = null;
            InputModelTypeUsage usage = InputModelTypeUsage.None;
            string? usageString = null;
            bool isFixed = false;
            InputPrimitiveType? valueType = null;
            IReadOnlyList<InputEnumTypeValue>? values = null;
            IReadOnlyList<InputDecoratorInfo>? decorators = null;
            while (reader.TokenType != JsonTokenType.EndObject)
            {
                var isKnownProperty = reader.TryReadString("name", ref name)
                    || reader.TryReadString("namespace", ref @namespace)
                    || reader.TryReadString("crossLanguageDefinitionId", ref crossLanguageDefinitionId)
                    || reader.TryReadString("access", ref access)
                    || reader.TryReadString("deprecation", ref deprecation)
                    || reader.TryReadString("summary", ref summary)
                    || reader.TryReadString("doc", ref doc)
                    || reader.TryReadString("usage", ref usageString)
                    || reader.TryReadBoolean("isFixed", ref isFixed)
                    || reader.TryReadComplexType("valueType", options, ref valueType)
                    || reader.TryReadComplexType("values", options, ref values)
                    || reader.TryReadComplexType("decorators", options, ref decorators);

                if (!isKnownProperty)
                {
                    reader.SkipProperty();
                }
            }

            enumType.Name = name ?? throw new JsonException("Enum must have name");
            enumType.Namespace = @namespace ?? string.Empty;
            enumType.CrossLanguageDefinitionId = crossLanguageDefinitionId ?? string.Empty;
            enumType.Access = access;
            enumType.Deprecation = deprecation;
            enumType.Summary = summary;
            enumType.Doc = doc;
            if (usageString != null)
            {
                Enum.TryParse(usageString, ignoreCase: true, out usage);
                enumType.Usage = usage;
            }
            enumType.Values = values ?? throw new JsonException("Enum must have values");
            enumType.ValueType = valueType ?? throw new JsonException("Enum must have valueType");
            enumType.IsExtensible = !isFixed;
            enumType.Decorators = decorators ?? [];

            return enumType;
        }
    }
}
