// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Azure.Core;
using Azure.Core.Pipeline;

namespace AutoRest.TestServer.Tests.Infrastructure
{
    public class CustomClientRequestIdPolicy : HttpPipelineSynchronousPolicy
    {
        public CustomClientRequestIdPolicy()
        {
        }

        public override void OnSendingRequest(HttpMessage message)
        {
            base.OnSendingRequest(message);

            if (ClientRequestIdScope.CurrentClientRequestId != null)
            {
                message.Request.ClientRequestId = ClientRequestIdScope.CurrentClientRequestId;
            }
        }
    }
}
