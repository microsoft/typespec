// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.TypeSpec.Generator.Primitives;
using Microsoft.TypeSpec.Generator.Providers;
using static Microsoft.TypeSpec.Generator.Snippets.Snippet;

namespace Microsoft.TypeSpec.Generator.ClientModel.Providers
{
    internal sealed class SerializationFormatDefinition : EnumProvider
    {
        public SerializationFormatDefinition() : base(null!)
        {
        }

        public const string Default = "Default";
        public const string DateTime_RFC1123 = "DateTime_RFC1123";
        public const string DateTime_RFC3339 = "DateTime_RFC3339";
        public const string DateTime_RFC7231 = "DateTime_RFC7231";
        public const string DateTime_ISO8601 = "DateTime_ISO8601";
        public const string DateTime_Unix = "DateTime_Unix";
        public const string Date_ISO8601 = "Date_ISO8601";
        public const string Duration_ISO8601 = "Duration_ISO8601";
        public const string Duration_Constant = "Duration_Constant";
        public const string Duration_Seconds = "Duration_Seconds";
        public const string Duration_Seconds_Float = "Duration_Seconds_Float";
        public const string Duration_Seconds_Double = "Duration_Seconds_Double";
        public const string Duration_Milliseconds = "Duration_Milliseconds";
        public const string Duration_Milliseconds_Float = "Duration_Milliseconds_Float";
        public const string Duration_Milliseconds_Double = "Duration_Milliseconds_Double";
        public const string Time_ISO8601 = "Time_ISO8601";
        public const string Bytes_Base64Url = "Bytes_Base64Url";
        public const string Bytes_Base64 = "Bytes_Base64";

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Enum;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "SerializationFormat";

        protected override TypeProvider[] BuildSerializationProviders() => [];

        protected override IReadOnlyList<EnumTypeMember> BuildEnumValues()
        {
            var enumValues = new List<(string Name, int Value)>
            {
                ("Default", 0),
                ("DateTime_RFC1123", 1),
                ("DateTime_RFC3339", 2),
                ("DateTime_RFC7231", 3),
                ("DateTime_ISO8601", 4),
                ("DateTime_Unix", 5),
                ("Date_ISO8601", 6),
                ("Duration_ISO8601", 7),
                ("Duration_Constant", 8),
                ("Duration_Seconds", 9),
                ("Duration_Seconds_Float", 10),
                ("Duration_Seconds_Double", 11),
                ("Duration_Milliseconds", 12),
                ("Duration_Milliseconds_Float", 13),
                ("Duration_Milliseconds_Double", 14),
                ("Time_ISO8601", 15),
                ("Bytes_Base64Url", 16),
                ("Bytes_Base64", 17),
            };

            var members = new EnumTypeMember[enumValues.Count];
            for (int i = 0; i < enumValues.Count; i++)
            {
                var (name, value) = (enumValues[i].Name, enumValues[i].Value);
                var field = new FieldProvider(
                    FieldModifiers.Public | FieldModifiers.Static,
                    EnumUnderlyingType,
                    name,
                    this,
                    $"{name}",
                    Int(value));
                members[i] = new EnumTypeMember(name, field, value);
            }

            return members;
        }

        protected override FieldProvider[] BuildFields()
            => EnumValues.Select(v => v.Field).ToArray();

        protected override CSharpType BuildEnumUnderlyingType() => new CSharpType(typeof(int));
    }
}
