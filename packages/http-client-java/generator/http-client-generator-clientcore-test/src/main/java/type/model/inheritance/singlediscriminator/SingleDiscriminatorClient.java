package type.model.inheritance.singlediscriminator;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.model.inheritance.singlediscriminator.implementation.SingleDiscriminatorClientImpl;

/**
 * Initializes a new instance of the synchronous SingleDiscriminatorClient type.
 */
@ServiceClient(builder = SingleDiscriminatorClientBuilder.class)
public final class SingleDiscriminatorClient {
    @Metadata(generated = true)
    private final SingleDiscriminatorClientImpl serviceClient;

    /**
     * Initializes an instance of SingleDiscriminatorClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    SingleDiscriminatorClient(SingleDiscriminatorClientImpl serviceClient) {
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
     *     wingspan: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Response<Bird> getModelWithResponse(RequestOptions requestOptions) {
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
     *     wingspan: int (Required)
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
     *     wingspan: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Response<Bird> getRecursiveModelWithResponse(RequestOptions requestOptions) {
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
     *     wingspan: int (Required)
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
     *     wingspan: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Response<Bird> getMissingDiscriminatorWithResponse(RequestOptions requestOptions) {
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
     *     wingspan: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Response<Bird> getWrongDiscriminatorWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getWrongDiscriminatorWithResponse(requestOptions);
    }

    /**
     * The getLegacyModel operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     size: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return define a base class in the legacy way.
     */
    @Metadata(generated = true)
    public Response<Dinosaur> getLegacyModelWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getLegacyModelWithResponse(requestOptions);
    }

    /**
     * The getModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Bird getModel() {
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
    public void putModel(Bird input) {
        // Generated convenience method for putModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The getRecursiveModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Bird getRecursiveModel() {
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
    public void putRecursiveModel(Bird input) {
        // Generated convenience method for putRecursiveModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        putRecursiveModelWithResponse(BinaryData.fromObject(input), requestOptions).getValue();
    }

    /**
     * The getMissingDiscriminator operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Bird getMissingDiscriminator() {
        // Generated convenience method for getMissingDiscriminatorWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getMissingDiscriminatorWithResponse(requestOptions).getValue();
    }

    /**
     * The getWrongDiscriminator operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    @Metadata(generated = true)
    public Bird getWrongDiscriminator() {
        // Generated convenience method for getWrongDiscriminatorWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getWrongDiscriminatorWithResponse(requestOptions).getValue();
    }

    /**
     * The getLegacyModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return define a base class in the legacy way.
     */
    @Metadata(generated = true)
    public Dinosaur getLegacyModel() {
        // Generated convenience method for getLegacyModelWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getLegacyModelWithResponse(requestOptions).getValue();
    }
}
