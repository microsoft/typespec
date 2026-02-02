// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json;
using Microsoft.TypeSpec.Generator.Expressions;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Snippets
{
    internal static class JsonTokenTypeSnippets
    {
        public static ValueExpression StartArray => FrameworkEnumValue(JsonTokenType.StartArray);
        public static ValueExpression EndArray => FrameworkEnumValue(JsonTokenType.EndArray);
        public static ValueExpression StartObject => FrameworkEnumValue(JsonTokenType.StartObject);
        public static ValueExpression EndObject => FrameworkEnumValue(JsonTokenType.EndObject);
        public static ValueExpression Null => FrameworkEnumValue(JsonTokenType.Null);
    }
}
