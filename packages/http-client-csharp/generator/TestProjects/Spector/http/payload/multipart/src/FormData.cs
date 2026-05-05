// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System;
using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;
using Payload.MultiPart;

namespace Payload.MultiPart._FormData
{
    public partial class FormData
    {
        /// <summary> Test content-type: multipart/form-data. </summary>
        /// <param name="body"> The strongly-typed request body. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="body"/> is null. </exception>
        public virtual ClientResult Basic(MultiPartRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return Basic(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data. </summary>
        /// <param name="body"> The strongly-typed request body. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="body"/> is null. </exception>
        public virtual async Task<ClientResult> BasicAsync(MultiPartRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await BasicAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Test content-type: multipart/form-data with wire names. </summary>
        public virtual ClientResult WithWireName(MultiPartRequestWithWireName body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return WithWireName(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data with wire names. </summary>
        public virtual async Task<ClientResult> WithWireNameAsync(MultiPartRequestWithWireName body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await WithWireNameAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Test content-type: multipart/form-data with optional parts. </summary>
        public virtual ClientResult OptionalParts(MultiPartOptionalRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return OptionalParts(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data with optional parts. </summary>
        public virtual async Task<ClientResult> OptionalPartsAsync(MultiPartOptionalRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await OptionalPartsAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Test content-type: multipart/form-data for mixed scenarios. </summary>
        public virtual ClientResult FileArrayAndBasic(ComplexPartsRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return FileArrayAndBasic(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data for mixed scenarios. </summary>
        public virtual async Task<ClientResult> FileArrayAndBasicAsync(ComplexPartsRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await FileArrayAndBasicAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Test content-type: multipart/form-data with a JSON part and a binary part. </summary>
        public virtual ClientResult JsonPart(JsonPartRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return JsonPart(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data with a JSON part and a binary part. </summary>
        public virtual async Task<ClientResult> JsonPartAsync(JsonPartRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await JsonPartAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Test content-type: multipart/form-data with multiple binary parts. </summary>
        public virtual ClientResult BinaryArrayParts(BinaryArrayPartsRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return BinaryArrayParts(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data with multiple binary parts. </summary>
        public virtual async Task<ClientResult> BinaryArrayPartsAsync(BinaryArrayPartsRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await BinaryArrayPartsAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Test content-type: multipart/form-data with a single profile image and an optional picture. </summary>
        public virtual ClientResult MultiBinaryParts(MultiBinaryPartsRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return MultiBinaryParts(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data with a single profile image and an optional picture. </summary>
        public virtual async Task<ClientResult> MultiBinaryPartsAsync(MultiBinaryPartsRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await MultiBinaryPartsAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Test content-type: multipart/form-data; verifies file name and content type metadata. </summary>
        public virtual ClientResult CheckFileNameAndContentType(MultiPartRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return CheckFileNameAndContentType(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data; verifies file name and content type metadata. </summary>
        public virtual async Task<ClientResult> CheckFileNameAndContentTypeAsync(MultiPartRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await CheckFileNameAndContentTypeAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }

        /// <summary> Test content-type: multipart/form-data with an anonymous body. </summary>
        public virtual ClientResult AnonymousModel(AnonymousModelRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return AnonymousModel(content, content.MediaType, cancellationToken.ToRequestOptions());
        }

        /// <summary> Test content-type: multipart/form-data with an anonymous body. </summary>
        public virtual async Task<ClientResult> AnonymousModelAsync(AnonymousModelRequest body, CancellationToken cancellationToken = default)
        {
            Argument.AssertNotNull(body, nameof(body));

            using MultiPartFormContent content = body.ToMultipartContent();
            return await AnonymousModelAsync(content, content.MediaType, cancellationToken.ToRequestOptions()).ConfigureAwait(false);
        }
    }
}
