// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.AutoRest.Communication.Serialization.Models
{
    internal class SourceLocation
    {
        public string? Document { get; set; }
        public IPosition? Position { get; set; }

        public override string ToString() => $@"{{""document"":""{Document}"",""Position"":{Position}}}";
    }
}
