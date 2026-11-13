// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample
{
    public partial class WithPartial
    {
        public partial WithPartial();

        public WithPartial(string value) { }

        public partial WithPartial(int value) { }

        public partial WithPartial(bool value) => _ = value;
    }
}
