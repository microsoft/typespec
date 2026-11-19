// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

public class ResponseStatusCodeNormalizationTests extends NormalizationTestBase {
    @ParameterizedTest
    @CsvSource({
        "getWidget, GET",
        "GetWidget, get",
        "GETWidget, gEt",
        "listWidgets, GET",
        "LIST, get",
        "ListByResourceGroup, GET" })
    public void removes404ResponsesAndStatusCodesFromGetAndListOperations(String name, String method) {
        Operation operation = operation(name, method, "/widgets");
        Response success = response("200");
        Response notFound = response("404");
        Response combined = response("201", "404", "206");
        Response noContent = response("204");
        Response exception = response("404");
        operation.getResponses().addAll(List.of(success, notFound, combined, noContent));
        operation.getExceptions().add(exception);
        CodeModel model = model(operation);

        assertSame(model, new ResponseStatusCodeNormalization().process(model));

        assertEquals(List.of(success, combined, noContent), operation.getResponses());
        assertEquals(List.of("201", "206"), combined.getProtocol().getHttp().getStatusCodes());
        assertEquals(List.of("200"), success.getProtocol().getHttp().getStatusCodes());
        assertEquals(List.of("204"), noContent.getProtocol().getHttp().getStatusCodes());
        assertEquals(List.of(exception), operation.getExceptions());
        assertEquals(List.of("404"), exception.getProtocol().getHttp().getStatusCodes());
    }

    @ParameterizedTest
    @ValueSource(strings = { "fetchWidget", "checkWidget", "targetWidget" })
    public void preserves404sForOtherOperationNames(String name) {
        Operation operation = operation(name, "GET", "/widgets");
        Response notFound = response("404");
        Response combined = response("200", "404");
        operation.getResponses().addAll(List.of(notFound, combined));

        new ResponseStatusCodeNormalization().process(model(operation));

        assertEquals(List.of(notFound, combined), operation.getResponses());
        assertEquals(List.of("404"), notFound.getProtocol().getHttp().getStatusCodes());
        assertEquals(List.of("200", "404"), combined.getProtocol().getHttp().getStatusCodes());
    }

    @ParameterizedTest
    @ValueSource(strings = { "POST", "PUT", "PATCH", "DELETE", "HEAD" })
    public void preserves404sForNonGetRequests(String method) {
        Operation operation = operation("getWidget", method, "/widgets");
        Response notFound = response("404");
        Response combined = response("200", "404");
        operation.getResponses().addAll(List.of(notFound, combined));

        new ResponseStatusCodeNormalization().process(model(operation));

        assertEquals(List.of(notFound, combined), operation.getResponses());
        assertEquals(List.of("200", "404"), combined.getProtocol().getHttp().getStatusCodes());
    }

    @Test
    public void recognizesGetRequestsAfterTheFirstRequest() {
        Operation operation = operation("getWidget", "POST", "/widgets");
        operation.getRequests().add(new Request());
        operation.getRequests().add(request("get", "/widgets"));
        operation.getResponses().add(response("404"));
        Response success = response("200");
        operation.getResponses().add(success);

        new ResponseStatusCodeNormalization().process(model(operation));

        assertEquals(List.of(success), operation.getResponses());
    }

    @Test
    public void preservesResponsesWhenNoRequestHasGetMetadata() {
        Operation operation = operation("getWidget", "POST", "/widgets");
        operation.getRequests().add(new Request());
        Request noHttp = new Request();
        noHttp.setProtocol(new Protocols());
        operation.getRequests().add(noHttp);
        operation.getRequests().add(request(null, "/widgets"));
        Response notFound = response("404");
        operation.getResponses().add(notFound);

        new ResponseStatusCodeNormalization().process(model(operation));

        assertEquals(List.of(notFound), operation.getResponses());
        assertEquals(List.of("404"), notFound.getProtocol().getHttp().getStatusCodes());
    }

    @Test
    public void preservesResponsesWithOtherStatusesOrMissingHttpMetadata() {
        Operation operation = operation("getWidget", "GET", "/widgets");
        Response noProtocol = new Response();
        Response noHttp = new Response();
        noHttp.setProtocol(new Protocols());
        Response noStatusCodes = new Response();
        noStatusCodes.setProtocol(protocol(new Protocol()));
        List<Response> responses
            = List.of(noProtocol, noHttp, noStatusCodes, response(), response("200", "400", "500"));
        operation.getResponses().addAll(responses);

        new ResponseStatusCodeNormalization().process(model(operation));

        assertEquals(responses, operation.getResponses());
        assertEquals(List.of("200", "400", "500"),
            operation.getResponses().get(4).getProtocol().getHttp().getStatusCodes());
    }

    @Test
    public void normalizationIsIdempotent() {
        Operation operation = operation("getWidget", "GET", "/widgets");
        Response combined = response("200", "404");
        operation.getResponses().addAll(List.of(response("404"), combined));
        CodeModel model = model(operation);
        ResponseStatusCodeNormalization normalization = new ResponseStatusCodeNormalization();

        normalization.process(model);
        normalization.process(model);

        assertEquals(List.of(combined), operation.getResponses());
        assertEquals(List.of("200"), combined.getProtocol().getHttp().getStatusCodes());
    }

    private static Response response(String... statusCodes) {
        Protocol http = new Protocol();
        http.setStatusCodes(new ArrayList<>(Arrays.asList(statusCodes)));
        Response response = new Response();
        response.setProtocol(protocol(http));
        return response;
    }
}
