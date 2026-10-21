// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Discriminator;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.LongRunningMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Relations;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schemas;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public class SchemaCleanupTests {
    @BeforeAll
    public static void initializeNamer() {
        new FluentNamer(FluentGen.getPluginInstance(), new TestUtils.MockConnection(), "cleanup", "cleanup");
    }

    @Test
    public void removesUnusedChainsBeyondFivePasses() {
        List<ObjectSchema> chain = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            chain.add(named(new ObjectSchema(), "Model" + i));
            if (i > 0) {
                chain.get(i - 1).getProperties().add(property(chain.get(i)));
            }
        }
        ChoiceSchema choice = named(new ChoiceSchema(), "Choice");
        SealedChoiceSchema sealed = named(new SealedChoiceSchema(), "Sealed");
        chain.get(999).getProperties().add(property(choice));
        chain.get(999).getProperties().add(property(sealed));
        CodeModel model = model(choice, sealed);
        model.getSchemas().getObjects().addAll(chain);

        assertSame(model, new SchemaCleanup(Set.of()).process(model));
        assertTrue(model.getSchemas().getObjects().isEmpty());
        assertTrue(model.getSchemas().getChoices().isEmpty());
        assertTrue(model.getSchemas().getSealedChoices().isEmpty());
    }

    @Test
    public void preservesCyclesButIgnoresDirectSelfReferences() {
        ObjectSchema first = named(new ObjectSchema(), "First");
        ObjectSchema second = named(new ObjectSchema(), "Second");
        ObjectSchema self = named(new ObjectSchema(), "Self");
        first.getProperties().add(property(second));
        second.getProperties().add(property(first));
        self.getProperties().add(property(self));
        CodeModel model = model(first, second, self);

        new SchemaCleanup(Set.of()).process(model);

        assertEquals(List.of(first, second), model.getSchemas().getObjects());
    }

    @Test
    public void preservedModelsKeepTheirPropertyDependencies() {
        ObjectSchema unused = named(new ObjectSchema(), "Unused");
        ObjectSchema preserved = named(new ObjectSchema(), "Preserved");
        ObjectSchema dependency = named(new ObjectSchema(), "Dependency");
        unused.getProperties().add(property(preserved));
        preserved.getProperties().add(property(dependency));
        CodeModel model = model(unused, preserved, dependency);

        new SchemaCleanup(Set.of("Preserved")).process(model);

        assertEquals(List.of(preserved, dependency), model.getSchemas().getObjects());
    }

    @ParameterizedTest
    @ValueSource(booleans = { false, true })
    public void keepsRequestResponseAndExceptionReferencesForBothOperationGroupShapes(boolean nestedClients) {
        ObjectSchema requestModel = named(new ObjectSchema(), "RequestModel");
        ObjectSchema responseModel = named(new ObjectSchema(), "ResponseModel");
        ObjectSchema exceptionModel = named(new ObjectSchema(), "ExceptionModel");
        ObjectSchema unused = named(new ObjectSchema(), "Unused");
        DictionarySchema dictionary = new DictionarySchema();
        dictionary.setElementType(requestModel);
        ArraySchema array = new ArraySchema();
        array.setElementType(dictionary);
        Parameter parameter = new Parameter();
        parameter.setSchema(array);
        Request request = new Request();
        request.getParameters().add(parameter);
        Operation operation = new Operation();
        operation.setRequests(List.of(request));
        operation.getResponses().add(response(responseModel));
        operation.getExceptions().add(response(exceptionModel));
        CodeModel model = model(requestModel, responseModel, exceptionModel, unused);
        addOperation(model, operation, nestedClients);

        new SchemaCleanup(Set.of()).process(model);

        assertEquals(List.of(requestModel, responseModel, exceptionModel), model.getSchemas().getObjects());
    }

    @Test
    public void longRunningOperationsKeepFinalResultRatherThanInitialResponse() {
        ObjectSchema initial = named(new ObjectSchema(), "Initial");
        ObjectSchema result = named(new ObjectSchema(), "Result");
        Operation operation = new Operation();
        operation.setRequests(List.of());
        operation.getResponses().add(response(initial));
        LongRunningMetadata metadata = new LongRunningMetadata();
        metadata.setFinalResultType(result);
        operation.setLroMetadata(metadata);
        CodeModel model = model(initial, result);
        addOperation(model, operation, false);

        new SchemaCleanup(Set.of()).process(model);

        assertEquals(List.of(result), model.getSchemas().getObjects());
    }

    @Test
    public void keepsParentCollectionElementsAndParentDiscriminatorTypes() {
        ObjectSchema used = named(new ObjectSchema(), "Used");
        ObjectSchema parent = named(new ObjectSchema(), "Parent");
        SealedChoiceSchema discriminatorType = named(new SealedChoiceSchema(), "Kind");
        Discriminator discriminator = new Discriminator();
        discriminator.setProperty(property(discriminatorType));
        parent.setDiscriminator(discriminator);
        DictionarySchema dictionary = new DictionarySchema();
        dictionary.setElementType(parent);
        Relations parents = new Relations();
        parents.setAll(List.of(dictionary));
        parents.setImmediate(List.of(dictionary));
        used.setParents(parents);
        Operation operation = new Operation();
        operation.setRequests(List.of());
        operation.getResponses().add(response(used));
        CodeModel model = model(used, parent, discriminatorType);
        addOperation(model, operation, false);

        new SchemaCleanup(Set.of()).process(model);

        assertEquals(List.of(used, parent), model.getSchemas().getObjects());
        assertEquals(List.of(discriminatorType), model.getSchemas().getSealedChoices());
    }

    @Test
    public void retainedDiscriminatorDoesNotKeepAnUnusedOwnerAlive() {
        ObjectSchema unused = named(new ObjectSchema(), "Unused");
        ObjectSchema referenced = named(new ObjectSchema(), "Referenced");
        SealedChoiceSchema kind = named(new SealedChoiceSchema(), "Kind");
        Discriminator discriminator = new Discriminator();
        discriminator.setProperty(property(kind));
        referenced.setDiscriminator(discriminator);
        unused.getProperties().add(property(referenced));
        CodeModel model = model(unused, referenced, kind);

        new SchemaCleanup(Set.of()).process(model);

        assertTrue(model.getSchemas().getObjects().isEmpty());
        assertTrue(model.getSchemas().getSealedChoices().isEmpty());
    }

    @Test
    public void respectsInheritanceExclusionsAndSystemModelPropertyExclusions() {
        ObjectSchema parent = named(new ObjectSchema(), "Base");
        ObjectSchema child = named(new ObjectSchema(), "Child");
        Relations children = new Relations();
        children.setImmediate(List.of(child));
        parent.setChildren(children);
        Relations parents = new Relations();
        parents.setImmediate(List.of(parent));
        child.setParents(parents);
        ObjectSchema systemData = named(new ObjectSchema(), "SystemData");
        ObjectSchema managementError = named(new ObjectSchema(), "ManagementError");
        ObjectSchema ignoredProperty = named(new ObjectSchema(), "IgnoredProperty");
        systemData.getProperties().add(property(ignoredProperty));
        managementError.getProperties().add(property(ignoredProperty));
        CodeModel model = model(parent, child, systemData, managementError, ignoredProperty);

        new SchemaCleanup(Set.of("SystemData", "ManagementError")).process(model);

        assertEquals(List.of(parent, child, systemData, managementError), model.getSchemas().getObjects());
    }

    private static CodeModel model(Schema... schemas) {
        CodeModel model = new CodeModel();
        model.setSchemas(new Schemas());
        for (Schema schema : schemas) {
            if (schema instanceof ObjectSchema) {
                model.getSchemas().getObjects().add((ObjectSchema) schema);
            } else if (schema instanceof SealedChoiceSchema) {
                model.getSchemas().getSealedChoices().add((SealedChoiceSchema) schema);
            } else if (schema instanceof ChoiceSchema) {
                model.getSchemas().getChoices().add((ChoiceSchema) schema);
            }
        }
        return model;
    }

    private static <T extends Schema> T named(T schema, String name) {
        Language language = new Language();
        language.setName(name);
        Languages languages = new Languages();
        languages.setJava(language);
        schema.setLanguage(languages);
        if (schema instanceof ChoiceSchema) {
            ((ChoiceSchema) schema).setChoiceType(new StringSchema());
        }
        return schema;
    }

    private static Property property(Schema schema) {
        Property property = new Property();
        property.setSchema(schema);
        return property;
    }

    private static Response response(Schema schema) {
        Response response = new Response();
        response.setSchema(schema);
        return response;
    }

    private static void addOperation(CodeModel model, Operation operation, boolean nestedClients) {
        OperationGroup group = new OperationGroup();
        group.getOperations().add(operation);
        if (nestedClients) {
            Client client = new Client();
            client.getOperationGroups().add(group);
            model.getClients().add(client);
        } else {
            model.getOperationGroups().add(group);
        }
    }
}
