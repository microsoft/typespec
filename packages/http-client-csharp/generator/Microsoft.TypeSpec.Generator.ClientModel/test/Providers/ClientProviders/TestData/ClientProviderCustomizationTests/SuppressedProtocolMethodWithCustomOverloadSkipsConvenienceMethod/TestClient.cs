// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading.Tasks;
using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample
{
    [CodeGenSuppress("HelloAgain", typeof(RequestOptions))]
    [CodeGenSuppress("HelloAgainAsync", typeof(RequestOptions))]
    public partial class TestClient
    {
        public virtual ClientResult HelloAgain(string extra, RequestOptions options)
        {

        }

        public virtual Task<ClientResult> HelloAgainAsync(string extra, RequestOptions options)
        {

        }
    }
}
