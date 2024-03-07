// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Azure;
using Azure.Core;
using Azure.Core.Pipeline;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    internal class FailureInjectingTransport : HttpPipelineTransport
    {
        private const string IsFailureInjectedProperty = "isFailureInjected";
        private readonly HttpClientTransport _transport;

        public FailureInjectingTransport(HttpClientTransport transport)
        {
            _transport = transport;
        }

        public override void Process(HttpMessage message)
        {
            if (message.TryGetProperty(IsFailureInjectedProperty, out _))
            {
                _transport.Process(message);
            }
            else
            {
                InjectFailure(message);
            }
        }

        public override async ValueTask ProcessAsync(HttpMessage message)
        {
            if (message.TryGetProperty(IsFailureInjectedProperty, out _))
            {
                await _transport.ProcessAsync(message);
            }
            else
            {
                InjectFailure(message);
            }
        }

        private void InjectFailure(HttpMessage message)
        {
            message.Response = new FailedResponse();
            message.SetProperty(IsFailureInjectedProperty, true);
        }

        public override Request CreateRequest()
        {
            return _transport.CreateRequest();
        }

        private class FailedResponse: Response
        {
            public override void Dispose()
            {
            }

            protected override bool TryGetHeader(string name, out string? value)
            {
                value = null;
                return false;
            }

            protected override bool TryGetHeaderValues(string name, out IEnumerable<string>? values)
            {
                values = null;
                return false;
            }

            protected override bool ContainsHeader(string name)
            {
                return false;
            }

            protected override IEnumerable<HttpHeader> EnumerateHeaders()
            {
                yield break;
            }

            public override int Status { get; } = 503;
            public override string ReasonPhrase { get; } = "Failed";
            public override Stream? ContentStream { get; set; }
            public override string ClientRequestId { get; set; } = "Failed";
        }
    }
}
