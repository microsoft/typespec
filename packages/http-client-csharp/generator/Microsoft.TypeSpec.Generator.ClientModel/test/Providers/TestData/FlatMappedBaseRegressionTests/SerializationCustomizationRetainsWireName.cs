// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    [System.AttributeUsage(System.AttributeTargets.Class, AllowMultiple = true)]
    internal sealed class CodeGenSerializationAttribute : System.Attribute
    {
        public CodeGenSerializationAttribute(string propertyName, string serializationName) { }
    }
    [CodeGenSerialization("__PROPERTY_NAME__", "__WIRE_NAME__")]
    public partial class DerivedModel { }
}
