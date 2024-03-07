// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.ClientModel.Primitives;
using System.Text.Json;
using System.Xml;
using System.Xml.Linq;
using AutoRest.CSharp.Generation.Types;

namespace AutoRest.CSharp.Output.Models.Shared
{
    internal static partial class KnownParameters
    {
        public static class Serializations
        {
            private static readonly CSharpType modelReaderWriterOptionsType = typeof(ModelReaderWriterOptions);
            private static readonly CSharpType nullableModelReaderWriterOptionsType = new CSharpType(typeof(ModelReaderWriterOptions), isNullable: true);

            public static readonly Parameter XmlWriter = new Parameter("writer", null, typeof(XmlWriter), null, ValidationType.None, null);
            public static readonly Parameter NameHint = new Parameter("nameHint", null, typeof(string), null, ValidationType.None, null);
            public static readonly Parameter XElement = new Parameter("element", null, typeof(XElement), null, ValidationType.None, null);

            public static readonly Parameter Utf8JsonWriter = new Parameter("writer", null, typeof(Utf8JsonWriter), null, ValidationType.None, null);
            public static readonly Parameter Utf8JsonReader = new Parameter("reader", null, typeof(Utf8JsonReader), null, ValidationType.None, null, IsRef: true);
            public static readonly Parameter Options = new Parameter("options", null, modelReaderWriterOptionsType, null, ValidationType.None, null);
            public static readonly Parameter OptionalOptions = new Parameter("options", null, nullableModelReaderWriterOptionsType, Constant.Default(nullableModelReaderWriterOptionsType), ValidationType.None, null);
            public static readonly Parameter JsonElement = new Parameter("element", null, typeof(JsonElement), null, ValidationType.None, null);
            public static readonly Parameter Data = new Parameter("data", null, typeof(BinaryData), null, ValidationType.None, null);
        }
    }
}
