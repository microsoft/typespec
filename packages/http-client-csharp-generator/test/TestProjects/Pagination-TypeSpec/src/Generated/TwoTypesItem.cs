// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using System;
using System.Threading;
using Autorest.CSharp.Core;
using Azure;
using Azure.Core;
using Azure.Core.Pipeline;
using Pagination.Models;

namespace Pagination
{
    // Data plane generated sub-client.
    /// <summary> The TwoTypesItem sub-client. </summary>
    public partial class TwoTypesItem
    {
        private static readonly string[] AuthorizationScopes = new string[] { "https://pagination.azure.com/.default" };
        private readonly TokenCredential _tokenCredential;
        private readonly HttpPipeline _pipeline;
        private readonly Uri _endpoint;
        private readonly string _apiVersion;

        /// <summary> The ClientDiagnostics is used to provide tracing support for the client library. </summary>
        internal ClientDiagnostics ClientDiagnostics { get; }

        /// <summary> The HTTP pipeline for sending and receiving REST requests and responses. </summary>
        public virtual HttpPipeline Pipeline => _pipeline;

        /// <summary> Initializes a new instance of TwoTypesItem for mocking. </summary>
        protected TwoTypesItem()
        {
        }

        /// <summary> Initializes a new instance of TwoTypesItem. </summary>
        /// <param name="clientDiagnostics"> The handler for diagnostic messaging in the client. </param>
        /// <param name="pipeline"> The HTTP pipeline for sending and receiving REST requests and responses. </param>
        /// <param name="tokenCredential"> The token credential to copy. </param>
        /// <param name="endpoint"> The <see cref="Uri"/> to use. </param>
        /// <param name="apiVersion"> The API version to use for this operation. </param>
        internal TwoTypesItem(ClientDiagnostics clientDiagnostics, HttpPipeline pipeline, TokenCredential tokenCredential, Uri endpoint, string apiVersion)
        {
            ClientDiagnostics = clientDiagnostics;
            _pipeline = pipeline;
            _tokenCredential = tokenCredential;
            _endpoint = endpoint;
            _apiVersion = apiVersion;
        }

        /// <summary> Get All Text Blocklists. </summary>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <remarks> Get all text blocklists details. </remarks>
        /// <include file="Docs/TwoTypesItem.xml" path="doc/members/member[@name='GetTextBlocklistsAsync(CancellationToken)']/*" />
        public virtual AsyncPageable<TextBlocklist> GetTextBlocklistsAsync(CancellationToken cancellationToken = default)
        {
            RequestContext context = cancellationToken.CanBeCanceled ? new RequestContext { CancellationToken = cancellationToken } : null;
            HttpMessage FirstPageRequest(int? pageSizeHint) => CreateGetTextBlocklistsRequest(context);
            HttpMessage NextPageRequest(int? pageSizeHint, string nextLink) => CreateGetTextBlocklistsNextPageRequest(nextLink, context);
            return GeneratorPageableHelpers.CreateAsyncPageable(FirstPageRequest, NextPageRequest, e => TextBlocklist.DeserializeTextBlocklist(e), ClientDiagnostics, _pipeline, "TwoTypesItem.GetTextBlocklists", "value", "nextLink", context);
        }

        /// <summary> Get All Text Blocklists. </summary>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <remarks> Get all text blocklists details. </remarks>
        /// <include file="Docs/TwoTypesItem.xml" path="doc/members/member[@name='GetTextBlocklists(CancellationToken)']/*" />
        public virtual Pageable<TextBlocklist> GetTextBlocklists(CancellationToken cancellationToken = default)
        {
            RequestContext context = cancellationToken.CanBeCanceled ? new RequestContext { CancellationToken = cancellationToken } : null;
            HttpMessage FirstPageRequest(int? pageSizeHint) => CreateGetTextBlocklistsRequest(context);
            HttpMessage NextPageRequest(int? pageSizeHint, string nextLink) => CreateGetTextBlocklistsNextPageRequest(nextLink, context);
            return GeneratorPageableHelpers.CreatePageable(FirstPageRequest, NextPageRequest, e => TextBlocklist.DeserializeTextBlocklist(e), ClientDiagnostics, _pipeline, "TwoTypesItem.GetTextBlocklists", "value", "nextLink", context);
        }

