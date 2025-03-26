package type.model.visibility;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.model.visibility.implementation.VisibilityClientImpl;

/**
 * Initializes a new instance of the synchronous VisibilityClient type.
 */
@ServiceClient(builder = VisibilityClientBuilder.class)
public final class VisibilityClient {
    @Metadata(generated = true)
    private final VisibilityClientImpl serviceClient;

    /**
     * Initializes an instance of VisibilityClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    VisibilityClient(VisibilityClientImpl serviceClient) {
        this.serviceClient = serviceClient;
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
    @Metadata(generated = true)
    public Response<VisibilityModel> getModelWithResponse(int queryProp, BinaryData input,
        RequestOptions requestOptions) {
        return this.serviceClient.getModelWithResponse(queryProp, input, requestOptions);
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
    @Metadata(generated = true)
    public Response<Void> headModelWithResponse(int queryProp, BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.headModelWithResponse(queryProp, input, requestOptions);
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
    @Metadata(generated = true)
    public Response<Void> putModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.putModelWithResponse(input, requestOptions);
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
    @Metadata(generated = true)
    public Response<Void> patchModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.patchModelWithResponse(input, requestOptions);
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
    @Metadata(generated = true)
    public Response<Void> postModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.postModelWithResponse(input, requestOptions);
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
    @Metadata(generated = true)
    public Response<Void> deleteModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.deleteModelWithResponse(input, requestOptions);
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
    @Metadata(generated = true)
    public Response<ReadOnlyModel> putReadOnlyModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.putReadOnlyModelWithResponse(input, requestOptions);
    }

    /**
     * The getModel operation.
     * 
     * @param queryProp Required int32, illustrating a query property.
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return output model with visibility properties.
     */
    @Metadata(generated = true)
    public VisibilityModel getModel(int queryProp, VisibilityModel input) {
        // Generated convenience method for getModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getModelWithResponse(queryProp, BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The headModel operation.
     * 
     * @param queryProp Required int32, illustrating a query property.
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void headModel(int queryProp, VisibilityModel input) {
        // Generated convenience method for headModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        headModelWithResponse(queryProp, BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The putModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putModel(VisibilityModel input) {
        // Generated convenience method for putModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The patchModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void patchModel(VisibilityModel input) {
        // Generated convenience method for patchModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        patchModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The postModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void postModel(VisibilityModel input) {
        // Generated convenience method for postModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        postModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The deleteModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void deleteModel(VisibilityModel input) {
        // Generated convenience method for deleteModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        deleteModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The putReadOnlyModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return roundTrip model with readonly optional properties.
     */
    @Metadata(generated = true)
    public ReadOnlyModel putReadOnlyModel(ReadOnlyModel input) {
        // Generated convenience method for putReadOnlyModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return putReadOnlyModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }
}
