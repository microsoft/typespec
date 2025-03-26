package type.model.inheritance.enumdiscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.model.inheritance.enumdiscriminator.implementation.EnumDiscriminatorClientImpl;

/**
 * Initializes a new instance of the synchronous EnumDiscriminatorClient type.
 */
@ServiceClient(builder = EnumDiscriminatorClientBuilder.class)
public final class EnumDiscriminatorClient {
    @Metadata(generated = true)
    private final EnumDiscriminatorClientImpl serviceClient;

    /**
     * Initializes an instance of EnumDiscriminatorClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    EnumDiscriminatorClient(EnumDiscriminatorClientImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Receive model with extensible enum discriminator type.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(golden) (Required)
     *     weight: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return test extensible enum type for discriminator.
     */
    @Metadata(generated = true)
    public Response<Dog> getExtensibleModelWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getExtensibleModelWithResponse(requestOptions);
    }

    /**
     * Send model with extensible enum discriminator type.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(golden) (Required)
     *     weight: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param input Dog to create.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> putExtensibleModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.putExtensibleModelWithResponse(input, requestOptions);
    }

    /**
     * Get a model omitting the discriminator.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(golden) (Required)
     *     weight: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a model omitting the discriminator.
     */
    @Metadata(generated = true)
    public Response<Dog> getExtensibleModelMissingDiscriminatorWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getExtensibleModelMissingDiscriminatorWithResponse(requestOptions);
    }

    /**
     * Get a model containing discriminator value never defined.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(golden) (Required)
     *     weight: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a model containing discriminator value never defined.
     */
    @Metadata(generated = true)
    public Response<Dog> getExtensibleModelWrongDiscriminatorWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getExtensibleModelWrongDiscriminatorWithResponse(requestOptions);
    }

    /**
     * Receive model with fixed enum discriminator type.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(cobra) (Required)
     *     length: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return test fixed enum type for discriminator.
     */
    @Metadata(generated = true)
    public Response<Snake> getFixedModelWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getFixedModelWithResponse(requestOptions);
    }

    /**
     * Send model with fixed enum discriminator type.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(cobra) (Required)
     *     length: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param input Snake to create.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> putFixedModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        return this.serviceClient.putFixedModelWithResponse(input, requestOptions);
    }

    /**
     * Get a model omitting the discriminator.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(cobra) (Required)
     *     length: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a model omitting the discriminator.
     */
    @Metadata(generated = true)
    public Response<Snake> getFixedModelMissingDiscriminatorWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getFixedModelMissingDiscriminatorWithResponse(requestOptions);
    }

    /**
     * Get a model containing discriminator value never defined.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(cobra) (Required)
     *     length: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a model containing discriminator value never defined.
     */
    @Metadata(generated = true)
    public Response<Snake> getFixedModelWrongDiscriminatorWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getFixedModelWrongDiscriminatorWithResponse(requestOptions);
    }

    /**
     * Receive model with extensible enum discriminator type.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test extensible enum type for discriminator.
     */
    @Metadata(generated = true)
    public Dog getExtensibleModel() {
        // Generated convenience method for getExtensibleModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getExtensibleModelWithResponse(requestOptions).getValue();
    }

    /**
     * Send model with extensible enum discriminator type.
     * 
     * @param input Dog to create.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putExtensibleModel(Dog input) {
        // Generated convenience method for putExtensibleModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putExtensibleModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * Get a model omitting the discriminator.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model omitting the discriminator.
     */
    @Metadata(generated = true)
    public Dog getExtensibleModelMissingDiscriminator() {
        // Generated convenience method for getExtensibleModelMissingDiscriminatorWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getExtensibleModelMissingDiscriminatorWithResponse(requestOptions).getValue();
    }

    /**
     * Get a model containing discriminator value never defined.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model containing discriminator value never defined.
     */
    @Metadata(generated = true)
    public Dog getExtensibleModelWrongDiscriminator() {
        // Generated convenience method for getExtensibleModelWrongDiscriminatorWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getExtensibleModelWrongDiscriminatorWithResponse(requestOptions).getValue();
    }

    /**
     * Receive model with fixed enum discriminator type.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test fixed enum type for discriminator.
     */
    @Metadata(generated = true)
    public Snake getFixedModel() {
        // Generated convenience method for getFixedModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getFixedModelWithResponse(requestOptions).getValue();
    }

    /**
     * Send model with fixed enum discriminator type.
     * 
     * @param input Snake to create.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void putFixedModel(Snake input) {
        // Generated convenience method for putFixedModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putFixedModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * Get a model omitting the discriminator.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model omitting the discriminator.
     */
    @Metadata(generated = true)
    public Snake getFixedModelMissingDiscriminator() {
        // Generated convenience method for getFixedModelMissingDiscriminatorWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getFixedModelMissingDiscriminatorWithResponse(requestOptions).getValue();
    }

    /**
     * Get a model containing discriminator value never defined.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model containing discriminator value never defined.
     */
    @Metadata(generated = true)
    public Snake getFixedModelWrongDiscriminator() {
        // Generated convenience method for getFixedModelWrongDiscriminatorWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getFixedModelWrongDiscriminatorWithResponse(requestOptions).getValue();
    }
}
