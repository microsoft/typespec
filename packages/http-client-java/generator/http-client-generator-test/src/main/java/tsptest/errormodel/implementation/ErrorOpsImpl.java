// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package tsptest.errormodel.implementation;

import com.azure.core.annotation.ExpectedResponses;
import com.azure.core.annotation.Get;
import com.azure.core.annotation.HeaderParam;
import com.azure.core.annotation.Host;
import com.azure.core.annotation.HostParam;
import com.azure.core.annotation.ReturnType;
import com.azure.core.annotation.ServiceInterface;
import com.azure.core.annotation.ServiceMethod;
import com.azure.core.annotation.UnexpectedResponseExceptionType;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.RestProxy;
import com.azure.core.util.BinaryData;
import com.azure.core.util.Context;
import com.azure.core.util.FluxUtil;
import reactor.core.publisher.Mono;
import tsptest.errormodel.models.BadResponseErrorException;
import tsptest.errormodel.models.BatchErrorException;

/**
 * An instance of this class provides access to all the operations defined in ErrorOps.
 */
public final class ErrorOpsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ErrorOpsService service;

    /**
     * The service client containing this operation class.
     */
    private final ErrorModelClientImpl client;

    /**
     * Initializes an instance of ErrorOpsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ErrorOpsImpl(ErrorModelClientImpl client) {
        this.service = RestProxy.create(ErrorOpsService.class, client.getHttpPipeline(), client.getSerializerAdapter());
        this.client = client;
    }

    /**
     * The interface defining all the services for ErrorModelClientErrorOps to be used by the proxy service to perform
     * REST calls.
     */
    @Host("{endpoint}")
    @ServiceInterface(name = "ErrorModelClientErrorOps")
    public interface ErrorOpsService {
        @Get("/error")
        @ExpectedResponses({ 200, 201 })
        @UnexpectedResponseExceptionType(value = BadResponseErrorException.class, code = { 400 })
        @UnexpectedResponseExceptionType(value = HttpResponseException.class, code = { 404 })
        @UnexpectedResponseExceptionType(BatchErrorException.class)
        Mono<Response<BinaryData>> read(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions, Context context);

        @Get("/error")
        @ExpectedResponses({ 200, 201 })
        @UnexpectedResponseExceptionType(value = BadResponseErrorException.class, code = { 400 })
        @UnexpectedResponseExceptionType(value = HttpResponseException.class, code = { 404 })
        @UnexpectedResponseExceptionType(BatchErrorException.class)
        Response<BinaryData> readSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions, Context context);
    }

    /**
     * The read operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     error (Required): {
     *         code: String (Required)
     *         message: String (Required)
     *         target: String (Optional)
     *         details (Optional): [
     *             (recursive schema, see above)
     *         ]
     *         innererror (Optional): {
     *             code: String (Optional)
     *             innererror (Optional): (recursive schema, see innererror above)
     *         }
     *     }
     *     subError (Required): {
     *         code: String (Required)
     *         message: String (Required)
     *         target: String (Optional)
     *         details (Optional): [
     *             (recursive schema, see above)
     *         ]
     *         innererror (Optional): (recursive schema, see innererror above)
     *         subCode: String (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws BatchErrorException thrown if the request is rejected by server.
     * @throws BadResponseErrorException thrown if the request is rejected by server on status code 400.
     * @throws HttpResponseException thrown if the request is rejected by server on status code 404.
     * @return the response body along with {@link Response} on successful completion of {@link Mono}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Mono<Response<BinaryData>> readWithResponseAsync(RequestOptions requestOptions) {
        final String accept = "application/json";
        return FluxUtil
            .withContext(context -> service.read(this.client.getEndpoint(), accept, requestOptions, context));
    }

    /**
     * The read operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     error (Required): {
     *         code: String (Required)
     *         message: String (Required)
     *         target: String (Optional)
     *         details (Optional): [
     *             (recursive schema, see above)
     *         ]
     *         innererror (Optional): {
     *             code: String (Optional)
     *             innererror (Optional): (recursive schema, see innererror above)
     *         }
     *     }
     *     subError (Required): {
     *         code: String (Required)
     *         message: String (Required)
     *         target: String (Optional)
     *         details (Optional): [
     *             (recursive schema, see above)
     *         ]
     *         innererror (Optional): (recursive schema, see innererror above)
     *         subCode: String (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws BatchErrorException thrown if the request is rejected by server.
     * @throws BadResponseErrorException thrown if the request is rejected by server on status code 400.
     * @throws HttpResponseException thrown if the request is rejected by server on status code 404.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> readWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.readSync(this.client.getEndpoint(), accept, requestOptions, Context.NONE);
    }
}
