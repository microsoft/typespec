// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Diagnostics.CodeAnalysis;
using System.Threading.Tasks;

namespace Sample
{
    public partial class TestClient
    {
        [Obsolete("Unrelated overload.", DiagnosticId = "OTHER001")]
        public ClientResult Current(int value) => throw new NotSupportedException();

        [Obsolete("Use Current instead.", DiagnosticId = "OBS001")]
        public partial ClientResult Custom(RequestOptions customOptions);

        [Obsolete("Use CurrentAsync instead.", DiagnosticId = "OBS002")]
        public partial Task<ClientResult> CustomAsync(RequestOptions customOptions);

        [Obsolete]
        public partial ClientResult WithoutMessage(RequestOptions customOptions);

        [Obsolete]
        public partial Task<ClientResult> WithoutMessageAsync(RequestOptions customOptions);

        [Experimental("EXP001")]
        public partial ClientResult Preview(RequestOptions customOptions);

        [Experimental("EXP002")]
        public partial Task<ClientResult> PreviewAsync(RequestOptions customOptions);

        [Experimental("EXP001")]
        [Obsolete("Use Current instead.", DiagnosticId = "OBS001")]
        public partial ClientResult Combined(RequestOptions customOptions);

        [Experimental("EXP002")]
        [Obsolete("Use CurrentAsync instead.", DiagnosticId = "OBS002")]
        public partial Task<ClientResult> CombinedAsync(RequestOptions customOptions);

        public partial ClientResult Current(RequestOptions customOptions);

        public partial Task<ClientResult> CurrentAsync(RequestOptions customOptions);
    }
}
