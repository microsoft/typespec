package type.scalar;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import java.math.BigDecimal;
import type.scalar.implementation.Decimal128TypesImpl;

/**
 * Initializes a new instance of the synchronous ScalarClient type.
 */
@ServiceClient(builder = ScalarClientBuilder.class)
public final class Decimal128TypeClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final Decimal128TypesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of Decimal128TypeClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    Decimal128TypeClient(Decimal128TypesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The responseBody operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a 128-bit decimal number along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BigDecimal> responseBodyWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.Decimal128Type.responseBody", requestContext,
            updatedContext -> this.serviceClient.responseBodyWithResponse(updatedContext));
    }

    /**
     * The responseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a 128-bit decimal number.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BigDecimal responseBody() {
        return responseBodyWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The requestBody operation.
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
    public Response<Void> requestBodyWithResponse(BigDecimal body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.Decimal128Type.requestBody", requestContext,
            updatedContext -> this.serviceClient.requestBodyWithResponse(body, updatedContext));
    }

    /**
     * The requestBody operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void requestBody(BigDecimal body) {
        requestBodyWithResponse(body, RequestContext.none());
    }

    /**
     * The requestParameter operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> requestParameterWithResponse(BigDecimal value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.Decimal128Type.requestParameter",
            requestContext, updatedContext -> this.serviceClient.requestParameterWithResponse(value, updatedContext));
    }

    /**
     * The requestParameter operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void requestParameter(BigDecimal value) {
        requestParameterWithResponse(value, RequestContext.none());
    }
}
