package payload.jsonmergepatch.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.models.binarydata.BinaryData;
import payload.jsonmergepatch.Resource;

/**
 * Initializes a new instance of the JsonMergePatchClient type.
 */
public final class JsonMergePatchClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final JsonMergePatchClientService service;

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
     * Initializes an instance of JsonMergePatchClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public JsonMergePatchClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(JsonMergePatchClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for JsonMergePatchClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "JsonMergePatchClient", host = "{endpoint}")
    public interface JsonMergePatchClientService {
        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/json-merge-patch/create/resource",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Resource> createResourceSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/json-merge-patch/update/resource",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Resource> updateResourceSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/merge-patch+json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/json-merge-patch/update/resource/optional",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Resource> updateOptionalResourceSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);
    }

    /**
     * Test content-type: application/merge-patch+json with required body.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     description: String (Optional)
     *     map (Optional): {
     *         String (Required): {
     *             name: String (Optional)
     *             description: String (Optional)
     *         }
     *     }
     *     array (Optional): [
     *         (recursive schema, see above)
     *     ]
     *     intValue: Integer (Optional)
     *     floatValue: Double (Optional)
     *     innerModel (Optional): (recursive schema, see innerModel above)
     *     intArray (Optional): [
     *         int (Optional)
     *     ]
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     description: String (Optional)
     *     map (Optional): {
     *         String (Required): {
     *             name: String (Optional)
     *             description: String (Optional)
     *         }
     *     }
     *     array (Optional): [
     *         (recursive schema, see above)
     *     ]
     *     intValue: Integer (Optional)
     *     floatValue: Double (Optional)
     *     innerModel (Optional): (recursive schema, see innerModel above)
     *     intArray (Optional): [
     *         int (Optional)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return details about a resource.
     */
    public Response<Resource> createResourceWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.createResourceSync(this.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * Test content-type: application/merge-patch+json with required body.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     description: String (Optional)
     *     map (Optional): {
     *         String (Required): {
     *             name: String (Optional)
     *             description: String (Optional)
     *         }
     *     }
     *     array (Optional): [
     *         (recursive schema, see above)
     *     ]
     *     intValue: Integer (Optional)
     *     floatValue: Double (Optional)
     *     innerModel (Optional): (recursive schema, see innerModel above)
     *     intArray (Optional): [
     *         int (Optional)
     *     ]
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     description: String (Optional)
     *     map (Optional): {
     *         String (Required): {
     *             name: String (Optional)
     *             description: String (Optional)
     *         }
     *     }
     *     array (Optional): [
     *         (recursive schema, see above)
     *     ]
     *     intValue: Integer (Optional)
     *     floatValue: Double (Optional)
     *     innerModel (Optional): (recursive schema, see innerModel above)
     *     intArray (Optional): [
     *         int (Optional)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return details about a resource.
     */
    public Response<Resource> updateResourceWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/merge-patch+json";
        final String accept = "application/json";
        return service.updateResourceSync(this.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * Test content-type: application/merge-patch+json with optional body.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>Content-Type</td><td>String</td><td>No</td><td>The content type. Allowed values:
     * "application/merge-patch+json".</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     description: String (Optional)
     *     map (Optional): {
     *         String (Required): {
     *             name: String (Optional)
     *             description: String (Optional)
     *         }
     *     }
     *     array (Optional): [
     *         (recursive schema, see above)
     *     ]
     *     intValue: Integer (Optional)
     *     floatValue: Double (Optional)
     *     innerModel (Optional): (recursive schema, see innerModel above)
     *     intArray (Optional): [
     *         int (Optional)
     *     ]
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     description: String (Optional)
     *     map (Optional): {
     *         String (Required): {
     *             name: String (Optional)
     *             description: String (Optional)
     *         }
     *     }
     *     array (Optional): [
     *         (recursive schema, see above)
     *     ]
     *     intValue: Integer (Optional)
     *     floatValue: Double (Optional)
     *     innerModel (Optional): (recursive schema, see innerModel above)
     *     intArray (Optional): [
     *         int (Optional)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return details about a resource.
     */
    public Response<Resource> updateOptionalResourceWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        RequestOptions requestOptionsLocal = requestOptions == null ? new RequestOptions() : requestOptions;
        requestOptionsLocal.addRequestCallback(requestLocal -> {
            if (requestLocal.getBody() != null && requestLocal.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                requestLocal.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/merge-patch+json");
            }
        });
        return service.updateOptionalResourceSync(this.getEndpoint(), accept, requestOptionsLocal);
    }
}
