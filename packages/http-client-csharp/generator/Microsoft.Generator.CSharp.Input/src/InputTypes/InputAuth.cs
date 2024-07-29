// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Text.Json.Serialization;

namespace Microsoft.Generator.CSharp.Input
{
    public class InputAuth
    {
        [JsonConstructor]
        public InputAuth(InputApiKeyAuth? apiKey, InputOAuth2Auth? oAuth2)
        {
            ApiKey = apiKey;
            OAuth2 = oAuth2;
        }

        public InputAuth() : this(null, null) { }

        public InputApiKeyAuth? ApiKey { get; init; }
        public InputOAuth2Auth? OAuth2 { get; init; }
    }
}
