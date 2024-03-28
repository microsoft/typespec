// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Linq;
using System.Text.Json;
using AutoRest.CSharp.AutoRest.Communication.MessageHandling.Models;
using AutoRest.CSharp.Utilities;

namespace AutoRest.CSharp.AutoRest.Communication.MessageHandling
{
    internal delegate void IncomingRequestProcess(IncomingRequest request);
    internal delegate void IncomingResponseProcess(IncomingResponse request);

    internal class IncomingMessageHandler
    {
        private readonly PeekableBinaryStream _stream;
        private readonly IncomingRequestProcess _requestProcess;
        private readonly IncomingResponseProcess _responseProcess;

        public IncomingMessageHandler(PeekableBinaryStream stream, IncomingRequestProcess requestProcess, IncomingResponseProcess responseProcess)
        {
            _stream = stream;
            _requestProcess = requestProcess;
            _responseProcess = responseProcess;
        }

        public bool ProcessStream()
        {
            var currentByte = _stream.CurrentByte;
            if (currentByte == null) return false;

            if (currentByte.IsJsonBlock())
            {
                ProcessMessage(_stream.ReadJson());
                return true;
            }

            return ProcessHeaders();
        }

        private bool ProcessHeaders()
        {
            var headers = _stream.ReadAllAsciiLines(l => !l.IsNullOrWhiteSpace()).Select(l =>
            {
                var parts = l!.Split(":", 2).Select(p => p.Trim()).ToArray();
                return (Key: parts[0], Value: parts[1]);
            }).ToDictionary(h => h.Key, h => h.Value);

            // After the headers are read, the next byte should be the content block.
            if (_stream.CurrentByte.IsJsonBlock() && headers.TryGetValue("Content-Length", out var value) && Int32.TryParse(value, out var contentLength))
            {
                ProcessMessage(_stream.ReadJson(contentLength));
                return true;
            }
            return false;
        }

        // Determines if the incoming message is a request or a response.
        private void ProcessMessage(JsonElement? element)
        {
            if (element == null || element.Value.ValueKind != JsonValueKind.Object) return;

            var properties = element.Value.EnumerateObject().Select(p => (JsonProperty?)p).ToArray();
            var id = properties.GetPropertyOrNull("id")?.Value.ToString();
            var method = properties.GetPropertyOrNull("method")?.Value.GetString();
            if (!method.IsNullOrEmpty())
            {
                var parameters = properties.GetPropertyOrNull("params")?.Value;
                var request = new IncomingRequest { Id = id, Method = method, Params = parameters };
                _requestProcess(request);
                return;
            }

            var result = properties.GetPropertyOrNull("result")?.Value.GetRawText();
            if (!result.IsNullOrEmpty())
            {
                var response = new IncomingResponse { Id = id, Result = result };
                _responseProcess(response);
            }
        }
    }
}
