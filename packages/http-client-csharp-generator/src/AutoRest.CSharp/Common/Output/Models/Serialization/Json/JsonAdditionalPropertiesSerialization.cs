// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Types;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.Output.Models.Serialization.Json
{
    internal record JsonAdditionalPropertiesSerialization : JsonPropertySerialization
    {
        public CSharpType Type { get; }

        public JsonAdditionalPropertiesSerialization(ObjectTypeProperty property, JsonSerialization valueSerialization, CSharpType type, bool shouldExcludeInWireSerialization)
            : base(property.Declaration.Name.ToVariableName(), new TypedMemberExpression(null, property.Declaration.Name, property.Declaration.Type), property.Declaration.Name, property.ValueType, valueSerialization, true, shouldExcludeInWireSerialization)
        {
            Type = type;
        }
    }
}
