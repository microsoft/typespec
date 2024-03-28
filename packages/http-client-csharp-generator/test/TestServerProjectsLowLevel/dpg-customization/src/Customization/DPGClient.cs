// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

#nullable disable

using System;
using System.Threading;
using System.Threading.Tasks;
using Autorest.CSharp.Core;
using Azure;
using Azure.Core;
using dpg_customization_LowLevel.Models;

namespace dpg_customization_LowLevel
{
    public partial class DPGClient
    {
        /// <summary> Get models that you will either return to end users as a raw body, or with a model added during grow up. </summary>
        /// <param name="mode"> The mode with which you&apos;ll be handling your returned body. &apos;raw&apos; for just dealing with the raw body, and &apos;model&apos; if you are going to convert the raw body to a customized body before returning to users. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="mode"/> is null. </exception>
        public virtual async Task<Response<Product>> GetModelValueAsync(string mode, CancellationToken cancellationToken = default)
        {
            using var scope = ClientDiagnostics.CreateScope("DPGClient.GetModelValue");
            scope.Start();
            try
            {
                RequestContext requestContext = new RequestContext { CancellationToken = cancellationToken };
                Response response = await GetModelAsync(mode, requestContext).ConfigureAwait(false);
                return Response.FromValue(Product.FromResponse(response), response);
            }
            catch (Exception e)
            {
                scope.Failed(e);
                throw;
            }
        }

        /// <summary> Get models that you will either return to end users as a raw body, or with a model added during grow up. </summary>
        /// <param name="mode"> The mode with which you&apos;ll be handling your returned body. &apos;raw&apos; for just dealing with the raw body, and &apos;model&apos; if you are going to convert the raw body to a customized body before returning to users. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="mode"/> is null. </exception>
        public virtual Response<Product> GetModelValue(string mode, CancellationToken cancellationToken = default)
        {
            using var scope = ClientDiagnostics.CreateScope("DPGClient.GetModelValue");
            scope.Start();
            try
            {
                RequestContext requestContext = new RequestContext { CancellationToken = cancellationToken };
                Response response = GetModel(mode, requestContext);
                return Response.FromValue(Product.FromResponse(response), response);
            }
            catch (Exception e)
            {
                scope.Failed(e);
                throw;
            }
        }

        /// <summary> Post either raw response as a model and pass in &apos;raw&apos; for mode, or grow up your operation to take a model instead, and put in &apos;model&apos; as mode. </summary>
        /// <param name="mode"> The mode with which you&apos;ll be handling your returned body. &apos;raw&apos; for just dealing with the raw body, and &apos;model&apos; if you are going to convert the raw body to a customized body before returning to users. </param>
        /// <param name="input"> Please put {&apos;hello&apos;: &apos;world!&apos;}. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="mode"/> or <paramref name="input"/> is null. </exception>
        public virtual async Task<Response<Product>> PostModelAsync(string mode, Input input, CancellationToken cancellationToken = default)
        {
            if (input is null)
            {
                throw new ArgumentNullException(nameof(input));
            }

            RequestContext requestContext = new RequestContext();
            requestContext.CancellationToken = cancellationToken;

            Response response = await PostModelAsync("model", Input.ToRequestContent(input), requestContext).ConfigureAwait(false);
            return Response.FromValue(Product.FromResponse(response), response);
        }

        /// <summary> Post either raw response as a model and pass in &apos;raw&apos; for mode, or grow up your operation to take a model instead, and put in &apos;model&apos; as mode. </summary>
        /// <param name="mode"> The mode with which you&apos;ll be handling your returned body. &apos;raw&apos; for just dealing with the raw body, and &apos;model&apos; if you are going to convert the raw body to a customized body before returning to users. </param>
        /// <param name="input"> Please put {&apos;hello&apos;: &apos;world!&apos;}. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="mode"/> or <paramref name="input"/> is null. </exception>
        public virtual Response<Product> PostModel(string mode, Input input, CancellationToken cancellationToken = default)
        {
            if (input is null)
            {
                throw new ArgumentNullException(nameof(input));
            }

            RequestContext requestContext = new RequestContext();
            requestContext.CancellationToken = cancellationToken;

            Response result = PostModel("model", Input.ToRequestContent(input), requestContext);
            return Response.FromValue(Product.FromResponse(result), result);
        }

