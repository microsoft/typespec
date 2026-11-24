// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Test;

public class Outer
{
    public enum Kind { A }
}

public partial class TestName
{
    public TestName(Outer.Kind? kind) { }
}
