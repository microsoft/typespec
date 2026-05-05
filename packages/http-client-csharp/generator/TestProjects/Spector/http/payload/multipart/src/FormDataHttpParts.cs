// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Payload.MultiPart;

namespace Payload.MultiPart._FormData.HttpParts
{
    public partial class FormDataHttpParts
    {
        /// <summary> Test content-type: multipart/form-data for mixed scenarios. </summary>
        public virtual ClientResult JsonArrayAndFileArray(ComplexHttpPartsModelRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return JsonArrayAndFileArray(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data for mixed scenarios. </summary>
        public virtual async Task<ClientResult> JsonArrayAndFileArrayAsync(ComplexHttpPartsModelRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await JsonArrayAndFileArrayAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }
    }
}
