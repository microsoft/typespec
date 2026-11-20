// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Test
{
    public partial class CustomPartialConstructorType
    {
        public partial CustomPartialConstructorType(string bicepIdentifier, string resourceVersion = null);

        protected partial CustomPartialConstructorType();
    }
}
