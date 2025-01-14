// Code generated by Microsoft (R) TypeSpec Code Generator.

package payload.multipart;

import io.clientcore.core.annotation.Metadata;
import io.clientcore.core.annotation.ServiceClient;
import io.clientcore.core.http.exception.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.util.binarydata.BinaryData;
import payload.multipart.formdata.httpparts.nonstring.FloatRequest;
import payload.multipart.implementation.FormDataHttpPartsNonStringsImpl;
import payload.multipart.implementation.MultipartFormDataHelper;

/**
 * Initializes a new instance of the synchronous MultiPartClient type.
 */
@ServiceClient(builder = MultiPartClientBuilder.class)
public final class FormDataHttpPartsNonStringClient {
    @Metadata(generated = true)
    private final FormDataHttpPartsNonStringsImpl serviceClient;

    /**
     * Initializes an instance of FormDataHttpPartsNonStringClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    FormDataHttpPartsNonStringClient(FormDataHttpPartsNonStringsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * Test content-type: multipart/form-data for non string.
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    Response<Void> floatMethodWithResponse(BinaryData body, RequestOptions requestOptions) {
        // Protocol API requires serialization of parts with content-disposition and data, as operation 'float' is
        // 'multipart/form-data'
        return this.serviceClient.floatMethodWithResponse(body, requestOptions);
    }

    /**
     * Test content-type: multipart/form-data for non string.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void floatMethod(FloatRequest body) {
        // Generated convenience method for floatMethodWithResponse
        RequestOptions requestOptions = new RequestOptions();
        floatMethodWithResponse(new MultipartFormDataHelper(requestOptions)
            .serializeTextField("temperature", String.valueOf(body.getTemperature()))
            .end()
            .getRequestBody(), requestOptions).getValue();
    }
}
