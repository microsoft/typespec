// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using System.Reflection;
using System.Runtime.Serialization;

namespace AutoRest.CSharp.Utilities
{
    internal static class EnumExtensions
    {
        public static string? GetEnumMemberValue(this MemberInfo? memberInfo) => memberInfo?.GetCustomAttributes<EnumMemberAttribute>(true).Select(ema => ema.Value).FirstOrDefault();

        public static string? GetEnumMemberValue<T>(this T value)
            => value?.GetType().GetMember(Enum.GetName(value.GetType(), value) ?? String.Empty).FirstOrDefault()?.GetEnumMemberValue();
    }
}
