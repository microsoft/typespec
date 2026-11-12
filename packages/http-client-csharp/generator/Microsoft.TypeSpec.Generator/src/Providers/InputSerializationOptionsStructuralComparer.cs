// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using Microsoft.TypeSpec.Generator.Input;

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Compares property serialization metadata that affects generated wire behavior.
    /// </summary>
    internal static class InputSerializationOptionsStructuralComparer
    {
        public static bool Equals(InputSerializationOptions? current, InputSerializationOptions? mapped)
            => JsonEquals(current?.Json, mapped?.Json) &&
                XmlEquals(current?.Xml, mapped?.Xml) &&
                MultipartEquals(current?.Multipart, mapped?.Multipart) &&
                BinaryEquals(current?.Binary, mapped?.Binary);

        private static bool JsonEquals(
            InputJsonSerializationOptions? current,
            InputJsonSerializationOptions? mapped)
            => current is null
                ? mapped is null
                : mapped is not null && current.Name == mapped.Name;

        private static bool XmlEquals(
            InputXmlSerializationOptions? current,
            InputXmlSerializationOptions? mapped)
            => current is null
                ? mapped is null
                : mapped is not null &&
                    current.Name == mapped.Name &&
                    current.Attribute == mapped.Attribute &&
                    XmlNamespaceEquals(current.Namespace, mapped.Namespace) &&
                    current.Unwrapped == mapped.Unwrapped &&
                    current.ItemsName == mapped.ItemsName &&
                    XmlNamespaceEquals(current.ItemsNamespace, mapped.ItemsNamespace);

        private static bool XmlNamespaceEquals(
            InputXmlNamespaceOptions? current,
            InputXmlNamespaceOptions? mapped)
            => current is null
                ? mapped is null
                : mapped is not null &&
                    current.Namespace == mapped.Namespace &&
                    current.Prefix == mapped.Prefix;

        private static bool MultipartEquals(
            InputMultipartOptions? current,
            InputMultipartOptions? mapped)
            => current is null
                ? mapped is null
                : mapped is not null &&
                    current.Name == mapped.Name &&
                    current.IsFilePart == mapped.IsFilePart &&
                    current.IsMulti == mapped.IsMulti &&
                    current.DefaultContentTypes.SequenceEqual(mapped.DefaultContentTypes) &&
                    ReferencedPropertyEquals(current.Filename, mapped.Filename) &&
                    ReferencedPropertyEquals(current.ContentType, mapped.ContentType);

        private static bool BinaryEquals(
            InputBinarySerializationOptions? current,
            InputBinarySerializationOptions? mapped)
            => current is null
                ? mapped is null
                : mapped is not null &&
                    current.IsFile == mapped.IsFile &&
                    current.IsText == mapped.IsText &&
                    OptionalSequenceEquals(current.ContentTypes, mapped.ContentTypes) &&
                    ReferencedPropertyEquals(current.Filename, mapped.Filename);

        private static bool ReferencedPropertyEquals(
            InputModelProperty? current,
            InputModelProperty? mapped)
            => current is null
                ? mapped is null
                : mapped is not null &&
                    current.Name == mapped.Name &&
                    current.SerializedName == mapped.SerializedName &&
                    current.IsRequired == mapped.IsRequired &&
                    current.IsReadOnly == mapped.IsReadOnly &&
                    current.IsHttpMetadata == mapped.IsHttpMetadata &&
                    current.IsDiscriminator == mapped.IsDiscriminator &&
                    current.Encode == mapped.Encode &&
                    InputTypeStructuralComparer.Equals(current.Type, mapped.Type);

        private static bool OptionalSequenceEquals<T>(
            IReadOnlyList<T>? current,
            IReadOnlyList<T>? mapped)
            => current is null
                ? mapped is null
                : mapped is not null && current.SequenceEqual(mapped);
    }
}
