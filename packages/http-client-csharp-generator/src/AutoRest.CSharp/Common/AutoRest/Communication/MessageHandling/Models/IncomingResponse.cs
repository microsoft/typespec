// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

namespace AutoRest.CSharp.AutoRest.Communication.MessageHandling.Models
{
    internal class IncomingResponse
    {
        public string JsonRpc { get; } = "2.0";
        public string? Result { get; set; }
        public string? Id { get; set; }
    }
}
