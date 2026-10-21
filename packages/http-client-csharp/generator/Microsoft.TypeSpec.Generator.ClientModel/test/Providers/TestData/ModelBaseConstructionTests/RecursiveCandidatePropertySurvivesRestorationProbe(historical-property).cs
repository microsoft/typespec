// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models
{
    public class PreviousBase { public DerivedModel Derived { get; set; } }
    public class DerivedModel : PreviousBase { }
}
