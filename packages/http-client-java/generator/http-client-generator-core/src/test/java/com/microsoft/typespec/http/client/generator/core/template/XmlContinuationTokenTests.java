// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.azure.core.http.HttpHeaders;
import com.azure.core.http.rest.PagedResponse;
import com.azure.core.http.rest.Response;
import com.azure.core.http.rest.SimpleResponse;
import com.azure.core.util.BinaryData;
import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelPropertySegment;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFileContents;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import io.clientcore.core.utils.IOExceptionCheckedFunction;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.parallel.Isolated;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

@Isolated
public class XmlContinuationTokenTests {
    @TempDir
    Path compilationDirectory;

    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @ParameterizedTest
    @CsvSource({
        "true,false,false",
        "true,true,false",
        "true,false,true",
        "true,true,true",
        "false,false,false",
        "false,true,false" })
    public void readsXmlToken(boolean attribute, boolean nested, boolean namespaced) throws Exception {
        new MockUnitJavagen() {
            @Override
            @SuppressWarnings("unchecked")
            public <T> T getValue(String key, IOExceptionCheckedFunction<String, T> converter) {
                return "data-plane".equals(key) ? (T) Boolean.TRUE : super.getValue(key, converter);
            }
        };
        JavaSettings.clear();
        ClassType xmlType = new ClassType.Builder().name("XmlPage").packageName("test").usedInXml(true).build();
        ClassType itemType = new ClassType.Builder().name("Item").packageName("test").build();
        List<ModelPropertySegment> tokenPath = new ArrayList<>();
        if (nested) {
            tokenPath.add(new ModelPropertySegment(null,
                new ClientModelProperty.Builder().name("paging").xmlName("Paging").wireType(xmlType).build()));
        }
        tokenPath.add(new ModelPropertySegment(null,
            new ClientModelProperty.Builder().name("nextMarker")
                .xmlName("NextMarker")
                .xmlAttribute(attribute)
                .xmlNamespace(namespaced ? "urn:paging" : null)
                .wireType(ClassType.STRING)
                .build()));
        ProxyMethod proxy = new ProxyMethod.Builder().name("list")
            .parameters(List.of())
            .allParameters(List.of())
            .rawResponseBodyType(xmlType)
            .returnType(GenericType.response(ClassType.BINARY_DATA))
            .responseExpectedStatusCodes(List.of(200))
            .build();
        ClientMethod method = new ClientMethod.Builder().name("list")
            .description("List items.")
            .type(ClientMethodType.PagingSync)
            .parameters(List.of(ClientMethodParameter.REQUEST_OPTIONS_PARAMETER))
            .returnValue(new ReturnValue("The items.", GenericType.pagedIterable(ClassType.BINARY_DATA)))
            .proxyMethod(proxy)
            .validateExpressions(Map.of())
            .requiredNullableParameterExpressions(List.of())
            .methodPageDetails(new MethodPageDetails(
                List.of(new ModelPropertySegment(null,
                    new ClientModelProperty.Builder().name("items")
                        .xmlName("Items")
                        .xmlListElementName("Item")
                        .clientType(new ListType(itemType))
                        .build())),
                null, null, null,
                new MethodPageDetails.ContinuationToken(new ProxyMethodParameter.Builder().name("token")
                    .requestParameterName("token")
                    .requestParameterLocation(RequestParameterLocation.QUERY)
                    .build(), null, null, tokenPath),
                null, null))
            .build();
        JavaFileContents contents = new JavaFileContents();
        JavaClass classBlock = new JavaClass(contents);
        TemplateUtil.writeClientMethodsAndHelpers(classBlock, List.of(method));
        classBlock.publicMethod("PagedResponse<BinaryData> read(Response<BinaryData> res)",
            block -> ClientMethodTemplate.getInstance()
                .pagedSinglePageResponseConversion(proxy, method, JavaSettings.getInstance(), block));
        ClientMethod nextLinkMethod = method.newBuilder()
            .methodPageDetails(new MethodPageDetails(method.getMethodPageDetails().getPageItemsPropertyReference(),
                tokenPath, null, null, null, null, null))
            .build();
        classBlock.publicMethod("PagedResponse<BinaryData> readNextLink(Response<BinaryData> res)",
            block -> ClientMethodTemplate.getInstance()
                .pagedSinglePageResponseConversion(proxy, nextLinkMethod, JavaSettings.getInstance(), block));
        String source = "package test;\nimport com.azure.core.annotation.*;\nimport com.azure.core.http.rest.*;\n"
            + "import com.azure.core.util.*;\nimport com.azure.core.util.serializer.*;\n"
            + "import java.util.*;\nimport java.util.stream.Collectors;\n" + "public class XmlPagingCompilation {\n"
            + contents + "\nprivate PagedResponse<BinaryData> listSinglePage(RequestOptions options) { return null; }\n"
            + "private PagedFlux<BinaryData> listAsync(RequestOptions options) { return null; }\n}\n"
            + "class Item { static Item fromXml(com.azure.xml.XmlReader reader, String root)"
            + " throws javax.xml.stream.XMLStreamException { reader.skipElement(); return new Item(); } }\n";
        Path file = compilationDirectory.resolve("XmlPagingCompilation.java");
        Files.writeString(file, source);
        Path provider = compilationDirectory.resolve("XmlSerializerProviders.java");
        Path serializer = compilationDirectory.resolve("XmlSerializer.java");
        Files.writeString(provider,
            "package test;\n" + TemplateUtil.loadTextFromResource("XmlSerializerProviders.java"));
        Files.writeString(serializer, "package test;\n" + TemplateUtil.loadTextFromResource("XmlSerializer.java"));
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        int result = ToolProvider.getSystemJavaCompiler()
            .run(null, diagnostics, diagnostics, "--release", "11", "-classpath",
                System.getProperty("surefire.test.class.path", System.getProperty("java.class.path")), "-d",
                compilationDirectory.toString(), file.toString(), provider.toString(), serializer.toString());
        Assertions.assertEquals(0, result, () -> diagnostics.toString(StandardCharsets.UTF_8) + "\n" + source);
        String marker = namespaced ? "p:NextMarker" : "NextMarker";
        String token = attribute ? " " + marker + "=\"page2\"" : "<" + marker + ">page2</" + marker + ">";
        String element = nested ? "Paging" : "PetListResult";
        String xml = attribute
            ? "<" + element + token + "></" + element + ">"
            : "<" + element + ">" + token + "</" + element + ">";
        if (nested) {
            xml = "<PetListResult>" + xml + "</PetListResult>";
        }
        xml = xml.replaceFirst("<PetListResult", "<PetListResult xmlns:p=\"urn:paging\"");
        try (URLClassLoader loader
            = new URLClassLoader(new URL[] { compilationDirectory.toUri().toURL() }, getClass().getClassLoader())) {
            Class<?> generated = loader.loadClass("test.XmlPagingCompilation");
            Object client = generated.getConstructor().newInstance();
            for (String methodName : List.of("read", "readNextLink")) {
                var read = generated.getMethod(methodName, Response.class);
                PagedResponse<?> page = (PagedResponse<?>) read.invoke(client,
                    new SimpleResponse<>(null, 200, new HttpHeaders(), BinaryData.fromString(xml)));
                Assertions.assertEquals("page2", page.getContinuationToken());
                PagedResponse<?> lastPage = (PagedResponse<?>) read.invoke(client,
                    new SimpleResponse<>(null, 200, new HttpHeaders(), BinaryData.fromString(xml.replace(token, ""))));
                Assertions.assertNull(lastPage.getContinuationToken());
            }
        }
    }
}
