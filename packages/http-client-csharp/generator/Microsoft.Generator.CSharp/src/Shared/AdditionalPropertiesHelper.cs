// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;
using System.Text.Json;

namespace Microsoft.Generator.CSharp
{
    internal static class AdditionalPropertiesHelper
    {
        public const string AdditionalBinaryDataPropsFieldName = "_additionalBinaryDataProperties";
        public const string DefaultAdditionalPropertiesPropertyName = "AdditionalProperties";
        /// <summary>
        /// The set of known verifiable additional property value types that have <see cref="JsonValueKind"/> checks
        /// during deserialization.
        /// </summary>
        public static readonly HashSet<Type> VerifiableAdditionalPropertyTypes =
        [
            typeof(byte), typeof(byte[]), typeof(sbyte),
            typeof(DateTime), typeof(DateTimeOffset),
            typeof(decimal), typeof(double), typeof(short), typeof(int), typeof(long), typeof(float),
            typeof(ushort), typeof(uint), typeof(ulong),
            typeof(Guid),
            typeof(string), typeof(bool)
        ];
    }
}