        /// <summary> Long running put request that will either return to end users a final payload of a raw body, or a final payload of a model after the SDK has grown up. </summary>
        /// <param name="waitUntil"> <see cref="WaitUntil.Completed"/> if the method should wait to return until the long-running operation has completed on the service; <see cref="WaitUntil.Started"/> if it should return after starting the operation. For more information on long-running operations, please see <see href="https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/samples/LongRunningOperations.md"> Azure.Core Long-Running Operation samples</see>. </param>
        /// <param name="mode"> The mode with which you&apos;ll be handling your returned body. &apos;raw&apos; for just dealing with the raw body, and &apos;model&apos; if you are going to convert the raw body to a customized body before returning to users. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="mode"/> is null. </exception>
        public virtual async Task<Operation<Product>> LroValueAsync(WaitUntil waitUntil, string mode, CancellationToken cancellationToken = default)
        {
            RequestContext context = FromCancellationToken(cancellationToken);
            using var scope = ClientDiagnostics.CreateScope("DPGClient.LroValue");
            scope.Start();
            try
            {
                var response = await LroAsync(waitUntil, mode, context).ConfigureAwait(false);
                return ProtocolOperationHelpers.Convert(response, r => Product.FromResponse(r), ClientDiagnostics, "DPGClient.LroValue");
            }
            catch (Exception e)
            {
                scope.Failed(e);
                throw;
            }
        }

        /// <summary> Long running put request that will either return to end users a final payload of a raw body, or a final payload of a model after the SDK has grown up. </summary>
        /// <param name="waitUntil"> <see cref="WaitUntil.Completed"/> if the method should wait to return until the long-running operation has completed on the service; <see cref="WaitUntil.Started"/> if it should return after starting the operation. For more information on long-running operations, please see <see href="https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/core/Azure.Core/samples/LongRunningOperations.md"> Azure.Core Long-Running Operation samples</see>. </param>
        /// <param name="mode"> The mode with which you&apos;ll be handling your returned body. &apos;raw&apos; for just dealing with the raw body, and &apos;model&apos; if you are going to convert the raw body to a customized body before returning to users. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="mode"/> is null. </exception>
        public virtual Operation<Product> LroValue(WaitUntil waitUntil, string mode, CancellationToken cancellationToken = default)
        {
            RequestContext context = FromCancellationToken(cancellationToken);
            using var scope = ClientDiagnostics.CreateScope("DPGClient.LroValue");
            scope.Start();
            try
            {
                var response = Lro(waitUntil, mode, context);
                return ProtocolOperationHelpers.Convert(response, r => Product.FromResponse(r), ClientDiagnostics, "DPGClient.LroValue");
            }
            catch (Exception e)
            {
                scope.Failed(e);
                throw;
            }
        }

        /// <summary> Get pages that you will either return to users in pages of raw bodies, or pages of models following growup. </summary>
        /// <param name="mode"> The mode with which you&apos;ll be handling your returned body. &apos;raw&apos; for just dealing with the raw body, and &apos;model&apos; if you are going to convert the raw body to a customized body before returning to users. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="mode"/> is null. </exception>
        public virtual AsyncPageable<Product> GetPageValuesAsync(string mode, CancellationToken cancellationToken = default)
        {
            if (mode is null)
            {
                throw new ArgumentNullException(nameof(mode));
            }

            var requestContext = cancellationToken.CanBeCanceled ? new RequestContext { CancellationToken = cancellationToken } : default;
            return GeneratorPageableHelpers.CreateAsyncPageable
            (
                _ => CreateGetPagesRequest(mode, requestContext),
                (_, nextLink) => CreateGetPagesNextPageRequest(nextLink, mode, requestContext),
                e => Product.DeserializeProduct(e),
                ClientDiagnostics,
                Pipeline,
                "DPGClient.GetPagesValues",
                "values",
                "nextLink",
                requestContext
            );
        }

        /// <summary> Get pages that you will either return to users in pages of raw bodies, or pages of models following growup. </summary>
        /// <param name="mode"> The mode with which you&apos;ll be handling your returned body. &apos;raw&apos; for just dealing with the raw body, and &apos;model&apos; if you are going to convert the raw body to a customized body before returning to users. </param>
        /// <param name="cancellationToken"> The cancellation token to use. </param>
        /// <exception cref="ArgumentNullException"> <paramref name="mode"/> is null. </exception>
        public virtual Pageable<Product> GetPageValues(string mode, CancellationToken cancellationToken = default)
        {
            if (mode is null)
            {
                throw new ArgumentNullException(nameof(mode));
            }

            var requestContext = cancellationToken.CanBeCanceled ? new RequestContext { CancellationToken = cancellationToken } : default;
            return GeneratorPageableHelpers.CreatePageable
            (
                _ => CreateGetPagesRequest(mode, requestContext),
                (_, nextLink) => CreateGetPagesNextPageRequest(nextLink, mode, requestContext),
                e => Product.DeserializeProduct(e),
                ClientDiagnostics,
                Pipeline,
                "DPGClient.GetPagesValues",
                "values",
                "nextLink",
                requestContext
            );
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
    }
}
