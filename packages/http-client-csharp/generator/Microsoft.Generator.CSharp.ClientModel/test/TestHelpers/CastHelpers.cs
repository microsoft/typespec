// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.Reflection;

namespace Microsoft.Generator.CSharp.ClientModel.Tests
{
    internal static class CastHelpers
    {
        public static T FromResponse<T>(ClientResult result)
            => (T)typeof(T).GetMethod("FromResponse", BindingFlags.Instance | BindingFlags.Static)!.Invoke(null, [result])!;

        public static BinaryContent ToRequestContent<T>(T value)
            => (BinaryContent)typeof(T).GetMethod("ToRequestContent", BindingFlags.Instance | BindingFlags.Instance)!.Invoke(value, [])!;
    }
}
