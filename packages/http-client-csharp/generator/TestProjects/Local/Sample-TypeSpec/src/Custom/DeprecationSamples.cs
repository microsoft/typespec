// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;

namespace SampleTypeSpec
{
    public partial class DeprecationSamples
    {
        [Obsolete("Use the convenience overload instead.", DiagnosticId = "OBS001")]
        public partial ClientResult Read(RequestOptions options);

        [Obsolete("Use the convenience overload instead.", DiagnosticId = "OBS002")]
        public partial Task<ClientResult> ReadAsync(RequestOptions options);
    }
}
