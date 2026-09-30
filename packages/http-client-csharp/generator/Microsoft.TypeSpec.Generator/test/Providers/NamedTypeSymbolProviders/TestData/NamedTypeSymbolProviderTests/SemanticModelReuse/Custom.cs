// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample
{
    public class First
    {
        public int Value { get; } = 6 * 7;
        public Second Create() => new Second();

        public class Nested
        {
            public Second Item { get; }
        }
    }

    public class Second
    {
    }
}
