// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.yaml.snakeyaml.LoaderOptions;
import org.yaml.snakeyaml.Yaml;

public class CodeModelCustomConstructorTests {
    private static Stream<String> structuralKeys() {
        return Stream.of("arrays", "ands", "ors", "xors", "objects", "choices", "parameterGroups", "sealedChoices",
            "flags", "dictionaries", "constants", "primitives", "properties", "binaries", "booleans", "bytearrays",
            "numbers", "uris", "anyObjects", "any", "times", "armIds", "requests", "exceptions", "responses",
            "immediate", "all", "allOf", "choiceType", "elementType", "valueType", "schema", "extensions",
            "xmsLongRunningOperationOptions");
    }

    @ParameterizedTest
    @MethodSource("structuralKeys")
    public void discriminatorKeysPreserveSubtypesAndAliases(String key) {
        String yaml = "type: object\n" + "discriminator:\n" + "  immediate:\n" + "    " + key + ": &subtype\n"
            + "      type: object\n" + "      discriminatorValue: " + key + "\n" + "  all:\n" + "    " + key
            + ": *subtype\n";

        ObjectSchema model
            = new Yaml(new CodeModelCustomConstructor(new LoaderOptions())).loadAs(yaml, ObjectSchema.class);

        ObjectSchema subtype
            = Assertions.assertInstanceOf(ObjectSchema.class, model.getDiscriminator().getAll().get(key));
        Assertions.assertEquals(key, subtype.getDiscriminatorValue());
        Assertions.assertSame(subtype, model.getDiscriminator().getImmediate().get(key));
    }

    @ParameterizedTest
    @MethodSource("structuralKeys")
    public void typedMapKeysDoNotActAsStructuralProperties(String key) {
        CodeModel model = new Yaml(new CodeModelCustomConstructor(new LoaderOptions()))
            .loadAs("apiVersionMap:\n  " + key + ": '2026-01-01'\n", CodeModel.class);
        Assertions.assertEquals("2026-01-01", model.getApiVersionMap().get(key));

        ScenarioStep step = new Yaml(new CodeModelCustomConstructor(new LoaderOptions()))
            .loadAs("requestParameters:\n  " + key + ":\n    responses: payload\n", ScenarioStep.class);
        Assertions.assertEquals(Map.of("responses", "payload"), step.getRequestParameters().get(key));
    }

    @Test
    public void exampleNamesAndPayloadsAreNotStructuralProperties() {
        String yaml = "extensions:\n" + "  x-ms-client-flatten: true\n" + "  x-ms-long-running-operation-options:\n"
            + "    final-state-via: location\n" + "  x-ms-examples:\n" + "    responses:\n" + "      extensions:\n"
            + "        x-ms-client-flatten: true\n";

        Operation operation
            = new Yaml(new CodeModelCustomConstructor(new LoaderOptions())).loadAs(yaml, Operation.class);

        Assertions.assertEquals(Map.of("extensions", Map.of("x-ms-client-flatten", true)),
            operation.getExtensions().getXmsExamples().getExamples().get("responses"));
        Assertions.assertTrue(operation.getExtensions().isXmsClientFlatten());
        Assertions.assertEquals("location",
            operation.getExtensions().getXmsLongRunningOperationOptions().getFinalStateVia());
    }

    @Test
    public void structuralPropertiesPreserveSchemaTypesAndAliases() {
        String yaml = "schemas:\n" + "  objects:\n" + "    - &model\n" + "      type: object\n" + "      properties:\n"
            + "        - schema:\n" + "            type: array\n" + "            elementType:\n"
            + "              type: string\n" + "  dictionaries:\n" + "    - type: dictionary\n" + "      elementType:\n"
            + "        type: string\n" + "  choices:\n" + "    - type: choice\n" + "      choiceType:\n"
            + "        type: string\n" + "      choices:\n" + "        - value: one\n" + "  constants:\n"
            + "    - type: constant\n" + "      valueType:\n" + "        type: string\n" + "  ands:\n"
            + "    - type: and\n" + "      allOf:\n" + "        - *model\n" + "operationGroups:\n" + "  - operations:\n"
            + "      - requests:\n" + "          - parameters:\n" + "              - schema: *model\n"
            + "        responses:\n" + "          - schema: *model\n" + "        exceptions:\n"
            + "          - schema:\n" + "              type: object\n";

        CodeModel model = new Yaml(new CodeModelCustomConstructor(new LoaderOptions())).loadAs(yaml, CodeModel.class);

        ObjectSchema objectSchema = model.getSchemas().getObjects().get(0);
        ArraySchema arraySchema
            = Assertions.assertInstanceOf(ArraySchema.class, objectSchema.getProperties().get(0).getSchema());
        Assertions.assertInstanceOf(StringSchema.class, arraySchema.getElementType());
        Assertions.assertInstanceOf(StringSchema.class, model.getSchemas().getDictionaries().get(0).getElementType());
        Assertions.assertInstanceOf(StringSchema.class, model.getSchemas().getChoices().get(0).getChoiceType());
        Assertions.assertEquals("one", model.getSchemas().getChoices().get(0).getChoices().get(0).getValue());
        Assertions.assertInstanceOf(StringSchema.class, model.getSchemas().getConstants().get(0).getValueType());
        Assertions.assertSame(objectSchema, model.getSchemas().getAnds().get(0).getAllOf().get(0));
        Operation operation = model.getOperationGroups().get(0).getOperations().get(0);
        Assertions.assertSame(objectSchema, operation.getRequests().get(0).getParameters().get(0).getSchema());
        Assertions.assertSame(objectSchema, operation.getResponses().get(0).getSchema());
        Assertions.assertInstanceOf(ObjectSchema.class, operation.getExceptions().get(0).getSchema());
    }

    @Test
    public void immediateDiscriminatorValueDoesNotActAsStructuralKey() {
        String yaml = "type: object\n" + "discriminator:\n" + "  all:\n" + "    immediate:\n" + "      type: object\n"
            + "      discriminatorValue: immediate\n";

        ObjectSchema model
            = new Yaml(new CodeModelCustomConstructor(new LoaderOptions())).loadAs(yaml, ObjectSchema.class);

        ObjectSchema subtype
            = Assertions.assertInstanceOf(ObjectSchema.class, model.getDiscriminator().getAll().get("immediate"));
        Assertions.assertEquals("immediate", subtype.getDiscriminatorValue());
    }

    @Test
    public void relationsPreserveSchemaTypes() {
        String yaml = "type: object\n" + "children:\n" + "  immediate:\n" + "    - type: object\n" + "  all:\n"
            + "    - type: object\n";

        ObjectSchema model
            = new Yaml(new CodeModelCustomConstructor(new LoaderOptions())).loadAs(yaml, ObjectSchema.class);

        Relations relations = model.getChildren();
        Assertions.assertEquals(1, relations.getImmediate().size());
        Assertions.assertInstanceOf(ObjectSchema.class, relations.getImmediate().get(0));
        Assertions.assertEquals(1, relations.getAll().size());
        Assertions.assertInstanceOf(ObjectSchema.class, relations.getAll().get(0));
    }
}
