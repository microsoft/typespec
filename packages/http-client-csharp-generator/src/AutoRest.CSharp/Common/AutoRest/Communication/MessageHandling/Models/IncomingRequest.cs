// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System.Text.Json;

namespace AutoRest.CSharp.AutoRest.Communication.MessageHandling.Models
{
    internal class IncomingRequest
    {
        public string JsonRpc { get; } = "2.0";
        public string? Method { get; set; }
        public JsonElement? Params { get; set; }
        public string? Id { get; set; }
    }
}