        /// <summary>
        /// [Protocol Method] Get All Text Blocklists
        /// <list type="bullet">
        /// <item>
        /// <description>
        /// This <see href="https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/samples/ProtocolMethods.md">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios.
        /// </description>
        /// </item>
        /// <item>
        /// <description>
        /// Please try the simpler <see cref="GetTextBlocklistsAsync(CancellationToken)"/> convenience overload with strongly typed models first.
        /// </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="context"> The request context, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="RequestFailedException"> Service returned a non-success status code. </exception>
        /// <returns> The <see cref="AsyncPageable{T}"/> from the service containing a list of <see cref="BinaryData"/> objects. Details of the body schema for each item in the collection are in the Remarks section below. </returns>
        /// <include file="Docs/TwoTypesItem.xml" path="doc/members/member[@name='GetTextBlocklistsAsync(RequestContext)']/*" />
        public virtual AsyncPageable<BinaryData> GetTextBlocklistsAsync(RequestContext context)
        {
            HttpMessage FirstPageRequest(int? pageSizeHint) => CreateGetTextBlocklistsRequest(context);
            HttpMessage NextPageRequest(int? pageSizeHint, string nextLink) => CreateGetTextBlocklistsNextPageRequest(nextLink, context);
            return GeneratorPageableHelpers.CreateAsyncPageable(FirstPageRequest, NextPageRequest, e => BinaryData.FromString(e.GetRawText()), ClientDiagnostics, _pipeline, "TwoTypesItem.GetTextBlocklists", "value", "nextLink", context);
        }

        /// <summary>
        /// [Protocol Method] Get All Text Blocklists
        /// <list type="bullet">
        /// <item>
        /// <description>
        /// This <see href="https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/samples/ProtocolMethods.md">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios.
        /// </description>
        /// </item>
        /// <item>
        /// <description>
        /// Please try the simpler <see cref="GetTextBlocklists(CancellationToken)"/> convenience overload with strongly typed models first.
        /// </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="context"> The request context, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="RequestFailedException"> Service returned a non-success status code. </exception>
        /// <returns> The <see cref="Pageable{T}"/> from the service containing a list of <see cref="BinaryData"/> objects. Details of the body schema for each item in the collection are in the Remarks section below. </returns>
        /// <include file="Docs/TwoTypesItem.xml" path="doc/members/member[@name='GetTextBlocklists(RequestContext)']/*" />
        public virtual Pageable<BinaryData> GetTextBlocklists(RequestContext context)
        {
            HttpMessage FirstPageRequest(int? pageSizeHint) => CreateGetTextBlocklistsRequest(context);
            HttpMessage NextPageRequest(int? pageSizeHint, string nextLink) => CreateGetTextBlocklistsNextPageRequest(nextLink, context);
            return GeneratorPageableHelpers.CreatePageable(FirstPageRequest, NextPageRequest, e => BinaryData.FromString(e.GetRawText()), ClientDiagnostics, _pipeline, "TwoTypesItem.GetTextBlocklists", "value", "nextLink", context);
        }

