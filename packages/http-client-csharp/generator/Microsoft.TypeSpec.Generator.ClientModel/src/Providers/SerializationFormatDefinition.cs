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

        protected override TypeSignatureModifiers BuildDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal | TypeSignatureModifiers.Enum;
        }

        protected override string BuildRelativeFilePath() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override string BuildName() => "SerializationFormat";

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
