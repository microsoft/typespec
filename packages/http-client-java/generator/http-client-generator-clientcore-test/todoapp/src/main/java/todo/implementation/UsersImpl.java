package todo.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.Response;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;
import todo.Standard4XXResponse;
import todo.Standard5XXResponse;
import todo.User;
import todo.users.InvalidUserResponse;
import todo.users.UserCreatedResponse;
import todo.users.UserExistsResponse;

/**
 * An instance of this class provides access to all the operations defined in Users.
 */
public final class UsersImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final UsersService service;

    /**
     * The service client containing this operation class.
     */
    private final TodoClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of UsersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    UsersImpl(TodoClientImpl client) {
        this.service = UsersService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for TodoClientUsers to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "TodoClientUsers", host = "{endpoint}")
    public interface UsersService {
        static UsersService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("todo.implementation.UsersServiceImpl");
                return (UsersService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.POST, path = "/users", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                500,
                501,
                502,
                503,
                504,
                505,
                506,
                507,
                508,
                509,
                510,
                511,
                512,
                513,
                514,
                515,
                516,
                517,
                518,
                519,
                520,
                521,
                522,
                523,
                524,
                525,
                526,
                527,
                528,
                529,
                530,
                531,
                532,
                533,
                534,
                535,
                536,
                537,
                538,
                539,
                540,
                541,
                542,
                543,
                544,
                545,
                546,
                547,
                548,
                549,
                550,
                551,
                552,
                553,
                554,
                555,
                556,
                557,
                558,
                559,
                560,
                561,
                562,
                563,
                564,
                565,
                566,
                567,
                568,
                569,
                570,
                571,
                572,
                573,
                574,
                575,
                576,
                577,
                578,
                579,
                580,
                581,
                582,
                583,
                584,
                585,
                586,
                587,
                588,
                589,
                590,
                591,
                592,
                593,
                594,
                595,
                596,
                597,
                598,
                599 },
            exceptionBodyClass = Standard5XXResponse.class)
        @UnexpectedResponseExceptionDetail(statusCode = { 422 }, exceptionBodyClass = InvalidUserResponse.class)
        @UnexpectedResponseExceptionDetail(statusCode = { 409 }, exceptionBodyClass = UserExistsResponse.class)
        @UnexpectedResponseExceptionDetail(
            statusCode = {
                400,
                401,
                402,
                403,
                404,
                405,
                406,
                407,
                408,
                410,
                411,
                412,
                413,
                414,
                415,
                416,
                417,
                418,
                419,
                420,
                421,
                423,
                424,
                425,
                426,
                427,
                428,
                429,
                430,
                431,
                432,
                433,
                434,
                435,
                436,
                437,
                438,
                439,
                440,
                441,
                442,
                443,
                444,
                445,
                446,
                447,
                448,
                449,
                450,
                451,
                452,
                453,
                454,
                455,
                456,
                457,
                458,
                459,
                460,
                461,
                462,
                463,
                464,
                465,
                466,
                467,
                468,
                469,
                470,
                471,
                472,
                473,
                474,
                475,
                476,
                477,
                478,
                479,
                480,
                481,
                482,
                483,
                484,
                485,
                486,
                487,
                488,
                489,
                490,
                491,
                492,
                493,
                494,
                495,
                496,
                497,
                498,
                499 },
            exceptionBodyClass = Standard4XXResponse.class)
        @UnexpectedResponseExceptionDetail
        Response<UserCreatedResponse> create(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") User user, RequestContext requestContext);
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<UserCreatedResponse> createWithResponse(User user, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Todo.Users.create", requestContext, updatedContext -> {
            final String contentType = "application/json";
            final String accept = "application/json";
            return service.create(this.client.getEndpoint(), contentType, accept, user, updatedContext);
        });
    }
}
