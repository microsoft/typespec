// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.cadl.enumservice;

import com.azure.core.http.HttpHeaders;
import com.azure.core.http.HttpMethod;
import com.azure.core.http.HttpRequest;
import com.azure.core.http.rest.RequestOptions;
import com.azure.core.http.rest.SimpleResponse;
import com.azure.core.util.BinaryData;
import com.cadl.enumservice.implementation.EnumServiceClientImpl;
import com.cadl.enumservice.models.ColorModel;
import com.cadl.enumservice.models.Priority;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import reactor.core.publisher.Mono;

import java.lang.reflect.Field;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;

public class EnumTests {

    @SuppressWarnings("unchecked")
    @Test
    public void testStringArrayInParameter() throws Exception {
        EnumServiceClientImpl impl = Mockito.mock(EnumServiceClientImpl.class);

        ArgumentCaptor<List<String>> enumArrayArgumentCaptor = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<RequestOptions> requestOptionsArgumentCaptor = ArgumentCaptor.forClass(RequestOptions.class);

        Mockito.when(impl.setStringEnumArrayWithResponseAsync(enumArrayArgumentCaptor.capture(), requestOptionsArgumentCaptor.capture()))
                .thenReturn(Mono.just(new SimpleResponse<>(null, 200, new HttpHeaders(), BinaryData.fromString("\"OK\""))));

        EnumServiceAsyncClient client = new EnumServiceAsyncClient(impl);

        // normal case
        client.setStringEnumArray(Arrays.asList(ColorModel.BLUE, ColorModel.GREEN), Arrays.asList(ColorModel.GREEN, ColorModel.RED)).block();

        Assertions.assertEquals(Arrays.asList(ColorModel.BLUE.toString(), ColorModel.GREEN.toString()),
            enumArrayArgumentCaptor.getValue());

        HttpRequest request = new HttpRequest(HttpMethod.POST, "http://endpoint/");
        getRequestCallback(requestOptionsArgumentCaptor.getValue()).accept(request);
        verifyQuery(request.getUrl().getQuery(), "colorArrayOpt",
            String.join(",", Arrays.asList(ColorModel.GREEN.toString(), ColorModel.RED.toString())));

        // case: array contains null
        client.setStringEnumArray(Arrays.asList(ColorModel.BLUE, null), Arrays.asList(null, ColorModel.RED)).block();

        Assertions.assertEquals(Arrays.asList(ColorModel.BLUE.toString(), ""), enumArrayArgumentCaptor.getValue());

        request = new HttpRequest(HttpMethod.POST, "http://endpoint/");
        getRequestCallback(requestOptionsArgumentCaptor.getValue()).accept(request);
        verifyQuery(request.getUrl().getQuery(), "colorArrayOpt", "," + ColorModel.RED);
    }

    @SuppressWarnings("unchecked")
    @Test
    public void testIntArrayInParameter() throws Exception {
        EnumServiceClientImpl impl = Mockito.mock(EnumServiceClientImpl.class);

        ArgumentCaptor<List<String>> enumArrayArgumentCaptor = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<RequestOptions> requestOptionsArgumentCaptor = ArgumentCaptor.forClass(RequestOptions.class);

        Mockito.when(impl.setIntEnumArrayWithResponseAsync(enumArrayArgumentCaptor.capture(), requestOptionsArgumentCaptor.capture()))
                .thenReturn(Mono.just(new SimpleResponse<>(null, 200, new HttpHeaders(), BinaryData.fromString("\"OK\""))));

        EnumServiceAsyncClient client = new EnumServiceAsyncClient(impl);

        // normal case
        client.setIntEnumArray(Arrays.asList(Priority.HIGH, Priority.LOW), Arrays.asList(Priority.LOW, Priority.HIGH))
            .block();

        Assertions.assertEquals(Arrays.asList("100", "0"), enumArrayArgumentCaptor.getValue());

        HttpRequest request = new HttpRequest(HttpMethod.POST, "http://endpoint/");
        getRequestCallback(requestOptionsArgumentCaptor.getValue()).accept(request);
        verifyQuery(request.getUrl().getQuery(), "priorityArrayOpt", "0,100");

        // case: array contains null
        client.setIntEnumArray(Arrays.asList(Priority.HIGH, null), Arrays.asList(null, Priority.HIGH)).block();

        Assertions.assertEquals(Arrays.asList("100", ""), enumArrayArgumentCaptor.getValue());

        request = new HttpRequest(HttpMethod.POST, "http://endpoint/");
        getRequestCallback(requestOptionsArgumentCaptor.getValue()).accept(request);
        verifyQuery(request.getUrl().getQuery(), "priorityArrayOpt", ",100");
    }

    @SuppressWarnings("unchecked")
    @Test
    public void testStringArrayAsMulti() throws Exception {
        EnumServiceClientImpl impl = Mockito.mock(EnumServiceClientImpl.class);

        ArgumentCaptor<List<String>> enumArrayArgumentCaptor = ArgumentCaptor.forClass(List.class);
        ArgumentCaptor<RequestOptions> requestOptionsArgumentCaptor = ArgumentCaptor.forClass(RequestOptions.class);

        Mockito.when(impl.setStringEnumMultiWithResponseAsync(enumArrayArgumentCaptor.capture(), requestOptionsArgumentCaptor.capture()))
                .thenReturn(Mono.just(new SimpleResponse<>(null, 200, new HttpHeaders(), BinaryData.fromString("\"OK\""))));

        EnumServiceAsyncClient client = new EnumServiceAsyncClient(impl);

        // normal case
        client.setStringEnumMulti(Arrays.asList(ColorModel.BLUE, ColorModel.GREEN), Arrays.asList(ColorModel.GREEN, ColorModel.RED)).block();

        Assertions.assertEquals(Arrays.asList(ColorModel.BLUE.toString(), ColorModel.GREEN.toString()),
            enumArrayArgumentCaptor.getValue());

        HttpRequest request = new HttpRequest(HttpMethod.POST, "http://endpoint/");
        getRequestCallback(requestOptionsArgumentCaptor.getValue()).accept(request);
        Assertions.assertEquals("colorArrayOpt=Green&colorArrayOpt=Red", request.getUrl().getQuery());
    }

    private static void verifyQuery(String query, String key, String value) {
        Assertions.assertEquals(
            URLEncoder.encode(key, StandardCharsets.UTF_8) + "=" + URLEncoder.encode( value, StandardCharsets.UTF_8),
            query);
    }

    @SuppressWarnings("unchecked")
    private static Consumer<HttpRequest> getRequestCallback(RequestOptions requestOptions)
        throws NoSuchFieldException, IllegalAccessException {
        Field field = RequestOptions.class.getDeclaredField("requestCallback");
        field.setAccessible(true);
        return (Consumer<HttpRequest>) field.get(requestOptions);
    }
}
