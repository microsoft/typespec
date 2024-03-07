// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using AutoRest.CSharp.Output.Models.Requests;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class ObjectPropertyInitializer
    {
        public ObjectPropertyInitializer(ObjectTypeProperty property, ReferenceOrConstant value, ReferenceOrConstant? defaultValue = null)
        {
            Property = property;
            Value = value;
            DefaultValue = defaultValue;
        }

        public ObjectTypeProperty Property { get; }
        public ReferenceOrConstant Value { get; }
        public ReferenceOrConstant? DefaultValue { get; }
    }
}
