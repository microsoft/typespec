package payload.jsonmergepatch;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import payload.jsonmergepatch.implementation.JsonMergePatchClientImpl;
import payload.jsonmergepatch.implementation.JsonMergePatchHelper;

/**
 * Initializes a new instance of the synchronous JsonMergePatchClient type.
 */
@ServiceClient(builder = JsonMergePatchClientBuilder.class)
public final class JsonMergePatchClient {
    @Metadata(generated = true)
    private final JsonMergePatchClientImpl serviceClient;

    /**
     * Initializes an instance of JsonMergePatchClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    JsonMergePatchClient(JsonMergePatchClientImpl serviceClient) {
        this.serviceClient = serviceClient;
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
    @Metadata(generated = true)
    public Response<Resource> createResourceWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.createResourceWithResponse(body, requestOptions);
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
    @Metadata(generated = true)
    public Response<Resource> updateResourceWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.updateResourceWithResponse(body, requestOptions);
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
    @Metadata(generated = true)
    public Response<Resource> updateOptionalResourceWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.updateOptionalResourceWithResponse(requestOptions);
    }

    /**
     * Test content-type: application/merge-patch+json with required body.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource.
     */
    @Metadata(generated = true)
    public Resource createResource(Resource body) {
        // Generated convenience method for createResourceWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return createResourceWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * Test content-type: application/merge-patch+json with required body.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource.
     */
    @Metadata(generated = true)
    public Resource updateResource(ResourcePatch body) {
        // Generated convenience method for updateResourceWithResponse
        RequestOptions requestOptions = new RequestOptions();
        JsonMergePatchHelper.getResourcePatchAccessor().prepareModelForJsonMergePatch(body, true);
        BinaryData bodyInBinaryData = BinaryData.fromObject(body);
        // BinaryData.fromObject() will not fire serialization, use getLength() to fire serialization.
        bodyInBinaryData.getLength();
        JsonMergePatchHelper.getResourcePatchAccessor().prepareModelForJsonMergePatch(body, false);
        return updateResourceWithResponse(bodyInBinaryData, requestOptions).getValue();
    }

    /**
     * Test content-type: application/merge-patch+json with optional body.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource.
     */
    @Metadata(generated = true)
    public Resource updateOptionalResource(ResourcePatch body) {
        // Generated convenience method for updateOptionalResourceWithResponse
        RequestOptions requestOptions = new RequestOptions();
        if (body != null) {
            JsonMergePatchHelper.getResourcePatchAccessor().prepareModelForJsonMergePatch(body, true);
            BinaryData bodyInBinaryData = BinaryData.fromObject(body);
            // BinaryData.fromObject() will not fire serialization, use getLength() to fire serialization.
            bodyInBinaryData.getLength();
            JsonMergePatchHelper.getResourcePatchAccessor().prepareModelForJsonMergePatch(body, false);
            requestOptions.setBody(bodyInBinaryData);
        }
        return updateOptionalResourceWithResponse(requestOptions).getValue();
    }

    /**
     * Test content-type: application/merge-patch+json with optional body.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource.
     */
    @Metadata(generated = true)
    public Resource updateOptionalResource() {
        // Generated convenience method for updateOptionalResourceWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return updateOptionalResourceWithResponse(requestOptions).getValue();
    }
}
