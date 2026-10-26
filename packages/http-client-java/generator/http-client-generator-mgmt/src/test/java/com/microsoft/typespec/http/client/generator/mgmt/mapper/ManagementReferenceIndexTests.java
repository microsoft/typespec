// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.DictionarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Metadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schemas;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.mapper.DefaultMapperFactory;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import com.microsoft.typespec.http.client.generator.mgmt.transformer.SchemaNameNormalization;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated("Management mapper factories and namer instances are shared")
public class ManagementReferenceIndexTests {
    @BeforeEach
    public void initialize() {
        new FluentNamer(FluentGen.getPluginInstance(), new TestUtils.MockConnection(), "index", "index");
        Mappers.setFactory(new FluentMapperFactory());
    }

    @AfterEach
    public void restoreFactory() {
        Mappers.setFactory(new DefaultMapperFactory());
    }

    @Test
    public void innerModelsPropagateThroughDeepChainsAndCyclesWithoutRecursion() {
        CodeModel model = model();
        ObjectSchema root = named(new ObjectSchema(), "IndexRoot");
        model.getSchemas().getObjects().add(root);
        ObjectSchema previous = root;
        for (int i = 0; i < 3000; i++) {
            ObjectSchema owner = named(new ObjectSchema(), "IndexOwner" + i);
            owner.getProperties().add(property("value", previous));
            model.getSchemas().getObjects().add(owner);
            previous = owner;
        }
        root.getProperties().add(property("cycle", previous));
        Operation operation = operation();
        Response response = new Response();
        response.setSchema(root);
        operation.getResponses().add(response);
        addOperation(model, operation);

        new FluentMapper(settings()).preModelMap(model);

        assertTrue(model.getSchemas().getObjects().stream().allMatch(FluentObjectMapper.getInstance()::isInnerModel));
    }

    @Test
    public void innerReferencesKeepNameMatchingAndArrayDictionaryContainerDiscovery() {
        ObjectSchema root = named(new ObjectSchema(), "IndexSharedName");
        ObjectSchema sameName = named(new ObjectSchema(), "IndexSharedName");
        ObjectSchema arrayOwner = named(new ObjectSchema(), "IndexArrayOwner");
        arrayOwner.getProperties().add(property("value", sameName));
        ObjectSchema dictionaryOwner = named(new ObjectSchema(), "IndexDictionaryOwner");
        dictionaryOwner.getProperties().add(property("value", arrayOwner));
        ObjectSchema unrelated = named(new ObjectSchema(), "IndexUnrelated");
        CodeModel model = model();
        model.getSchemas().getObjects().addAll(List.of(root, unrelated));
        model.getSchemas().getArrays().add(array(arrayOwner));
        DictionarySchema dictionary = new DictionarySchema();
        dictionary.setElementType(dictionaryOwner);
        model.getSchemas().getDictionaries().add(dictionary);
        FluentJavaSettings settings = settings();
        settings.getJavaNamesForAddInner().add("IndexSharedName");
        settings.getJavaNamesForRemoveInner().add("IndexArrayOwner");

        new FluentMapper(settings).preModelMap(model);

        assertTrue(FluentObjectMapper.getInstance().isInnerModel(root));
        assertTrue(FluentObjectMapper.getInstance().isInnerModel(dictionaryOwner));
        assertFalse(FluentObjectMapper.getInstance().isInnerModel(arrayOwner));
        assertFalse(FluentObjectMapper.getInstance().isInnerModel(unrelated));
    }

    @Test
    public void directPropertiesBeatEarlierArrayPropertiesAndOperationParameters() {
        ChoiceSchema target = named(new ChoiceSchema(), "Enum100");
        ObjectSchema first = named(new ObjectSchema(), "First");
        first.getProperties().add(property("items", array(target)));
        ObjectSchema second = named(new ObjectSchema(), "Second");
        second.getProperties().add(property("status", target));
        second.getProperties().add(property("later", target));
        ObjectSchema third = named(new ObjectSchema(), "Third");
        third.getProperties().add(property("ignored", target));
        CodeModel model = model(first, second, third);
        model.getSchemas().getChoices().add(target);
        Operation operation = operation();
        operation.getParameters().add(parameter("input", target));
        addOperation(model, operation);

        new Normalizer().choices(model);

        assertEquals("SecondStatus", target.getLanguage().getDefault().getName());
    }

    @Test
    public void arrayPropertiesBeatParametersAndUseSingularNames() {
        ChoiceSchema target = named(new ChoiceSchema(), "Enum101");
        ObjectSchema owner = named(new ObjectSchema(), "Owner");
        owner.getProperties().add(property("items", array(target)));
        CodeModel model = model(owner);
        model.getSchemas().getChoices().add(target);
        Operation operation = operation();
        operation.getParameters().add(parameter("input", target));
        addOperation(model, operation);

        new Normalizer().choices(model);

        assertEquals("OwnerItem", target.getLanguage().getDefault().getName());
    }

    @Test
    public void requestDirectParametersBeatEarlierArrayParametersAndKeepFirstMatch() {
        ChoiceSchema target = named(new ChoiceSchema(), "Enum102");
        CodeModel model = model();
        model.getSchemas().getChoices().add(target);
        Operation operation = operation();
        operation.getParameters().add(parameter("items", array(target)));
        Request request = new Request();
        request.getParameters().add(parameter("first", target));
        request.getParameters().add(parameter("second", target));
        operation.setRequests(List.of(request));
        addOperation(model, operation);

        new Normalizer().choices(model);

        assertEquals("OperationsFirst", target.getLanguage().getDefault().getName());
    }

