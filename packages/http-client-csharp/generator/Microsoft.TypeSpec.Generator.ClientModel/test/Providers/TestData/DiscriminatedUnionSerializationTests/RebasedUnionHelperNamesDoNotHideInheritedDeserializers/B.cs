// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public partial class B : A
    {
    }

    public class CustomBridge : A
    {
    }

    public partial class C : CustomBridge
    {
    }
}
