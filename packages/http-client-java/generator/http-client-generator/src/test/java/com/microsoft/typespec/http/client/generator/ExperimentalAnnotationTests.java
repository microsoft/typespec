// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator;

import com.github.javaparser.StaticJavaParser;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceValue;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Experimental;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Metadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schemas;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.implementation.OperationInstrumentationInfo;
import com.microsoft.typespec.http.client.generator.core.mapper.CustomClientParameterMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ApiMetadata;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodPageDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelPropertySegment;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ReturnValue;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaPackage;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.Templates;
import com.microsoft.typespec.http.client.generator.core.template.azurevnext.AzureVNextTemplateFactory;
import com.microsoft.typespec.http.client.generator.core.template.clientcore.ClientCoreTemplateFactory;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.ExperimentalAnnotationUtil;
import com.microsoft.typespec.http.client.generator.core.util.SchemaUtil;
import com.microsoft.typespec.http.client.generator.fluent.TypeSpecFluentPlugin;
import com.microsoft.typespec.http.client.generator.mgmt.mapper.FluentMapper;
import com.microsoft.typespec.http.client.generator.mgmt.model.arm.UrlPathSegments;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceCollection;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.LocalVariable;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.ResourceLocalVariables;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.DefinitionStage;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.create.ResourceCreate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.CollectionMethodOperationByIdTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethodParameterMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentMethodType;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.method.FluentParentMethod;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.fluentmodel.update.ResourceUpdate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentResourceCollectionInterfaceTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.template.FluentResourceModelInterfaceTemplate;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import io.clientcore.core.serialization.json.JsonReader;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.tools.ToolProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.yaml.snakeyaml.Yaml;

public class ExperimentalAnnotationTests extends JavaSettingsTestBase {
    private static final String ANNOTATION = "com.example.annotations.Preview";

