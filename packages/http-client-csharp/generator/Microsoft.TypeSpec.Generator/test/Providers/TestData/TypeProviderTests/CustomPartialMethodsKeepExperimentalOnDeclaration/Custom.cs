// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Diagnostics.CodeAnalysis;

namespace Test
{
    public partial class CustomPartialMethodType
    {
        [Experimental("CUSTOM001")]
        public partial int Preview();

        [Experimental("CUSTOM001")]
        [Obsolete("Custom message")]
        public partial int Combined();

        public partial int Current();
    }
}
