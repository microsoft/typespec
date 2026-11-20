// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    [System.ClientModel.Primitives.PersistableModelProxy(typeof(UnknownLegacy))]
    public abstract class FirstBase { }

    internal class UnknownLegacy : FirstBase { }
}

namespace Other.Models
{
    [System.ClientModel.Primitives.PersistableModelProxy(typeof(UnknownLegacy))]
    public abstract class SecondBase { }

    internal class UnknownLegacy : SecondBase { }
}
