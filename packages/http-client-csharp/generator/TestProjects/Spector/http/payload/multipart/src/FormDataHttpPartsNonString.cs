// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Payload.MultiPart;

namespace Payload.MultiPart._FormData.HttpParts.NonString
{
    public partial class FormDataHttpPartsNonString
    {
        /// <summary> Test content-type: multipart/form-data with a non-string (float) part. </summary>
        public virtual ClientResult Float(FloatRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return Float(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data with a non-string (float) part. </summary>
        public virtual async Task<ClientResult> FloatAsync(FloatRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await FloatAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }
    }
}
