// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel.Primitives;
using System.Text.Json;
using System.Xml;
using System.Xml.Linq;
using Microsoft.Generator.CSharp.Providers;
using Microsoft.Generator.CSharp.Snippets;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.ClientModel
{
    internal static class ScmKnownParameters
    {
        private static readonly CSharpType modelReaderWriterOptionsType = typeof(ModelReaderWriterOptions);
        private static readonly CSharpType nullableModelReaderWriterOptionsType = new CSharpType(typeof(ModelReaderWriterOptions), isNullable: true);

        public static readonly ParameterProvider XmlWriter = new ParameterProvider("writer", FormattableStringHelpers.Empty, typeof(XmlWriter));
        public static readonly ParameterProvider NameHint = new ParameterProvider("nameHint", FormattableStringHelpers.Empty, typeof(string));
        public static readonly ParameterProvider XElement = new ParameterProvider("element", FormattableStringHelpers.Empty, typeof(XElement));

        public static readonly ParameterProvider Utf8JsonWriter = new ParameterProvider("writer", FormattableStringHelpers.Empty, typeof(Utf8JsonWriter));
        public static readonly ParameterProvider Utf8JsonReader = new ParameterProvider("reader", FormattableStringHelpers.Empty, typeof(Utf8JsonReader), isRef: true);
        public static readonly ParameterProvider JsonOptions = new ParameterProvider("options", FormattableStringHelpers.Empty, typeof(JsonSerializerOptions));
        public static readonly ParameterProvider Options = new ParameterProvider("options", FormattableStringHelpers.Empty, modelReaderWriterOptionsType);
        public static readonly ParameterProvider OptionalOptions = new ParameterProvider("options", FormattableStringHelpers.Empty, nullableModelReaderWriterOptionsType, DefaultOf(nullableModelReaderWriterOptionsType));
        public static readonly ParameterProvider JsonElement = new ParameterProvider("element", FormattableStringHelpers.Empty, typeof(JsonElement));
        public static readonly ParameterProvider Data = new ParameterProvider("data", FormattableStringHelpers.Empty, typeof(BinaryData));

        private static ParameterProvider? _tokenAuth;
        public static ParameterProvider TokenAuth => _tokenAuth ??= new("tokenCredential", $"The token credential to copy", ((ScmTypeFactory)CodeModelPlugin.Instance.TypeFactory).TokenCredentialType());

        private static ParameterProvider? _matchConditionsParameter;
        public static ParameterProvider MatchConditionsParameter => _matchConditionsParameter ??= new("matchConditions", $"The content to send as the request conditions of the request.", ((ScmTypeFactory)CodeModelPlugin.Instance.TypeFactory).MatchConditionsType(), Snippet.DefaultOf(((ScmTypeFactory)CodeModelPlugin.Instance.TypeFactory).RequestConditionsType()));

        private static ParameterProvider? _requestConditionsParameter;
        public static ParameterProvider RequestConditionsParameter => _requestConditionsParameter ??= new("requestConditions", $"The content to send as the request conditions of the request.", ((ScmTypeFactory)CodeModelPlugin.Instance.TypeFactory).RequestConditionsType(), Snippet.DefaultOf(((ScmTypeFactory)CodeModelPlugin.Instance.TypeFactory).RequestConditionsType()));
    }
}
