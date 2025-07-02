// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Input
{    /// <summary>
    /// Represents auth information.
    /// </summary>
    /// <summary>

    /// Gets the inputauth.

    /// </summary>

    public class InputAuth
    {        /// <summary>
        /// Initializes a new instance of the <see cref="InputAuth"/> class.
        /// </summary>
        public InputAuth(InputApiKeyAuth? apiKey, InputOAuth2Auth? oAuth2)
        {
            ApiKey = apiKey;
            OAuth2 = oAuth2;
        }        /// <summary>
        /// Initializes a new instance of the <see cref="InputAuth"/> class.
        /// </summary>
        /// <summary>

        /// Gets the apikey.

        /// </summary>

        public InputAuth() : this(null, null) { }        public InputApiKeyAuth? ApiKey { get; init; }        /// <summary>
        /// Gets the oauth2.
        /// </summary>
        public InputOAuth2Auth? OAuth2 { get; init; }
    }
}