    @Test
    public void arrayParametersAreTheFallbackAndUnreferencedSchemasKeepTheirNames() {
        ChoiceSchema target = named(new ChoiceSchema(), "Enum103");
        ChoiceSchema unused = named(new ChoiceSchema(), "Enum104");
        CodeModel model = model();
        model.getSchemas().getChoices().addAll(List.of(target, unused));
        Operation operation = operation();
        operation.getParameters().add(parameter("items", array(target)));
        addOperation(model, operation);

        new Normalizer().choices(model);

        assertEquals("OperationsItems", target.getLanguage().getDefault().getName());
        assertEquals("Enum104", unused.getLanguage().getDefault().getName());
    }

    @Test
    public void ownerRenamesAreResolvedAfterIndexingAndEqualNamesDoNotMergeIdentities() {
        ObjectSchema parent = named(new ObjectSchema(), "Parent");
        ObjectSchema owner = named(new ObjectSchema(), "ComponentsOwnerItems");
        ObjectSchema child = named(new ObjectSchema(), "ComponentsChildItems");
        ObjectSchema distinct = named(new ObjectSchema(), "ComponentsChildItems");
        parent.getProperties().add(property("owner", owner));
        owner.getProperties().add(property("child", child));
        CodeModel model = model(parent, owner, child, distinct);

        new Normalizer().objects(model);

        assertEquals("ParentOwner", owner.getLanguage().getDefault().getName());
        assertEquals("ParentOwnerChild", child.getLanguage().getDefault().getName());
        assertEquals("ComponentsChildItems", distinct.getLanguage().getDefault().getName());
    }

    @Test
    public void sealedChoicesAreIndexedWhenThereAreNoOrdinaryChoices() {
        SealedChoiceSchema target = named(new SealedChoiceSchema(), "Enum105");
        ObjectSchema owner = named(new ObjectSchema(), "SealedOwner");
        owner.getProperties().add(property("kind", target));
        CodeModel model = model(owner);
        model.getSchemas().getSealedChoices().add(target);

        new Normalizer().choices(model);

        assertEquals("SealedOwnerKind", target.getLanguage().getDefault().getName());
    }

    @Test
    public void schemaLookupUsesIdentityEvenWhenSchemasCompareEqual() {
        ChoiceSchema first = named(new EqualChoice(), "Enum106");
        ChoiceSchema second = named(new EqualChoice(), "Enum107");
        ObjectSchema owner = named(new ObjectSchema(), "IdentityOwner");
        owner.getProperties().add(property("first", first));
        owner.getProperties().add(property("second", second));
        CodeModel model = model(owner);
        model.getSchemas().getChoices().addAll(List.of(first, second));

        new Normalizer().choices(model);

        assertEquals("IdentityOwnerFirst", first.getLanguage().getDefault().getName());
        assertEquals("IdentityOwnerSecond", second.getLanguage().getDefault().getName());
    }

    private static final class EqualChoice extends ChoiceSchema {
        @Override
        public boolean equals(Object other) {
            return other instanceof EqualChoice;
        }

        @Override
        public int hashCode() {
            return 1;
        }
    }

    private static FluentJavaSettings settings() {
        return new FluentJavaSettings(FluentGen.getPluginInstance());
    }

    private static CodeModel model(ObjectSchema... objects) {
        CodeModel model = new CodeModel();
        model.setSchemas(new Schemas());
        model.getSchemas().getObjects().addAll(List.of(objects));
        return model;
    }

    private static Operation operation() {
        Operation operation = new Operation();
        operation.setRequests(List.of());
        return operation;
    }

    private static void addOperation(CodeModel model, Operation operation) {
        OperationGroup group = named(new OperationGroup(), "Operations");
        group.getOperations().add(operation);
        model.getOperationGroups().add(group);
    }

    private static Parameter parameter(String name, Schema schema) {
        Parameter parameter = named(new Parameter(), name);
        parameter.setSchema(schema);
        return parameter;
    }

    private static Property property(String name, Schema schema) {
        Property property = named(new Property(), name);
        property.setSerializedName(name);
        property.setSchema(schema);
        return property;
    }

    private static ArraySchema array(Schema element) {
        ArraySchema array = new ArraySchema();
        array.setElementType(element);
        return array;
    }

    private static <T extends Metadata> T named(T metadata, String name) {
        Languages languages = new Languages();
        Language defaultLanguage = new Language();
        defaultLanguage.setName(name);
        languages.setDefault(defaultLanguage);
        Language javaLanguage = new Language();
        javaLanguage.setName(name);
        languages.setJava(javaLanguage);
        metadata.setLanguage(languages);
        return metadata;
    }

    private static final class Normalizer extends SchemaNameNormalization {
        private Normalizer() {
            super(Map.of());
        }

        private void choices(CodeModel model) {
            normalizeUnnamedChoiceType(model, new LinkedHashSet<>());
        }

        private void objects(CodeModel model) {
            normalizeUnnamedObjectTypeInArray(model, new LinkedHashSet<>());
        }
    }
}