        /// <summary> Get All BlockItems By blocklistName. </summary>
        /// <param name="blocklistName"> Text blocklist name. Only supports the following characters: 0-9  A-Z  a-z  -  .  _  ~. </param>
        /// <param name="maxCount"> The number of result items to return. </param>
        /// <param name="skip"> The number of result items to skip. </param>
        /// <param name="maxpagesize"> The maximum number of result items per page. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="blocklistName"/> is null. </exception>
        /// <exception cref="ArgumentException"> <paramref name="blocklistName"/> is an empty string, and was expected to be non-empty. </exception>
        /// <remarks> Get all blockItems in a text blocklist. </remarks>
        /// <include file="Docs/TwoTypesItem.xml" path="doc/members/member[@name='GetTextBlocklistItemsAsync(string,int?,int?,int?,CancellationToken)']/*" />
        public virtual AsyncPageable<TextBlockItem> GetTextBlocklistItemsAsync(string blocklistName, int? maxCount = null, int? skip = null, int? maxpagesize = null, CancellationToken cancellationToken = default)
        {
            if (blocklistName == null)
            {
                throw new ArgumentNullException(nameof(blocklistName));
            }
            if (blocklistName.Length == 0)
            {
                throw new ArgumentException("Value cannot be an empty string.", nameof(blocklistName));
            }

            RequestContext context = cancellationToken.CanBeCanceled ? new RequestContext { CancellationToken = cancellationToken } : null;
            HttpMessage FirstPageRequest(int? pageSizeHint) => CreateGetTextBlocklistItemsRequest(blocklistName, maxCount, skip, maxpagesize, context);
            HttpMessage NextPageRequest(int? pageSizeHint, string nextLink) => CreateGetTextBlocklistItemsNextPageRequest(nextLink, blocklistName, maxCount, skip, maxpagesize, context);
            return GeneratorPageableHelpers.CreateAsyncPageable(FirstPageRequest, NextPageRequest, e => TextBlockItem.DeserializeTextBlockItem(e), ClientDiagnostics, _pipeline, "TwoTypesItem.GetTextBlocklistItems", "value", "nextLink", context);
        }

        /// <summary> Get All BlockItems By blocklistName. </summary>
        /// <param name="blocklistName"> Text blocklist name. Only supports the following characters: 0-9  A-Z  a-z  -  .  _  ~. </param>
        /// <param name="maxCount"> The number of result items to return. </param>
        /// <param name="skip"> The number of result items to skip. </param>
        /// <param name="maxpagesize"> The maximum number of result items per page. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="blocklistName"/> is null. </exception>
        /// <exception cref="ArgumentException"> <paramref name="blocklistName"/> is an empty string, and was expected to be non-empty. </exception>
        /// <remarks> Get all blockItems in a text blocklist. </remarks>
        /// <include file="Docs/TwoTypesItem.xml" path="doc/members/member[@name='GetTextBlocklistItems(string,int?,int?,int?,CancellationToken)']/*" />
        public virtual Pageable<TextBlockItem> GetTextBlocklistItems(string blocklistName, int? maxCount = null, int? skip = null, int? maxpagesize = null, CancellationToken cancellationToken = default)
        {
            if (blocklistName == null)
            {
                throw new ArgumentNullException(nameof(blocklistName));
            }
            if (blocklistName.Length == 0)
            {
                throw new ArgumentException("Value cannot be an empty string.", nameof(blocklistName));
            }

            RequestContext context = cancellationToken.CanBeCanceled ? new RequestContext { CancellationToken = cancellationToken } : null;
            HttpMessage FirstPageRequest(int? pageSizeHint) => CreateGetTextBlocklistItemsRequest(blocklistName, maxCount, skip, maxpagesize, context);
            HttpMessage NextPageRequest(int? pageSizeHint, string nextLink) => CreateGetTextBlocklistItemsNextPageRequest(nextLink, blocklistName, maxCount, skip, maxpagesize, context);
            return GeneratorPageableHelpers.CreatePageable(FirstPageRequest, NextPageRequest, e => TextBlockItem.DeserializeTextBlockItem(e), ClientDiagnostics, _pipeline, "TwoTypesItem.GetTextBlocklistItems", "value", "nextLink", context);
        }

