// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public abstract class FirstBase { }
    internal class UnknownLegacy : FirstBase { }
}

namespace Other.Models
{
    public abstract class SecondBase { }
    internal class UnknownLegacy : SecondBase { }
}
