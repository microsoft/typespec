// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.AutoRest.Communication.Serialization.Models
{
    internal class Position : IPosition
    {
        // 1-based
        public int Line { get; set; }
        // 0-based
        public int Column { get; set; }

        public override string ToString() => $@"{{""line"":{Line},""column"":{Column}}}";
    }
}
