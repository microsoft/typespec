package type.model.visibility.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.models.binarydata.BinaryData;
import type.model.visibility.ReadOnlyModel;
import type.model.visibility.VisibilityModel;

/**
 * Initializes a new instance of the VisibilityClient type.
 */
public final class VisibilityClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final VisibilityClientService service;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * Initializes an instance of VisibilityClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public VisibilityClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(VisibilityClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for VisibilityClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "VisibilityClient", host = "{endpoint}")
    public interface VisibilityClientService {
        @HttpRequestInformation(method = HttpMethod.GET, path = "/type/model/visibility", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<VisibilityModel> getModelSync(@HostParam("endpoint") String endpoint,
            @QueryParam("queryProp") int queryProp, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/type/model/visibility",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> headModelSync(@HostParam("endpoint") String endpoint, @QueryParam("queryProp") int queryProp,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.PUT, path = "/type/model/visibility", expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/type/model/visibility",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> patchModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/model/visibility",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> postModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.DELETE,
            path = "/type/model/visibility",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> deleteModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/visibility/readonlyroundtrip",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ReadOnlyModel> putReadOnlyModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData input, RequestOptions requestOptions);
    }

    /**
     * The getModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     readProp: String (Required)
     *     createProp (Required): [
     *         String (Required)
     *     ]
     *     updateProp (Required): [
     *         int (Required)
     *     ]
     *     deleteProp: Boolean (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     readProp: String (Required)
     *     createProp (Required): [
     *         String (Required)
     *     ]
     *     updateProp (Required): [
     *         int (Required)
     *     ]
     *     deleteProp: Boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param queryProp Required int32, illustrating a query property.
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return output model with visibility properties.
     */
    public Response<VisibilityModel> getModelWithResponse(int queryProp, BinaryData input,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.getModelSync(this.getEndpoint(), queryProp, contentType, accept, input, requestOptions);
    }

    /**
     * The headModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     readProp: String (Required)
     *     createProp (Required): [
     *         String (Required)
     *     ]
     *     updateProp (Required): [
     *         int (Required)
     *     ]
     *     deleteProp: Boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param queryProp Required int32, illustrating a query property.
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> headModelWithResponse(int queryProp, BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.headModelSync(this.getEndpoint(), queryProp, contentType, input, requestOptions);
    }

    /**
     * The putModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     readProp: String (Required)
     *     createProp (Required): [
     *         String (Required)
     *     ]
     *     updateProp (Required): [
     *         int (Required)
     *     ]
     *     deleteProp: Boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putModelSync(this.getEndpoint(), contentType, input, requestOptions);
    }

    /**
     * The patchModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     readProp: String (Required)
     *     createProp (Required): [
     *         String (Required)
     *     ]
     *     updateProp (Required): [
     *         int (Required)
     *     ]
     *     deleteProp: Boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> patchModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.patchModelSync(this.getEndpoint(), contentType, input, requestOptions);
    }

    /**
     * The postModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     readProp: String (Required)
     *     createProp (Required): [
     *         String (Required)
     *     ]
     *     updateProp (Required): [
     *         int (Required)
     *     ]
     *     deleteProp: Boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> postModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.postModelSync(this.getEndpoint(), contentType, input, requestOptions);
    }

    /**
     * The deleteModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     readProp: String (Required)
     *     createProp (Required): [
     *         String (Required)
     *     ]
     *     updateProp (Required): [
     *         int (Required)
     *     ]
     *     deleteProp: Boolean (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> deleteModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.deleteModelSync(this.getEndpoint(), contentType, input, requestOptions);
    }

    /**
     * The putReadOnlyModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     optionalNullableIntList (Optional): [
     *         int (Optional)
     *     ]
     *     optionalStringRecord (Optional): {
     *         String: String (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     optionalNullableIntList (Optional): [
     *         int (Optional)
     *     ]
     *     optionalStringRecord (Optional): {
     *         String: String (Required)
     *     }
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return roundTrip model with readonly optional properties.
     */
    public Response<ReadOnlyModel> putReadOnlyModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.putReadOnlyModelSync(this.getEndpoint(), contentType, accept, input, requestOptions);
    }
}
