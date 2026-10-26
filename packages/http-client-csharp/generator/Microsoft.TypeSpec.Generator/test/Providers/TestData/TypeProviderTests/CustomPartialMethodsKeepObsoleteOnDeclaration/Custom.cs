// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Test
{
    public partial class CustomPartialMethodType
    {
        [Obsolete("Use \"Current\" instead.\nSee C:\\sdk.")]
        public partial int Legacy();

        [Obsolete]
        public partial int WithoutMessage();

        public partial int Current();
    }
}