        /// <summary>
        /// [Protocol Method] Get All BlockItems By blocklistName
        /// <list type="bullet">
        /// <item>
        /// <description>
        /// This <see href="https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/samples/ProtocolMethods.md">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios.
        /// </description>
        /// </item>
        /// <item>
        /// <description>
        /// Please try the simpler <see cref="GetTextBlocklistItemsAsync(string,int?,int?,int?,CancellationToken)"/> convenience overload with strongly typed models first.
        /// </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="blocklistName"> Text blocklist name. Only supports the following characters: 0-9  A-Z  a-z  -  .  _  ~. </param>
        /// <param name="maxCount"> The number of result items to return. </param>
        /// <param name="skip"> The number of result items to skip. </param>
        /// <param name="maxpagesize"> The maximum number of result items per page. </param>
        /// <param name="context"> The request context, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="blocklistName"/> is null. </exception>
        /// <exception cref="ArgumentException"> <paramref name="blocklistName"/> is an empty string, and was expected to be non-empty. </exception>
        /// <exception cref="RequestFailedException"> Service returned a non-success status code. </exception>
        /// <returns> The <see cref="AsyncPageable{T}"/> from the service containing a list of <see cref="BinaryData"/> objects. Details of the body schema for each item in the collection are in the Remarks section below. </returns>
        /// <include file="Docs/TwoTypesItem.xml" path="doc/members/member[@name='GetTextBlocklistItemsAsync(string,int?,int?,int?,RequestContext)']/*" />
        public virtual AsyncPageable<BinaryData> GetTextBlocklistItemsAsync(string blocklistName, int? maxCount, int? skip, int? maxpagesize, RequestContext context)
        {
            if (blocklistName == null)
            {
                throw new ArgumentNullException(nameof(blocklistName));
            }
            if (blocklistName.Length == 0)
            {
                throw new ArgumentException("Value cannot be an empty string.", nameof(blocklistName));
            }

            HttpMessage FirstPageRequest(int? pageSizeHint) => CreateGetTextBlocklistItemsRequest(blocklistName, maxCount, skip, maxpagesize, context);
            HttpMessage NextPageRequest(int? pageSizeHint, string nextLink) => CreateGetTextBlocklistItemsNextPageRequest(nextLink, blocklistName, maxCount, skip, maxpagesize, context);
            return GeneratorPageableHelpers.CreateAsyncPageable(FirstPageRequest, NextPageRequest, e => BinaryData.FromString(e.GetRawText()), ClientDiagnostics, _pipeline, "TwoTypesItem.GetTextBlocklistItems", "value", "nextLink", context);
        }

        /// <summary>
        /// [Protocol Method] Get All BlockItems By blocklistName
        /// <list type="bullet">
        /// <item>
        /// <description>
        /// This <see href="https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/samples/ProtocolMethods.md">protocol method</see> allows explicit creation of the request and processing of the response for advanced scenarios.
        /// </description>
        /// </item>
        /// <item>
        /// <description>
        /// Please try the simpler <see cref="GetTextBlocklistItems(string,int?,int?,int?,CancellationToken)"/> convenience overload with strongly typed models first.
        /// </description>
        /// </item>
        /// </list>
        /// </summary>
        /// <param name="blocklistName"> Text blocklist name. Only supports the following characters: 0-9  A-Z  a-z  -  .  _  ~. </param>
        /// <param name="maxCount"> The number of result items to return. </param>
        /// <param name="skip"> The number of result items to skip. </param>
        /// <param name="maxpagesize"> The maximum number of result items per page. </param>
        /// <param name="context"> The request context, which can override default behaviors of the client pipeline on a per-call basis. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="blocklistName"/> is null. </exception>
        /// <exception cref="ArgumentException"> <paramref name="blocklistName"/> is an empty string, and was expected to be non-empty. </exception>
        /// <exception cref="RequestFailedException"> Service returned a non-success status code. </exception>
        /// <returns> The <see cref="Pageable{T}"/> from the service containing a list of <see cref="BinaryData"/> objects. Details of the body schema for each item in the collection are in the Remarks section below. </returns>
        /// <include file="Docs/TwoTypesItem.xml" path="doc/members/member[@name='GetTextBlocklistItems(string,int?,int?,int?,RequestContext)']/*" />
        public virtual Pageable<BinaryData> GetTextBlocklistItems(string blocklistName, int? maxCount, int? skip, int? maxpagesize, RequestContext context)
        {
            if (blocklistName == null)
            {
                throw new ArgumentNullException(nameof(blocklistName));
            }
            if (blocklistName.Length == 0)
            {
                throw new ArgumentException("Value cannot be an empty string.", nameof(blocklistName));
            }

            HttpMessage FirstPageRequest(int? pageSizeHint) => CreateGetTextBlocklistItemsRequest(blocklistName, maxCount, skip, maxpagesize, context);
            HttpMessage NextPageRequest(int? pageSizeHint, string nextLink) => CreateGetTextBlocklistItemsNextPageRequest(nextLink, blocklistName, maxCount, skip, maxpagesize, context);
            return GeneratorPageableHelpers.CreatePageable(FirstPageRequest, NextPageRequest, e => BinaryData.FromString(e.GetRawText()), ClientDiagnostics, _pipeline, "TwoTypesItem.GetTextBlocklistItems", "value", "nextLink", context);
        }

