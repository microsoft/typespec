package specialwords;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import specialwords.extensiblestrings.ExtensibleString;
import specialwords.implementation.ExtensibleStringsImpl;

/**
 * Initializes a new instance of the synchronous SpecialWordsClient type.
 */
@ServiceClient(builder = SpecialWordsClientBuilder.class)
public final class ExtensibleStringsClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ExtensibleStringsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ExtensibleStringsClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ExtensibleStringsClient(ExtensibleStringsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The putExtensibleStringValue operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return verify enum member names that are special words using extensible enum (union) along with
     * {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ExtensibleString> putExtensibleStringValueWithResponse(ExtensibleString body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.ExtensibleStrings.putExtensibleStringValue",
            requestContext,
            updatedContext -> this.serviceClient.putExtensibleStringValueWithResponse(body, updatedContext));
    }

    /**
     * The putExtensibleStringValue operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return verify enum member names that are special words using extensible enum (union).
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ExtensibleString putExtensibleStringValue(ExtensibleString body) {
        return putExtensibleStringValueWithResponse(body, RequestContext.none()).getValue();
    }
}
