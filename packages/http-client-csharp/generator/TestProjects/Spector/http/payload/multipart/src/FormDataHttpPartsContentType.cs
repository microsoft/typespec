// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Payload.MultiPart;

namespace Payload.MultiPart._FormData.HttpParts.ContentType
{
    public partial class FormDataHttpPartsContentType
    {
        /// <summary> Test content-type: multipart/form-data with a specific image/jpg part. </summary>
        public virtual ClientResult ImageJpegContentType(FileWithHttpPartSpecificContentTypeRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return ImageJpegContentType(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data with a specific image/jpg part. </summary>
        public virtual async Task<ClientResult> ImageJpegContentTypeAsync(FileWithHttpPartSpecificContentTypeRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await ImageJpegContentTypeAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Test content-type: multipart/form-data; the part requires a content type. </summary>
        public virtual ClientResult RequiredContentType(FileWithHttpPartRequiredContentTypeRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return RequiredContentType(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data; the part requires a content type. </summary>
        public virtual async Task<ClientResult> RequiredContentTypeAsync(FileWithHttpPartRequiredContentTypeRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await RequiredContentTypeAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Test content-type: multipart/form-data with optional content type on the part. </summary>
        public virtual ClientResult OptionalContentType(FileWithHttpPartOptionalContentTypeRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return OptionalContentType(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data with optional content type on the part. </summary>
        public virtual async Task<ClientResult> OptionalContentTypeAsync(FileWithHttpPartOptionalContentTypeRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await OptionalContentTypeAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }
    }
}
