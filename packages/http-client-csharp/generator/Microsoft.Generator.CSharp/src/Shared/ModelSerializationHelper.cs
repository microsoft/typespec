// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections.Generic;

namespace Microsoft.Generator.CSharp
{
    internal static class ModelSerializationHelper
    {
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
