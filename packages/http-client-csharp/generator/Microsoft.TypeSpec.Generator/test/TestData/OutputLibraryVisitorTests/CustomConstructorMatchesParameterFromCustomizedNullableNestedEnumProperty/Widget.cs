// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample.Models;

public class Outer
{
    public enum Kind { A }
}

public partial class Widget
{
    public Outer.Kind? Kind { get; set; }
    public Widget(Outer.Kind? kind) { Kind = kind; }
}
