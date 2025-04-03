// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AutoRest.CSharp.Common.Input;

namespace Microsoft.TypeSpec.Generator.Input
{
    public static class TypeSpecSerialization
    {
        public static InputNamespace? Deserialize(string json)
        {
            var referenceHandler = new TypeSpecReferenceHandler();
            var options = new JsonSerializerOptions
            {
                ReferenceHandler = referenceHandler,
                AllowTrailingCommas = true,
                Converters =
                {
                    new TypeSpecInputNamespaceConverter(referenceHandler),
                    new JsonStringEnumConverter(JsonNamingPolicy.CamelCase),
                    new TypeSpecInputTypeConverter(referenceHandler),
                    new TypeSpecInputArrayTypeConverter(referenceHandler),
                    new TypeSpecInputDictionaryTypeConverter(referenceHandler),
                    new TypeSpecInputEnumTypeConverter(referenceHandler),
                    new TypeSpecInputEnumTypeValueConverter(referenceHandler),
                    new TypeSpecInputModelTypeConverter(referenceHandler),
                    new TypeSpecInputModelPropertyConverter(referenceHandler),
                    new TypeSpecInputConstantConverter(referenceHandler),
                    new TypeSpecInputLiteralTypeConverter(referenceHandler),
                    new TypeSpecInputUnionTypeConverter(referenceHandler),
                    new TypeSpecInputClientConverter(referenceHandler),
                    new TypeSpecInputOperationConverter(referenceHandler),
                    new TypeSpecInputNextLinkConverter(referenceHandler),
                    new TypeSpecInputContinuationTokenConverter(referenceHandler),
                    new TypeSpecInputParameterConverter(referenceHandler),
                    new TypeSpecInputPrimitiveTypeConverter(referenceHandler),
                    new TypeSpecOperationLongRunningConverter(referenceHandler),
                    new TypeSpecInputOperationPagingConverter(referenceHandler),
                    new TypeSpecInputOperationResponseConverter(referenceHandler),
                    new TypeSpecInputOperationResponseHeaderConverter(referenceHandler),
                    new TypeSpecInputDateTimeTypeConverter(referenceHandler),
                    new TypeSpecInputDurationTypeConverter(referenceHandler),
                    new TypeSpecInputAuthConverter(referenceHandler),
                    new TypeSpecInputApiKeyAuthConverter(referenceHandler),
                    new TypeSpecInputOAuth2AuthConverter(referenceHandler),
                    new TypeSpecInputDecoratorInfoConverter(referenceHandler),
                    new TypeSpecInputSerializationOptionsConverter(referenceHandler),
                    new TypeSpecInputJsonSerializationOptionsConverter(referenceHandler),
                    new TypeSpecInputXmlSerializationOptionsConverter(referenceHandler),
                    new TypeSpecInputXmlNamespaceOptionsConverter(referenceHandler),
                }
            };

            var inputNamespace = JsonSerializer.Deserialize<InputNamespace>(json, options);

            if (inputNamespace != null)
            {
                UpdateClientsName(inputNamespace, inputNamespace.Clients, new List<string>());
            }

            return inputNamespace;
        }

        private static void UpdateClientsName(InputNamespace inputNamespace, IReadOnlyList<InputClient> clients, List<string> parentNames)
        {
            foreach (var client in clients)
            {
                var cleanName = client.Name.ToCleanName();
                client.Name = BuildClientName(cleanName, parentNames);

                var lastSegment = GetLastSegment(client.Namespace);
                if (lastSegment == client.Name)
                {
                    // when the last segment is the same as the name of this client, we would have a namespace conflict.
                    // therefore here we add it into the list of invalid namespace segments, and later when we escape the namespace with invalid segments, we could give a warning.
                    inputNamespace.AddInvalidNamespaceSegment(lastSegment);
                }

                parentNames.Add(cleanName);
                UpdateClientsName(inputNamespace, client.Children, parentNames);
                parentNames.RemoveAt(parentNames.Count - 1);
            }
        }

        private static string BuildClientName(string name, List<string> parentNames)
        {
            if (parentNames.Count <= 1)
            {
                // toplevel client, and first level sub-client will keep its original name.
                return name;
            }

            // more deeper level client will prepend all their parents' name (except for the root) as the prefix of the client name to avoid client name conflict
            // such as we have client A.B.C and A.D.C, now the two subclient C will be named to BC and DC.
            var builder = new StringBuilder();
            foreach (var parentName in parentNames.Skip(1))
            {
                builder.Append(parentName);
            }
            builder.Append(name);
            return builder.ToString();
        }

        private static string GetLastSegment(string @namespace)
        {
            var span = @namespace.AsSpan();
            var index = span.LastIndexOf('.');
            if (index == -1)
            {
                return @namespace;
            }

            return span.Slice(index + 1).ToString();
        }
    }
}
