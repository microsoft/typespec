// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.ClientModel
{
    /// <summary>
    /// This class contains the method kinds for the system C# methods. See <see cref="CSharpMethodKinds"/> .
    /// </summary>
    internal static class SystemCSharpMethodKinds
    {
        internal static readonly string JsonModelSerializationWrite = "JsonModelSerializationWrite";
        internal static readonly string JsonModelDeserializationCreate = "JsonModelDeserializationCreate";
        internal static readonly string IModelDeserializationCreate = "IModelDeserialization";
        internal static readonly string IModelSerializationWrite = "IModelSerialization";
        internal static readonly string IModelGetFormat = "IModelGetFormat";
    }
}