        internal HttpMessage CreateGetTextBlocklistsRequest(RequestContext context)
        {
            var message = _pipeline.CreateMessage(context, ResponseClassifier200);
            var request = message.Request;
            request.Method = RequestMethod.Get;
            var uri = new RawRequestUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendPath("/app/text/blocklists", false);
            uri.AppendQuery("api-version", _apiVersion, true);
            request.Uri = uri;
            request.Headers.Add("Accept", "application/json");
            return message;
        }

        internal HttpMessage CreateGetTextBlocklistItemsRequest(string blocklistName, int? maxCount, int? skip, int? maxpagesize, RequestContext context)
        {
            var message = _pipeline.CreateMessage(context, ResponseClassifier200);
            var request = message.Request;
            request.Method = RequestMethod.Get;
            var uri = new RawRequestUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendPath("/app/text/blocklists/", false);
            uri.AppendPath(blocklistName, true);
            uri.AppendPath("/blockItems", false);
            uri.AppendQuery("api-version", _apiVersion, true);
            if (maxCount != null)
            {
                uri.AppendQuery("top", maxCount.Value, true);
            }
            if (skip != null)
            {
                uri.AppendQuery("skip", skip.Value, true);
            }
            if (maxpagesize != null)
            {
                uri.AppendQuery("maxpagesize", maxpagesize.Value, true);
            }
            request.Uri = uri;
            request.Headers.Add("Accept", "application/json");
            return message;
        }

        internal HttpMessage CreateGetTextBlocklistsNextPageRequest(string nextLink, RequestContext context)
        {
            var message = _pipeline.CreateMessage(context, ResponseClassifier200);
            var request = message.Request;
            request.Method = RequestMethod.Get;
            var uri = new RawRequestUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendRawNextLink(nextLink, false);
            request.Uri = uri;
            request.Headers.Add("Accept", "application/json");
            return message;
        }

        internal HttpMessage CreateGetTextBlocklistItemsNextPageRequest(string nextLink, string blocklistName, int? maxCount, int? skip, int? maxpagesize, RequestContext context)
        {
            var message = _pipeline.CreateMessage(context, ResponseClassifier200);
            var request = message.Request;
            request.Method = RequestMethod.Get;
            var uri = new RawRequestUriBuilder();
            uri.Reset(_endpoint);
            uri.AppendRawNextLink(nextLink, false);
            request.Uri = uri;
            request.Headers.Add("Accept", "application/json");
            return message;
        }

        private static RequestContext DefaultRequestContext = new RequestContext();
        internal static RequestContext FromCancellationToken(CancellationToken cancellationToken = default)
        {
            if (!cancellationToken.CanBeCanceled)
            {
                return DefaultRequestContext;
            }

            return new RequestContext() { CancellationToken = cancellationToken };
        }

        private static ResponseClassifier _responseClassifier200;
        private static ResponseClassifier ResponseClassifier200 => _responseClassifier200 ??= new StatusCodeClassifier(stackalloc ushort[] { 200 });
    }
}
