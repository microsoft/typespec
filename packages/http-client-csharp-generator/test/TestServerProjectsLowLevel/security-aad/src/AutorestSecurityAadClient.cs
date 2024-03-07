// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Azure.Core;
using Azure.Core.Pipeline;

namespace security_aad_LowLevel
{
    /// <summary>
    /// An autorest security aad client.
    /// </summary>
    public partial class AutorestSecurityAadClient
    {
        /// <summary>
        /// Gets the TokenScopes.
        /// </summary>
        public static string[] TokenScopes => AuthorizationScopes;
    }
}
