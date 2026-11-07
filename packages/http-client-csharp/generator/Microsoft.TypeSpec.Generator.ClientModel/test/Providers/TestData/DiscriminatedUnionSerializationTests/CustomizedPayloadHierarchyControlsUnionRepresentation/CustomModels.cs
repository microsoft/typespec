// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public partial class Cat : System.Exception {}
    public partial class Mammal : System.Exception {}
    public partial class GoodCat : Pet {}
    public class CustomBridge : Pet {}
    public partial class BridgeCat : CustomBridge {}
    public partial class RebasedCat : OtherPet {}
    public class BrokenBridge : Mammal {}
    public partial class BrokenBridgeCat : BrokenBridge {}
}
