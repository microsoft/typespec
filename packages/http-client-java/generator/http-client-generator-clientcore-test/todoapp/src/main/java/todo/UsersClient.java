package todo;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.Response;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import todo.implementation.UsersImpl;
import todo.users.UserCreatedResponse;

/**
 * Initializes a new instance of the synchronous TodoClient type.
 */
@ServiceClient(builder = TodoClientBuilder.class)
public final class UsersClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final UsersImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of UsersClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    UsersClient(UsersImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The create operation.
     * 
     * @param user The user parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<UserCreatedResponse> createWithResponse(User user, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.Users.create", requestContext,
            updatedContext -> this.serviceClient.createWithResponse(user, updatedContext));
    }

    /**
     * The create operation.
     * 
     * @param user The user parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public UserCreatedResponse create(User user) {
        return createWithResponse(user, RequestContext.none()).getValue();
    }
}
