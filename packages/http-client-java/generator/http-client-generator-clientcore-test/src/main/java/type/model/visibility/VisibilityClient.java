package type.model.visibility;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.model.visibility.implementation.VisibilityClientImpl;

/**
 * Initializes a new instance of the synchronous VisibilityClient type.
 */
@ServiceClient(builder = VisibilityClientBuilder.class)
public final class VisibilityClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final VisibilityClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of VisibilityClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    VisibilityClient(VisibilityClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The getModel operation.
     * 
     * @param queryProp Required int32, illustrating a query property.
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return output model with visibility properties along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<VisibilityModel> getModelWithResponse(int queryProp, VisibilityModel input,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.getModel", requestContext,
            updatedContext -> this.serviceClient.getModelWithResponse(queryProp, input, updatedContext));
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public VisibilityModel getModel(int queryProp, VisibilityModel input) {
        return getModelWithResponse(queryProp, input, RequestContext.none()).getValue();
    }

    /**
     * The headModel operation.
     * 
     * @param queryProp Required int32, illustrating a query property.
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> headModelWithResponse(int queryProp, VisibilityModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.headModel", requestContext,
            updatedContext -> this.serviceClient.headModelWithResponse(queryProp, input, updatedContext));
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void headModel(int queryProp, VisibilityModel input) {
        headModelWithResponse(queryProp, input, RequestContext.none());
    }

    /**
     * The putModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.putModel", requestContext,
            updatedContext -> this.serviceClient.putModelWithResponse(input, updatedContext));
    }

    /**
     * The putModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putModel(VisibilityModel input) {
        putModelWithResponse(input, RequestContext.none());
    }

    /**
     * The patchModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> patchModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.patchModel", requestContext,
            updatedContext -> this.serviceClient.patchModelWithResponse(input, updatedContext));
    }

    /**
     * The patchModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void patchModel(VisibilityModel input) {
        patchModelWithResponse(input, RequestContext.none());
    }

    /**
     * The postModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.postModel", requestContext,
            updatedContext -> this.serviceClient.postModelWithResponse(input, updatedContext));
    }

    /**
     * The postModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void postModel(VisibilityModel input) {
        postModelWithResponse(input, RequestContext.none());
    }

    /**
     * The deleteModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> deleteModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.deleteModel", requestContext,
            updatedContext -> this.serviceClient.deleteModelWithResponse(input, updatedContext));
    }

    /**
     * The deleteModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void deleteModel(VisibilityModel input) {
        deleteModelWithResponse(input, RequestContext.none());
    }

    /**
     * The putReadOnlyModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return roundTrip model with readonly optional properties along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ReadOnlyModel> putReadOnlyModelWithResponse(ReadOnlyModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.putReadOnlyModel", requestContext,
            updatedContext -> this.serviceClient.putReadOnlyModelWithResponse(input, updatedContext));
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ReadOnlyModel putReadOnlyModel(ReadOnlyModel input) {
        return putReadOnlyModelWithResponse(input, RequestContext.none()).getValue();
    }
}
