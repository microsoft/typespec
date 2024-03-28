// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace AutoRest.CSharp.Common.Input;

internal record InputAuth(InputApiKeyAuth? ApiKey, InputOAuth2Auth? OAuth2)
{
    public InputAuth() : this(null, null) { }
}