    @ParameterizedTest
    @CsvSource({ "getById, QUERY", "getById, HEADER", "deleteById, QUERY", "deleteById, HEADER" })
    public void annotatesRetainedByIdParameters(String name, RequestParameterLocation location, @TempDir Path directory)
        throws Exception {
        new TypeSpecFluentPlugin(new EmitterOptions().setNamespace("com.example"), false);
        configureJavaSettings(
            Map.of("namespace", "com.example", "experimental-annotation", ANNOTATION, "fluent", "lite"));
        ClientMethodParameter parameter = new ClientMethodParameter.Builder().name("preview")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .requestParameterLocation(location)
            .apiMetadata(metadata(null))
            .build();
        ClientMethod method = new ClientMethod.Builder().name("read")
            .description("Reads a value.")
            .type(ClientMethodType.SimpleSyncRestResponse)
            .parameters(List.of(parameter, ClientMethodParameter.CONTEXT_PARAMETER))
            .returnValue(new ReturnValue("a value", GenericType.response(ClassType.STRING)))
            .methodVisibility(JavaVisibility.Public)
            .proxyMethod(new ProxyMethod.Builder().name("read").parameters(List.of()).allParameters(List.of()).build())
            .build();
        Client previousClient = FluentStatic.getClient();
        FluentStatic.setClient(new Client.Builder().responseModels(List.of()).build());
        try {
            FluentResourceCollection collection
                = new FluentResourceCollection(new MethodGroupClient.Builder().className("WidgetsClientImpl")
                    .interfaceName("WidgetsClient")
                    .clientMethods(List.of(method))
                    .build());
            FluentResourceModel model = new FluentResourceModel(new ClientModel.Builder().name("WidgetInner")
                .packageName("com.example.fluent.models")
                .properties(List.of())
                .build(), List.of());
            var helper
                = new CollectionMethodOperationByIdTemplate(model, name, List.of(), new UrlPathSegments("/widgets"),
                    true, new ResourceLocalVariables(method), collection.getMethods().get(0)).getMethodTemplate();
            Set<String> imports = new LinkedHashSet<>();
            method.addImportsTo(imports, false, JavaSettings.getInstance());
            JavaFile contract = new JavaFile("WidgetHelpers.java");
            contract.declarePackage("com.example");
            contract.declareImport(imports);
            contract.publicInterface("WidgetHelpers", helper::writeMethodInterface);
            JavaFile implementation = new JavaFile("WidgetHelpersImpl.java");
            implementation.declarePackage("com.example");
            implementation.declareImport(imports);
            implementation.publicFinalClass("WidgetHelpersImpl", block -> {
                helper.writeMethod(block);
                block.publicMethod(method.getDeclaration(), body -> body.methodReturn("null"));
            });
            for (JavaFile file : List.of(contract, implementation)) {
                var declaration = StaticJavaParser.parse(file.getContents().toString())
                    .getType(0)
                    .getMethodsByName(name + "WithResponse")
                    .get(0);
                Assertions.assertTrue(
                    declaration.getParameterByName("preview").orElseThrow().getAnnotationByName("Preview").isPresent(),
                    file.getContents().toString());
                Assertions.assertFalse(
                    declaration.getParameterByName("id").orElseThrow().getAnnotationByName("Preview").isPresent());
            }
            JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
            javaPackage.addExperimentalAnnotation();
            compile(directory, List.of(javaPackage.getJavaFiles().get(0), contract, implementation));
        } finally {
            FluentStatic.setClient(previousClient);
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void annotatesFluentParentParameters(boolean experimental, @TempDir Path directory) throws Exception {
        new TypeSpecFluentPlugin(new EmitterOptions().setNamespace("com.example"), false);
        configureJavaSettings(
            Map.of("namespace", "com.example", "experimental-annotation", ANNOTATION, "fluent", "lite"));
        ClientMethodParameter parent = new ClientMethodParameter.Builder().name("parent")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .apiMetadata(experimental ? metadata(null) : new ApiMetadata.Builder().build())
            .build();
        ClientMethodParameter stable
            = parent.newBuilder().name("stable").apiMetadata(new ApiMetadata.Builder().build()).build();
        ClientMethod method = new ClientMethod.Builder().parameters(List.of(parent, stable))
            .proxyMethod(new ProxyMethod.Builder().parameters(List.of(
                new ProxyMethodParameter.Builder().name("parent")
                    .wireType(ClassType.STRING)
                    .requestParameterLocation(RequestParameterLocation.PATH)
                    .build(),
                new ProxyMethodParameter.Builder().name("stable")
                    .wireType(ClassType.STRING)
                    .requestParameterLocation(RequestParameterLocation.PATH)
                    .build()))
                .build())
            .build();
        FluentResourceModel model = new FluentResourceModel(new ClientModel.Builder().name("WidgetInner")
            .packageName("com.example.fluent.models")
            .properties(List.of())
            .build(), List.of());
        DefinitionStage stage = new DefinitionStage("WithCreate");
        stage.setNextStage(stage);
        FluentParentMethod helper = new FluentParentMethod(model, FluentMethodType.CREATE_WITH, stage, "Parent",
            List.of(parent, stable), new ResourceLocalVariables(method));
        Set<String> imports = new LinkedHashSet<>();
        helper.addImportsTo(imports, false);
        JavaFile contract = new JavaFile("WidgetDefinition.java");
        contract.declarePackage("com.example");
        contract.declareImport(imports);
        contract.publicInterface("WidgetDefinition", block -> block.publicMethod(helper.getInterfaceMethodSignature()));
        contract.getContents().line("interface WithCreate {}");
        JavaFile implementation = new JavaFile("WidgetImpl.java");
        implementation.declarePackage("com.example");
        implementation.declareImport(imports);
        implementation.publicFinalClass("WidgetImpl", block -> {
            block.privateMemberVariable("String", "parent");
            block.privateMemberVariable("String", "stable");
            helper.getMethodTemplate().writeMethod(block);
        });
        for (JavaFile file : List.of(contract, implementation)) {
            var declaration = StaticJavaParser.parse(file.getContents().toString())
                .getType(0)
                .getMethodsByName("withExistingParent")
                .get(0);
            Assertions.assertEquals(experimental,
                declaration.getParameterByName("parent").orElseThrow().getAnnotationByName("Preview").isPresent(),
                file.getContents().toString());
            Assertions.assertFalse(
                declaration.getParameterByName("stable").orElseThrow().getAnnotationByName("Preview").isPresent());
        }
        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        compile(directory, List.of(javaPackage.getJavaFiles().get(0), contract, implementation));
    }

    @Test
    public void disabledByDefault() {
        Assertions.assertNull(JavaSettings.getInstance().getExperimentalAnnotation());
        Assertions.assertNull(ExperimentalAnnotationUtil.getAnnotation(metadata(null)));
    }

    @Test
    public void pluginSettingIsNotRetainedAcrossGenerations() throws Exception {
        try (JsonReader reader
            = JsonReader.fromString("{\"namespace\":\"com.example\",\"flavor\":\"azure\",\"experimental-annotation\":\""
                + ANNOTATION + "\"}")) {
            new TypeSpecPlugin(EmitterOptions.fromJson(reader), false);
        }
        Assertions.assertEquals(ANNOTATION, JavaSettings.getInstance().getExperimentalAnnotation());

        JavaSettings.clear();
        new TypeSpecPlugin(new EmitterOptions().setNamespace("com.example"), false);
        Assertions.assertNull(JavaSettings.getInstance().getExperimentalAnnotation());
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = { "generic", "standard" })
    public void doesNotEnableExperimentalAnnotationsForUnbranded(String flavor) throws Exception {
        String flavorOption = flavor == null ? "" : ",\"flavor\":\"" + flavor + "\"";
        try (JsonReader reader = JsonReader.fromString(
            "{\"namespace\":\"com.example\",\"experimental-annotation\":\"" + ANNOTATION + "\"" + flavorOption + "}")) {
            new TypeSpecPlugin(EmitterOptions.fromJson(reader), false);
        }
        Assertions.assertNull(JavaSettings.getInstance().getExperimentalAnnotation());
        Assertions.assertNull(ExperimentalAnnotationUtil.getAnnotation(metadata(null)));
        Set<String> imports = new LinkedHashSet<>();
        ExperimentalAnnotationUtil.addImportsTo(imports, metadata(null));
        Assertions.assertTrue(imports.isEmpty());
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "",
            "Preview",
            ".Preview",
            "com..Preview",
            "com.example.",
            "com.class.Preview",
            "com.example.1Preview",
            "com.example.Preview;class Injected {}" })
    public void rejectsInvalidAnnotationClassNames(String name) {
        configureJavaSettings(Map.of("experimental-annotation", name));
        Assertions.assertThrows(IllegalArgumentException.class, JavaSettings::getInstance);
    }

    @Test
    public void usesDefaultAndCustomWarnings() {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION));
        Assertions.assertEquals(ANNOTATION, JavaSettings.getInstance().getExperimentalAnnotation());
        Assertions.assertEquals("Preview(warningText = Preview.WARNING_TEXT)",
            ExperimentalAnnotationUtil.getAnnotation(metadata(null)));
        Assertions.assertEquals("Preview(warningText = \"Custom warning\")",
            ExperimentalAnnotationUtil.getAnnotation(metadata("Custom warning")));
        Assertions.assertEquals("Preview(warningText = \"\")", ExperimentalAnnotationUtil.getAnnotation(metadata("")));
        Assertions.assertNull(ExperimentalAnnotationUtil.getAnnotation(new ApiMetadata.Builder().build()));
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = { "Custom warning", "" })
    public void capturesDiagnosticIdWithoutChangingAnnotations(String warningText) {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION));
        Yaml yaml = new Yaml();
        Experimental experimental = yaml.loadAs("diagnosticId: PREVIEW001", Experimental.class);
        experimental.setWarningText(warningText);
        Map<String, Object> captured = yaml.load(yaml.dumpAsMap(experimental));
        Assertions.assertEquals("PREVIEW001", captured.get("diagnosticId"));
        ApiMetadata metadata = new ApiMetadata.Builder().experimental(experimental).build();
        String warningExpression
            = warningText == null ? "Preview.WARNING_TEXT" : ClassType.STRING.defaultValueExpression(warningText);
        Assertions.assertEquals("Preview(warningText = " + warningExpression + ")",
            ExperimentalAnnotationUtil.getAnnotation(metadata));
    }

    @Test
    public void capturesExperimentalMetadataOutsideLanguage() {
        Yaml yaml = new Yaml();
        String source = "experimental:\n  diagnosticId: PREVIEW001\n";
        Metadata metadata = yaml.loadAs(source, Metadata.class);
        Assertions.assertEquals("PREVIEW001", SchemaUtil.getExperimental(metadata).getDiagnosticId());
        ChoiceValue choice = yaml.loadAs(source, ChoiceValue.class);
        Assertions.assertEquals("PREVIEW001", choice.getExperimental().getDiagnosticId());
        Map<String, Object> captured = yaml.load(yaml.dumpAsMap(choice));
        Assertions.assertTrue(captured.containsKey("experimental"));
    }

    @ParameterizedTest
    @CsvSource({ "false, false", "false, true", "true, false", "true, true" })
    public void annotatesRequiredConstructorParameters(boolean streamStyle, boolean wireMismatch,
        @TempDir Path directory) throws Exception {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION, "required-fields-as-ctor-args", "true",
            "stream-style-serialization", Boolean.toString(streamStyle)));
        ClassType wireType = wireMismatch ? ClassType.DATE_TIME_RFC_1123 : ClassType.STRING;
        ClientModelProperty property = new ClientModelProperty.Builder().name("value")
            .serializedName("value")
            .annotationArguments("\"value\"")
            .wireType(wireType)
            .clientType(wireType.getClientType())
            .required(true)
            .apiMetadata(metadata(null))
            .build();
        ClientModelProperty stable = new ClientModelProperty.Builder().name("stable")
            .serializedName("stable")
            .annotationArguments("\"stable\"")
            .wireType(ClassType.STRING)
            .clientType(ClassType.STRING)
            .required(true)
            .build();
        ClientModel model = new ClientModel.Builder().name("Payload")
            .packageName("com.example")
            .properties(List.of(property, stable))
            .implementationDetails(new ImplementationDetails.Builder().usages(Set.of(ImplementationDetails.Usage.PUBLIC,
                ImplementationDetails.Usage.INPUT, ImplementationDetails.Usage.OUTPUT)).build())
            .build();
        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        javaPackage.addModel("com.example", "Payload", model);
        String source = javaPackage.getJavaFiles().get(1).getContents().toString();
        var constructors = StaticJavaParser.parse(source).getClassByName("Payload").orElseThrow().getConstructors();
        Assertions.assertEquals(!streamStyle && wireMismatch ? 2 : 1, constructors.size());
        constructors.forEach(constructor -> {
            Assertions.assertTrue(
                constructor.getParameterByName("value").orElseThrow().getAnnotationByName("Preview").isPresent(),
                constructor.toString());
            Assertions.assertFalse(
                constructor.getParameterByName("stable").orElseThrow().getAnnotationByName("Preview").isPresent(),
                constructor.toString());
        });
        compile(directory, javaPackage.getJavaFiles());
    }

    @ParameterizedTest
    @CsvSource({
        "false, false, QUERY",
        "false, true, QUERY",
        "true, false, QUERY",
        "true, true, QUERY",
        "false, false, HEADER",
        "false, true, HEADER",
        "true, false, HEADER",
        "true, true, HEADER" })
    public void mergesFluentSettersWithDifferentParameterAnnotations(boolean annotateCreate, boolean annotateUpdate,
        RequestParameterLocation location, @TempDir Path directory) throws Exception {
        new TypeSpecFluentPlugin(new EmitterOptions().setNamespace("com.example"), false);
        configureJavaSettings(
            Map.of("namespace", "com.example", "experimental-annotation", ANNOTATION, "fluent", "lite"));
        ClientModel inner = new ClientModel.Builder().name("WidgetInner")
            .packageName("com.example.fluent.models")
            .properties(List.of())
            .build();
        FluentResourceModel model = new FluentResourceModel(inner, List.of());
        DefinitionStage stage = new DefinitionStage("WithValue");
        stage.setNextStage(stage);
        ClientMethodParameter createParameter = new ClientMethodParameter.Builder().name("value")
            .wireType(ClassType.STRING)
            .annotations(List.of())
            .apiMetadata(annotateCreate ? metadata(null) : new ApiMetadata.Builder().build())
            .build();
        ClientMethodParameter updateParameter = createParameter.newBuilder()
            .apiMetadata(annotateUpdate ? metadata(null) : new ApiMetadata.Builder().build())
            .build();
        LocalVariable createVariable = new LocalVariable("value", ClassType.STRING, location, createParameter);
        LocalVariable updateVariable = new LocalVariable("value", ClassType.STRING, location, updateParameter);
        FluentMethod create = new FluentMethodParameterMethod(model, FluentMethodType.CREATE_WITH, stage,
            createParameter, createVariable);
        FluentMethod update = new FluentMethodParameterMethod(model, FluentMethodType.UPDATE_WITH, stage,
            updateParameter, updateVariable, create.getName());
        model.setResourceCreate(new ResourceCreate(model, null, null, "create", inner) {
            @Override
            public List<FluentMethod> getFluentMethods() {
                return List.of(create);
            }

            @Override
            public Collection<LocalVariable> getLocalVariables() {
                return List.of(createVariable);
            }
        });
        model.setResourceUpdate(new ResourceUpdate(model, null, null, "update", inner) {
            @Override
            public List<FluentMethod> getFluentMethods() {
                return List.of(update);
            }

            @Override
            public Collection<LocalVariable> getLocalVariables() {
                return List.of(updateVariable);
            }
        });
        Assertions.assertEquals(annotateCreate, create.getInterfaceMethodSignature().contains("@Preview"));
        Assertions.assertEquals(annotateUpdate, update.getInterfaceMethodSignature().contains("@Preview"));
        JavaFile file = new JavaFile("WidgetImpl.java");
        file.declarePackage("com.example");
        Set<String> imports = new LinkedHashSet<>();
        create.addImportsTo(imports, false);
        update.addImportsTo(imports, false);
        file.declareImport(imports);
        file.publicFinalClass("WidgetImpl", block -> {
            block.privateMemberVariable("String", "value");
            block.privateMethod("Inner innerModel()", method -> method.methodReturn("null"));
            model.getResourceImplementation()
                .getMethods()
                .forEach(method -> method.getMethodTemplate().writeMethod(block));
        });
        file.getContents().line("class Inner { String id() { return null; } }");
        var methods = StaticJavaParser.parse(file.getContents().toString())
            .getClassByName("WidgetImpl")
            .orElseThrow()
            .getMethodsByName(create.getName());
        Assertions.assertEquals(1, methods.size(), file.getContents().toString());
        Assertions.assertEquals(annotateCreate || annotateUpdate,
            methods.get(0).getParameter(0).getAnnotationByName("Preview").isPresent());
        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        compile(directory, List.of(javaPackage.getJavaFiles().get(0), file));
    }

    @ParameterizedTest
    @EnumSource(value = RequestParameterLocation.class, names = { "QUERY", "BODY" })
    public void annotatesOperationParameters(RequestParameterLocation location, @TempDir Path directory)
        throws Exception {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION, "flavor", "azure"));
        Language language = new Language();
        language.setName("value");
        Languages languages = new Languages();
        languages.setDefault(language);
        languages.setJava(language);
        Protocol protocol = new Protocol();
        protocol.setIn(location);
        Protocols protocols = new Protocols();
        protocols.setHttp(protocol);
        Parameter parameter = new Parameter();
        parameter.setExperimental(metadata(null).getExperimental());
        parameter.setLanguage(languages);
        StringSchema schema = new StringSchema();
        schema.setType(Schema.AllSchemaTypes.STRING);
        parameter.setSchema(schema);
        parameter.setProtocol(protocols);
        parameter.setRequired(true);
        for (boolean protocolMethod : List.of(false, true)) {
            for (ClientMethodParameter mapped : List.of(
                Mappers.getClientParameterMapper().map(parameter, protocolMethod),
                CustomClientParameterMapper.getInstance().map(parameter, protocolMethod))) {
                String type = protocolMethod && location == RequestParameterLocation.BODY ? "BinaryData" : "String";
                Assertions.assertEquals("@Preview(warningText = Preview.WARNING_TEXT) " + type + " value",
                    mapped.getDeclaration());
                Assertions.assertEquals("@Preview(warningText = Preview.WARNING_TEXT) " + type + " renamed",
                    mapped.newBuilder().name("renamed").build().getDeclaration());
                Set<String> imports = new LinkedHashSet<>();
                mapped.addImportsTo(imports, false);
                Assertions.assertTrue(imports.contains(ANNOTATION));
                JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
                javaPackage.addExperimentalAnnotation();
                JavaFile usage = new JavaFile("Usage.java");
                usage.declarePackage("com.example");
                usage.declareImport(imports);
                usage.publicFinalClass("Usage",
                    block -> block.publicMethod("void read(" + mapped.getDeclaration() + ")", method -> {
                    }));
                compile(directory, List.of(javaPackage.getJavaFiles().get(0), usage));
            }
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void annotatesBothContinuationTokenPagingOverloads(boolean sync) {
        configureJavaSettings(
            Map.of("experimental-annotation", ANNOTATION, "data-plane", "true", "enable-sync-stack", "true"));
        ProxyMethodParameter token = new ProxyMethodParameter.Builder().name("token")
            .requestParameterName("token")
            .requestParameterLocation(RequestParameterLocation.QUERY)
            .wireType(ClassType.STRING)
            .build();
        ClientMethod method = new ClientMethod.Builder().name("list")
            .description("Lists values.")
            .type(sync ? ClientMethodType.PagingSync : ClientMethodType.PagingAsync)
            .parameters(List.of(ClientMethodParameter.REQUEST_OPTIONS_PARAMETER))
            .returnValue(new ReturnValue("the values",
                sync ? GenericType.pagedIterable(ClassType.STRING) : GenericType.pagedFlux(ClassType.STRING)))
            .methodVisibility(JavaVisibility.Public)
            .proxyMethod(
                new ProxyMethod.Builder().name("list").parameters(List.of()).allParameters(List.of(token)).build())
            .methodPageDetails(new MethodPageDetails(
                List.of(new ModelPropertySegment(null,
                    new ClientModelProperty.Builder().name("value")
                        .serializedName("value")
                        .wireType(new ListType(ClassType.STRING))
                        .clientType(new ListType(ClassType.STRING))
                        .build())),
                null, null, null, new MethodPageDetails.ContinuationToken(token, null, "next-token", null), null, null))
            .apiMetadata(metadata(null))
            .build();
        JavaFile file = new JavaFile("Client.java");
        file.publicFinalClass("Client", block -> Templates.getClientMethodTemplate().write(method, block));
        var methods = StaticJavaParser.parse(file.getContents().toString())
            .getClassByName("Client")
            .orElseThrow()
            .getMethodsByName("list");
        Assertions.assertEquals(2, methods.size());
        methods.forEach(declaration -> Assertions.assertTrue(declaration.getAnnotationByName("Preview").isPresent(),
            declaration.toString()));
    }

    @ParameterizedTest
    @CsvSource({ "false, false", "false, true", "true, false", "true, true" })
    public void annotatesFluentResourceInterfaces(boolean annotateType, boolean annotateProperty) {
        new TypeSpecFluentPlugin(new EmitterOptions().setNamespace("com.example"), false);
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION, "fluent", "lite"));
        ClientModelProperty property = new ClientModelProperty.Builder().name("value")
            .serializedName("value")
            .description("A value.")
            .wireType(ClassType.STRING)
            .clientType(ClassType.STRING)
            .apiMetadata(annotateProperty ? metadata(null) : new ApiMetadata.Builder().build())
            .build();
        ClientModel inner = new ClientModel.Builder().name("WidgetInner")
            .packageName("com.example.fluent.models")
            .properties(List.of(property))
            .apiMetadata(annotateType ? metadata(null) : new ApiMetadata.Builder().build())
            .build();
        FluentResourceModel model = new FluentResourceModel(inner, List.of());
        JavaFile file = new JavaFile("Widget.java");
        FluentResourceModelInterfaceTemplate.getInstance().write(model, file);
        var declaration
            = StaticJavaParser.parse(file.getContents().toString()).getInterfaceByName(model.getName()).orElseThrow();
        Assertions.assertEquals(annotateType, declaration.getAnnotationByName("Preview").isPresent());
        Assertions.assertEquals(annotateProperty,
            declaration.getMethodsByName(model.getProperties().iterator().next().getMethodName())
                .get(0)
                .getAnnotationByName("Preview")
                .isPresent());
        Assertions.assertEquals(annotateType || annotateProperty,
            file.getContents().toString().contains("import " + ANNOTATION + ";"));
    }

    @ParameterizedTest
    @CsvSource({ "false, false", "false, true", "true, false", "true, true" })
    public void annotatesFluentCollectionInterfaces(boolean annotateType, boolean annotateMethod) {
        new TypeSpecFluentPlugin(new EmitterOptions().setNamespace("com.example"), false);
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION, "fluent", "lite"));
        ClientMethod method = new ClientMethod.Builder().name("read")
            .description("Reads a value.")
            .type(ClientMethodType.SimpleSync)
            .parameters(List.of())
            .returnValue(new ReturnValue("a value", ClassType.STRING))
            .methodVisibility(JavaVisibility.Public)
            .proxyMethod(new ProxyMethod.Builder().name("read").parameters(List.of()).allParameters(List.of()).build())
            .apiMetadata(annotateMethod ? metadata(null) : new ApiMetadata.Builder().build())
            .build();
        MethodGroupClient inner = new MethodGroupClient.Builder().className("WidgetsClientImpl")
            .interfaceName("WidgetsClient")
            .classBaseName("Widgets")
            .clientMethods(List.of(method))
            .apiMetadata(annotateType ? metadata(null) : new ApiMetadata.Builder().build())
            .build();
        Client previousClient = FluentStatic.getClient();
        FluentStatic.setClient(new Client.Builder().responseModels(List.of()).build());
        try {
            FluentResourceCollection collection = new FluentResourceCollection(inner);
            FluentResourceModel resource = new FluentResourceModel(new ClientModel.Builder().name("WidgetInner")
                .packageName("com.example.fluent.models")
                .properties(List.of())
                .build(), List.of());
            for (boolean includeContext : List.of(false, true)) {
                collection.getAdditionalMethods()
                    .add(new CollectionMethodOperationByIdTemplate(resource, "getById", List.of(),
                        new UrlPathSegments("/widgets"), includeContext, new ResourceLocalVariables(method),
                        collection.getMethods().get(0)).getMethodTemplate());
            }
            JavaFile file = new JavaFile("Widgets.java");
            FluentResourceCollectionInterfaceTemplate.getInstance().write(collection, file);
            var declaration = StaticJavaParser.parse(file.getContents().toString())
                .getInterfaceByName(collection.getInterfaceType().getName())
                .orElseThrow();
            Assertions.assertEquals(annotateType, declaration.getAnnotationByName("Preview").isPresent());
            Assertions.assertEquals(annotateMethod,
                declaration.getMethodsByName("read").get(0).getAnnotationByName("Preview").isPresent());
            for (String name : List.of("getById", "getByIdWithResponse")) {
                Assertions.assertEquals(annotateMethod,
                    declaration.getMethodsByName(name).get(0).getAnnotationByName("Preview").isPresent(), name);
            }
            Assertions.assertEquals(annotateType || annotateMethod,
                file.getContents().toString().contains("import " + ANNOTATION + ";"));
        } finally {
            FluentStatic.setClient(previousClient);
        }
    }

    @Test
    public void generatesAnnotationWithRequiredWarningTextAndSharedConstant(@TempDir Path directory) throws Exception {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION));
        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        Assertions.assertEquals(1, javaPackage.getJavaFiles().size());
        JavaFile annotation = javaPackage.getJavaFiles().get(0);
        Assertions
            .assertTrue(annotation.getFilePath().replace('\\', '/').endsWith("com/example/annotations/Preview.java"));

        JavaFile usage = new JavaFile("Usage.java");
        usage.declarePackage("com.example");
        usage.declareImport(ANNOTATION);
        ExperimentalAnnotationUtil.write(usage, metadata(null));
        usage.publicFinalClass("Usage", block -> {
            ExperimentalAnnotationUtil.write(block, metadata("Preview \"API\"\nwith a \\ path\tand \r text"));
            block.publicMethod("void preview()", method -> {
            });
        });
        assertImportedAnnotation(usage.getContents().toString());
        Assertions.assertTrue(usage.getContents().toString().contains("@Preview(warningText = Preview.WARNING_TEXT)"));
        Assertions.assertTrue(annotation.getContents().toString().contains("String warningText();"));
        compile(directory, List.of(annotation, usage));

        try (URLClassLoader loader = new URLClassLoader(new URL[] { directory.toUri().toURL() })) {
            Class<?> type = loader.loadClass(ANNOTATION);
            Assertions.assertTrue(type.isAnnotation());
            Assertions.assertEquals(1, type.getDeclaredMethods().length);
            Assertions.assertEquals(String.class, type.getDeclaredMethod("warningText").getReturnType());
            Assertions.assertNull(type.getDeclaredMethod("warningText").getDefaultValue());
            Assertions.assertEquals(ExperimentalAnnotationUtil.DEFAULT_WARNING_TEXT,
                type.getField("WARNING_TEXT").get(null));
        }
    }

    @ParameterizedTest
    @CsvSource({ "false, false", "false, true", "true, false", "true, true" })
    public void annotatesEnumsAndValues(boolean expandable, boolean annotateType, @TempDir Path directory)
        throws Exception {
        configureJavaSettings(
            Map.of("experimental-annotation", ANNOTATION, "flavor", "azure", "stream-style-serialization", "true"));
        JavaSettings.getInstance();
        EnumType type = new EnumType.Builder().packageName("com.example")
            .name("Choice")
            .description("A choice.")
            .expandable(expandable)
            .elementType(ClassType.STRING)
            .apiMetadata(annotateType ? metadata("Enum warning") : new ApiMetadata.Builder().build())
            .values(List.of(new ClientEnumValue("ONE", "one", "One.", metadata("Member warning")),
                new ClientEnumValue("TWO", "two", "Two.", metadata(null)),
                new ClientEnumValue("STABLE", "stable", "Stable.")))
            .build();
        JavaFile file = new JavaFile("Choice.java");
        file.declarePackage("com.example");
        Templates.getEnumTemplate().write(type, file);
        String source = file.getContents().toString();
        assertImportedAnnotation(source);
        Assertions.assertEquals(annotateType, source.contains("@Preview(warningText = \"Enum warning\")"), source);
        Assertions.assertTrue(source.contains("@Preview(warningText = \"Member warning\")"), source);
        Assertions.assertTrue(source.contains("@Preview(warningText = Preview.WARNING_TEXT)"), source);
        Assertions.assertEquals(annotateType ? 3 : 2, source.split("@Preview", -1).length - 1, source);

        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        compile(directory, List.of(javaPackage.getJavaFiles().get(0), file));
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void annotatesModelAndPropertyAccessors(boolean annotateModel, @TempDir Path directory) throws Exception {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION, "stream-style-serialization", "true"));
        ClientModelProperty property = new ClientModelProperty.Builder().name("value")
            .serializedName("value")
            .description("A value.")
            .wireType(ClassType.STRING)
            .clientType(ClassType.STRING)
            .apiMetadata(metadata("Property warning"))
            .build();
        ClientModel model = new ClientModel.Builder().name("Payload")
            .packageName("com.example")
            .description("A payload.")
            .type(new ClassType.Builder().name("Payload").packageName("com.example").build())
            .properties(List.of(property))
            .implementationDetails(new ImplementationDetails.Builder().usages(Set.of(ImplementationDetails.Usage.PUBLIC,
                ImplementationDetails.Usage.INPUT, ImplementationDetails.Usage.OUTPUT)).build())
            .apiMetadata(annotateModel ? metadata(null) : new ApiMetadata.Builder().build())
            .build();
        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        javaPackage.addModel("com.example", "Payload", model);
        String source = javaPackage.getJavaFiles().get(1).getContents().toString();
        Assertions.assertEquals(2, source.split("warningText = \"Property warning\"", -1).length - 1, source);
        assertImportedAnnotation(source);
        Assertions.assertEquals(annotateModel, source.contains("@Preview(warningText = Preview.WARNING_TEXT)"), source);
        compile(directory, javaPackage.getJavaFiles());
    }

    @Test
    public void annotatesWrappedClientMethods() {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION));
        ClientMethod method = new ClientMethod.Builder().name("read")
            .description("Reads a value.")
            .type(ClientMethodType.SimpleSync)
            .parameters(List.of())
            .returnValue(new ReturnValue("a value", ClassType.STRING))
            .methodVisibility(JavaVisibility.Public)
            .methodVisibilityInWrapperClient(JavaVisibility.Public)
            .apiMetadata(metadata("Operation warning"))
            .build();
        JavaFile file = new JavaFile("Client.java");
        Set<String> imports = new LinkedHashSet<>();
        method.addImportsTo(imports, false, JavaSettings.getInstance());
        file.declareImport(imports);
        file.publicFinalClass("Client", block -> Templates.getWrapperClientMethodTemplate().write(method, block));
        assertImportedAnnotation(file.getContents().toString());
        Assertions.assertTrue(file.getContents().toString().contains("@Preview(warningText = \"Operation warning\")"));
    }

    @ParameterizedTest
    @CsvSource({ "generic, false", "generic, true", "azurev2, false", "azurev2, true" })
    public void onlyAnnotatesAzureV2OperationImplementations(String flavor, boolean experimental) {
        // Initialize shared type constants with the default test settings before switching flavors.
        GenericType responseType = GenericType.response(ClassType.STRING);
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION, "flavor", flavor));
        Templates
            .setFactory("azurev2".equals(flavor) ? new AzureVNextTemplateFactory() : new ClientCoreTemplateFactory());
        Language language = new Language();
        language.setCrossLanguageDefinitionId("Example.read");
        Languages languages = new Languages();
        languages.setDefault(language);
        Operation operation = new Operation();
        operation.setLanguage(languages);
        ProxyMethod proxyMethod = new ProxyMethod.Builder().name("read")
            .parameters(List.of())
            .allParameters(List.of())
            .returnType(responseType)
            .isSync(true)
            .build();
        ClientMethod method = new ClientMethod.Builder().name("readWithResponse")
            .description("Reads a value.")
            .type(ClientMethodType.SimpleSyncRestResponse)
            .parameters(List.of())
            .returnValue(new ReturnValue("a value", responseType))
            .proxyMethod(proxyMethod)
            .clientReference("this")
            .validateExpressions(Map.of())
            .requiredNullableParameterExpressions(List.of())
            .parameterTransformations(new ParameterTransformations(List.of()))
            .operationInstrumentationInfo(new OperationInstrumentationInfo(operation))
            .apiMetadata(experimental ? metadata(null) : new ApiMetadata.Builder().build())
            .build();
        JavaFile file = new JavaFile("ClientImpl.java");
        Set<String> imports = new LinkedHashSet<>();
        method.addImportsTo(imports, false, JavaSettings.getInstance());
        file.declareImport(imports);
        file.publicFinalClass("ClientImpl", block -> Templates.getClientMethodTemplate().write(method, block));
        String source = file.getContents().toString();
        Assertions.assertTrue(source.contains("readWithResponse()"), source);
        boolean annotated = experimental && "azurev2".equals(flavor);
        Assertions.assertEquals(annotated, source.contains("@Preview(warningText = Preview.WARNING_TEXT)"), source);
        if (annotated) {
            assertImportedAnnotation(source);
        } else {
            Assertions.assertFalse(source.contains("import " + ANNOTATION + ";"), source);
        }
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(
        strings = {
            "com.example.annotations.Preview",
            "com.example.client.Preview",
            "com.example.client.models.Preview",
            "com.example.client.fluent.Preview",
            "com.example.client.fluent.models.Preview" })
    public void exportsFluentExperimentalAnnotationPackage(String annotation) {
        Map<String, String> settings = new LinkedHashMap<>(Map.of("namespace", "com.example.client", "fluent", "lite",
            "generate-tests", "false", "generate-samples", "false"));
        if (annotation != null) {
            settings.put("experimental-annotation", annotation);
        }
        new TypeSpecFluentPlugin(new EmitterOptions().setNamespace("com.example.client"), false);
        ClientModelUtil.setGetClientModelFunction(ClientModels.getInstance()::getModel);
        configureJavaSettings(settings);
        Language language = new Language();
        language.setName("Example");
        Languages languages = new Languages();
        languages.setJava(language);
        CodeModel codeModel = new CodeModel();
        codeModel.setLanguage(languages);
        codeModel.setSchemas(new Schemas());
        Client client = new Client.Builder().models(List.of())
            .enums(List.of())
            .responseModels(List.of())
            .exceptions(List.of())
            .xmlSequenceWrappers(List.of())
            .build();
        var fluentClient = new FluentMapper(new FluentJavaSettings(new TestPlugin(settings))).map(codeModel, client);
        String annotationPackage
            = annotation == null ? "com.example.annotations" : annotation.substring(0, annotation.lastIndexOf('.'));
        Assertions.assertEquals(annotation == null ? 0 : 1,
            fluentClient.getModuleInfo()
                .getExportModules()
                .stream()
                .filter(module -> module.getModuleName().equals(annotationPackage))
                .count());
        JavaPackage javaPackage = new JavaPackage(new TestPlugin(settings));
        javaPackage.addModuleInfo(fluentClient.getModuleInfo());
        Assertions.assertEquals(annotation != null,
            javaPackage.getJavaFiles().get(0).getContents().toString().contains("exports " + annotationPackage + ";"));
    }

    @Test
    public void rejectsAnnotationTypeCollisions() {
        configureJavaSettings(Map.of("experimental-annotation", ANNOTATION));
        JavaPackage javaPackage = new JavaPackage(new TestPlugin(Map.of()));
        javaPackage.addExperimentalAnnotation();
        Assertions.assertThrows(IllegalArgumentException.class, javaPackage::addExperimentalAnnotation);
    }

    private static ApiMetadata metadata(String warningText) {
        Experimental experimental = new Experimental();
        experimental.setWarningText(warningText);
        return new ApiMetadata.Builder().experimental(experimental).build();
    }

    private static void assertImportedAnnotation(String source) {
        Assertions.assertTrue(source.contains("import " + ANNOTATION + ";"), source);
        Assertions.assertTrue(source.contains("@Preview(warningText = "), source);
        Assertions.assertFalse(source.contains("@" + ANNOTATION), source);
    }

    private static void compile(Path directory, List<JavaFile> files) throws Exception {
        List<String> arguments
            = new ArrayList<>(List.of("-classpath", System.getProperty("java.class.path"), "-d", directory.toString()));
        for (JavaFile file : files) {
            Path path = directory.resolve(Path.of(file.getFilePath()).getFileName());
            Files.writeString(path, file.getContents().toString(), StandardCharsets.UTF_8);
            arguments.add(path.toString());
        }
        ByteArrayOutputStream diagnostics = new ByteArrayOutputStream();
        Assertions.assertEquals(0,
            ToolProvider.getSystemJavaCompiler().run(null, diagnostics, diagnostics, arguments.toArray(new String[0])),
            diagnostics.toString(StandardCharsets.UTF_8));
    }
}
