// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class SseConvenienceMethodTemplateTests {
    @Test
    public void avoidsEnclosingParametersAndSuffixes() {
        for (boolean async : List.of(false, true)) {
            String output = render(async, true, true, List.of("response", "response1", "value", "value1"), List.of());
            Assertions.assertTrue(output.contains(", value2 -> true)"), output);
            if (async) {
                Assertions.assertTrue(output.contains(".flatMapMany(response2 -> "), output);
                Assertions.assertTrue(output.contains("toFlux(response2, "), output);
            }
        }
    }

    @Test
    public void avoidsTransformationLocalsAndSuffixes() {
        for (boolean async : List.of(false, true)) {
            String output = render(async, true, true, List.of("response1", "value1"),
                List.of("response", "response2", "value", "value2"));
            Assertions.assertTrue(output.contains(", value3 -> true)"), output);
            if (async) {
                Assertions.assertTrue(output.contains(".flatMapMany(response3 -> "), output);
                Assertions.assertTrue(output.contains("toFlux(response3, "), output);
            }
        }
    }

    @Test
    public void preservesOrdinaryNamesAndWrapperTerminalReferences() {
        for (boolean async : List.of(false, true)) {
            String terminal = render(async, true, true, List.of(), List.of());
            Assertions.assertTrue(terminal.contains(", value -> true)"), terminal);
            String nonterminal = render(async, true, false, List.of("value"), List.of());
            Assertions.assertFalse(nonterminal.contains(" -> true"), nonterminal);
            String wrapper = render(async, false, true, List.of("response", "value"), List.of("response1"));
            Assertions.assertTrue(wrapper.contains(", Event::isTerminal)"), wrapper);
            Assertions.assertFalse(wrapper.contains(" -> true"), wrapper);
            if (async) {
                Assertions.assertTrue(terminal.contains(".flatMapMany(response -> "), terminal);
                Assertions.assertTrue(nonterminal.contains(".flatMapMany(response -> "), nonterminal);
                Assertions.assertTrue(wrapper.contains(".flatMapMany(response2 -> "), wrapper);
            }
        }
    }

    private static String render(boolean async, boolean direct, boolean terminal, List<String> parameters,
        List<String> locals) {
        SseEventMetadata event = new SseEventMetadata();
        event.setName(direct ? null : "update");
        event.setPayload(new StringSchema());
        event.setTerminal(terminal);
        SseMetadata metadata = new SseMetadata();
        metadata.setStreamName("Events");
        metadata.setModelNamespace("test");
        metadata.setEvents(List.of(event));
        ProxyMethod proxy = new ProxyMethod.Builder().name("read")
            .responseBodyType(ClassType.BINARY_DATA)
            .rawResponseBodyType(ClassType.STRING)
            .responseContentTypes(java.util.Set.of("text/event-stream"))
            .build();
        ClientMethod protocol = new ClientMethod.Builder().name("readWithResponse")
            .parameters(List.of())
            .proxyMethod(proxy)
            .type(async ? ClientMethodType.SimpleAsyncRestResponse : ClientMethodType.SimpleSyncRestResponse)
            .returnValue(new ReturnValue("response",
                async
                    ? GenericType.mono(GenericType.response(ClassType.BINARY_DATA))
                    : GenericType.response(ClassType.BINARY_DATA)))
            .build();
        ClientMethod convenience = new ClientMethod.Builder().name("read")
            .parameters(
                parameters.stream().map(SseConvenienceMethodTemplateTests::parameter).collect(Collectors.toList()))
            .parameterTransformations(new ParameterTransformations(locals.stream()
                .map(name -> new ParameterTransformation(parameter(name), List.of()))
                .collect(Collectors.toList())))
            .proxyMethod(proxy)
            .sseMetadata(metadata)
            .type(async ? ClientMethodType.SseAsync : ClientMethodType.SseSync)
            .returnValue(new ReturnValue("events",
                async ? GenericType.flux(ClassType.STRING) : GenericType.closeableIterableStream(ClassType.STRING)))
            .build();
        JavaFileContents contents = new JavaFileContents();
        ConvenienceMethodTemplateBase template
            = async ? ConvenienceAsyncMethodTemplate.getInstance() : ConvenienceSyncMethodTemplate.getInstance();
        template.writeInvocationAndConversion(convenience, protocol, "requestOptions", new JavaBlock(contents),
            new HashSet<>());
        return contents.toString();
    }

    private static ClientMethodParameter parameter(String name) {
        return new ClientMethodParameter.Builder().name(name).annotations(List.of()).wireType(ClassType.STRING).build();
    }
}
