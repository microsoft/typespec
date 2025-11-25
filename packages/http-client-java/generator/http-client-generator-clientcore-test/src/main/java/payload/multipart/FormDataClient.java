package payload.multipart;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import payload.multipart.formdata.AnonymousModelRequest;
import payload.multipart.implementation.FormDatasImpl;

/**
 * Initializes a new instance of the synchronous MultiPartClient type.
 */
@ServiceClient(builder = MultiPartClientBuilder.class)
public final class FormDataClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final FormDatasImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FormDataClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    FormDataClient(FormDatasImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> basicWithResponse(MultiPartRequest body, RequestContext requestContext) {
        // Operation 'basic' is of content-type 'multipart/form-data'. Protocol API is not usable and hence not
        // generated.
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.basic", requestContext,
            updatedContext -> this.serviceClient.basicWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void basic(MultiPartRequest body) {
        basicWithResponse(body, RequestContext.none());
    }

    /**
     * Test content-type: multipart/form-data for mixed scenarios.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> fileArrayAndBasicWithResponse(ComplexPartsRequest body, RequestContext requestContext) {
        // Operation 'fileArrayAndBasic' is of content-type 'multipart/form-data'. Protocol API is not usable and hence
        // not generated.
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.fileArrayAndBasic",
            requestContext, updatedContext -> this.serviceClient.fileArrayAndBasicWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: multipart/form-data for mixed scenarios.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void fileArrayAndBasic(ComplexPartsRequest body) {
        fileArrayAndBasicWithResponse(body, RequestContext.none());
    }

    /**
     * Test content-type: multipart/form-data for scenario contains json part and binary part.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> jsonPartWithResponse(JsonPartRequest body, RequestContext requestContext) {
        // Operation 'jsonPart' is of content-type 'multipart/form-data'. Protocol API is not usable and hence not
        // generated.
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.jsonPart", requestContext,
            updatedContext -> this.serviceClient.jsonPartWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: multipart/form-data for scenario contains json part and binary part.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void jsonPart(JsonPartRequest body) {
        jsonPartWithResponse(body, RequestContext.none());
    }

    /**
     * Test content-type: multipart/form-data for scenario contains multi binary parts.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> binaryArrayPartsWithResponse(BinaryArrayPartsRequest body, RequestContext requestContext) {
        // Operation 'binaryArrayParts' is of content-type 'multipart/form-data'. Protocol API is not usable and hence
        // not generated.
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.binaryArrayParts",
            requestContext, updatedContext -> this.serviceClient.binaryArrayPartsWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: multipart/form-data for scenario contains multi binary parts.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void binaryArrayParts(BinaryArrayPartsRequest body) {
        binaryArrayPartsWithResponse(body, RequestContext.none());
    }

    /**
     * Test content-type: multipart/form-data for scenario contains multi binary parts.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> multiBinaryPartsWithResponse(MultiBinaryPartsRequest body, RequestContext requestContext) {
        // Operation 'multiBinaryParts' is of content-type 'multipart/form-data'. Protocol API is not usable and hence
        // not generated.
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.multiBinaryParts",
            requestContext, updatedContext -> this.serviceClient.multiBinaryPartsWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: multipart/form-data for scenario contains multi binary parts.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void multiBinaryParts(MultiBinaryPartsRequest body) {
        multiBinaryPartsWithResponse(body, RequestContext.none());
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> checkFileNameAndContentTypeWithResponse(MultiPartRequest body,
        RequestContext requestContext) {
        // Operation 'checkFileNameAndContentType' is of content-type 'multipart/form-data'. Protocol API is not usable
        // and hence not generated.
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.checkFileNameAndContentType",
            requestContext,
            updatedContext -> this.serviceClient.checkFileNameAndContentTypeWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void checkFileNameAndContentType(MultiPartRequest body) {
        checkFileNameAndContentTypeWithResponse(body, RequestContext.none());
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> anonymousModelWithResponse(AnonymousModelRequest body, RequestContext requestContext) {
        // Operation 'anonymousModel' is of content-type 'multipart/form-data'. Protocol API is not usable and hence not
        // generated.
        return this.instrumentation.instrumentWithResponse("Payload.MultiPart.FormData.anonymousModel", requestContext,
            updatedContext -> this.serviceClient.anonymousModelWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: multipart/form-data.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void anonymousModel(AnonymousModelRequest body) {
        anonymousModelWithResponse(body, RequestContext.none());
    }
}
