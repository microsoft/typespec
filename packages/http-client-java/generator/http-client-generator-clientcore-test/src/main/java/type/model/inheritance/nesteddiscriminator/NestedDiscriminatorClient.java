package type.model.inheritance.nesteddiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.model.inheritance.nesteddiscriminator.implementation.NestedDiscriminatorClientImpl;

/**
 * Initializes a new instance of the synchronous NestedDiscriminatorClient type.
 */
@ServiceClient(builder = NestedDiscriminatorClientBuilder.class)
public final class NestedDiscriminatorClient {
    @Metadata(generated = true)
    private final NestedDiscriminatorClientImpl serviceClient;

    /**
     * Initializes an instance of NestedDiscriminatorClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    NestedDiscriminatorClient(NestedDiscriminatorClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The getModel operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Response<Fish> getModelWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getModelWithResponse(requestOptions);
    }

    /**
     * The putModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
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
     * The getRecursiveModel operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Response<Fish> getRecursiveModelWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getRecursiveModelWithResponse(requestOptions);
    }

    /**
     * The putRecursiveModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
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
    public Response<Void> putRecursiveModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.putRecursiveModelWithResponse(input, requestOptions);
    }

    /**
     * The getMissingDiscriminator operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Response<Fish> getMissingDiscriminatorWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getMissingDiscriminatorWithResponse(requestOptions);
    }

    /**
     * The getWrongDiscriminator operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Response<Fish> getWrongDiscriminatorWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getWrongDiscriminatorWithResponse(requestOptions);
    }

    /**
     * The getModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Fish getModel() {
        // Generated convenience method for getModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getModelWithResponse(requestOptions).getValue();
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
    public void putModel(Fish input) {
        // Generated convenience method for putModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The getRecursiveModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Fish getRecursiveModel() {
        // Generated convenience method for getRecursiveModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getRecursiveModelWithResponse(requestOptions).getValue();
    }

    /**
     * The putRecursiveModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putRecursiveModel(Fish input) {
        // Generated convenience method for putRecursiveModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putRecursiveModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The getMissingDiscriminator operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Fish getMissingDiscriminator() {
        // Generated convenience method for getMissingDiscriminatorWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getMissingDiscriminatorWithResponse(requestOptions).getValue();
    }

    /**
     * The getWrongDiscriminator operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Fish getWrongDiscriminator() {
        // Generated convenience method for getWrongDiscriminatorWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWrongDiscriminatorWithResponse(requestOptions).getValue();
    }
}
