// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Payload.MultiPart;

namespace Payload.MultiPart._FormData.File
{
    public partial class FormDataFile
    {
        /// <summary> Upload a file with content type <c>image/png</c>. </summary>
        public virtual ClientResult UploadFileSpecificContentType(UploadFileSpecificContentTypeRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return UploadFileSpecificContentType(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Upload a file with content type <c>image/png</c>. </summary>
        public virtual async Task<ClientResult> UploadFileSpecificContentTypeAsync(UploadFileSpecificContentTypeRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await UploadFileSpecificContentTypeAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Upload a file that requires a filename. </summary>
        public virtual ClientResult UploadFileRequiredFilename(UploadFileRequiredFilenameRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return UploadFileRequiredFilename(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Upload a file that requires a filename. </summary>
        public virtual async Task<ClientResult> UploadFileRequiredFilenameAsync(UploadFileRequiredFilenameRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await UploadFileRequiredFilenameAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Upload an array of files. </summary>
        public virtual ClientResult UploadFileArray(UploadFileArrayRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return UploadFileArray(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Upload an array of files. </summary>
        public virtual async Task<ClientResult> UploadFileArrayAsync(UploadFileArrayRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await UploadFileArrayAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }
    }
}
