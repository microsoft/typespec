// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Test
{
    [CodeGenSuppress("CustomPartialConstructorType", typeof(double))]
    public partial class CustomPartialConstructorType
    {
        public partial CustomPartialConstructorType(string value, string version);

        public CustomPartialConstructorType(int value) { }

        public partial CustomPartialConstructorType(bool value) { }
    }
}
