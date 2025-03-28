// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Collections.Generic;

namespace UnbrandedTypeSpec
{
    /// <summary>
    /// Demonstrates creating a custom client constructor to enable OAuth authentication.
    /// </summary>
    public partial class SampleTypeSpecClient
    {
        // If generated, flows would come from the service level OAuth2 flow definitions as shown in the Oauth2 Scopes section of this: https://typespec.io/docs/libraries/http/authentication/
        private readonly Dictionary<string, object>[] flows = [
            new Dictionary<string, object> {
                { GetTokenOptions.ScopesPropertyName, new string[] { "defaultScope" } },
                { GetTokenOptions.TokenUrlPropertyName , "https://myauthserver.com/token"},
                { GetTokenOptions.RefreshUrlPropertyName, "https://myauthserver.com/refresh"}
            }
        ];

        /// <summary>
        /// Initializes a new instance of the <see cref="SampleTypeSpecClient"/> class.
        /// </summary>
        /// <param name="uri">The URI of the service.</param>
        /// <param name="authTokenProvider">The authentication token provider.</param>
        public SampleTypeSpecClient(Uri uri, AuthenticationTokenProvider authTokenProvider)
        {
            var options = new ClientPipelineOptions();
            Pipeline = ClientPipeline.Create(options,
            perCallPolicies: ReadOnlySpan<PipelinePolicy>.Empty,
            perTryPolicies: [new OAuth2BearerTokenAuthenticationPolicy(authTokenProvider, flows)],
            beforeTransportPolicies: ReadOnlySpan<PipelinePolicy>.Empty);
        }

        /// <summary>
        /// [Protocol Method] Return bye
        /// <item>
        /// <description> This <see href="https://aka.ms/azsdk/net/protocol-methods">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios. </description>
        /// </item>
        /// </summary>
        /// <param name="options"> The request options, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ClientResultException"> Service returned a non-success status code. </exception>
        /// <returns> The response returned from the service. </returns>
        public virtual ClientResult SayBye(RequestOptions options)
        {
            using PipelineMessage message = CreateSayByeRequest(options);
            return ClientResult.FromResponse(Pipeline.ProcessMessage(message, options));
        }

        internal PipelineMessage CreateSayByeRequest(RequestOptions options)
        {
            PipelineMessage message = Pipeline.CreateMessage();
            message.ResponseClassifier = PipelineMessageClassifier200;
            PipelineRequest request = message.Request;
            request.Method = "GET";
            ClientUriBuilder uri = new ClientUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendPath("/bye", false);
            request.Headers.Set("Accept", "application/json");
            message.Apply(options);
            return message;
        }
    }
}
