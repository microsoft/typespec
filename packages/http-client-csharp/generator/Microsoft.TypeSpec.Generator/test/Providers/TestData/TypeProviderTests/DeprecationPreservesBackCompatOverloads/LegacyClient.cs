// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Sample
{
    public class LegacyClient
    {
        public void Read(int value) { }

        public string Reorder(string name, int value) => null;
    }

    public class ObsoleteClient
    {
        [System.Obsolete("Previous message")]
        public void Read(int value) { }
    }
}
