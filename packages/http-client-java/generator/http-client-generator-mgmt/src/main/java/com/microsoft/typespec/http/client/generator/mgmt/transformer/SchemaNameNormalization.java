// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Header;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Metadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Value;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.preprocessor.namer.CodeNamer;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import io.clientcore.core.utils.CoreUtils;
import java.util.ArrayList;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;

/**
 * Normalize the names of some unnamed schemas.
 */
public class SchemaNameNormalization {

    private static final Logger LOGGER
        = new PluginLogger(FluentNamer.getPluginInstance(), SchemaNameNormalization.class);

    private final Map<String, String> nameOverridePlan = new LinkedHashMap<>();

    public SchemaNameNormalization(Map<String, String> nameOverridePlan) {
        nameOverridePlan.forEach((k, v) -> {
            char[] kCharArray = k.toCharArray();
            char[] vCharArray = v.toCharArray();

            kCharArray[0] = Character.toLowerCase(kCharArray[0]);
            vCharArray[0] = Character.toLowerCase(vCharArray[0]);
            this.nameOverridePlan.put(new String(kCharArray), new String(vCharArray));

            kCharArray[0] = Character.toUpperCase(kCharArray[0]);
            vCharArray[0] = Character.toUpperCase(vCharArray[0]);
            this.nameOverridePlan.put(new String(kCharArray), new String(vCharArray));
        });
    }

    public CodeModel process(CodeModel codeModel) {
        codeModel = namingOverride(codeModel);
        Set<String> names = new LinkedHashSet<>();
        codeModel = normalizeUnnamedAdditionalProperties(codeModel, names);
        codeModel = normalizeUnnamedBaseType(codeModel, names);
        codeModel = normalizeUnnamedObjectTypeInArray(codeModel, names);    // after normalizeUnnamedBaseType
        codeModel = normalizeUnnamedChoiceType(codeModel, names);
        codeModel = normalizeUnnamedRequestBody(codeModel, names);
        return codeModel;
    }

    protected CodeModel normalizeUnnamedObjectTypeInArray(CodeModel codeModel, Set<String> names) {
        final String prefix = "Components";
        final String postfix = "Items";

        List<ObjectSchema> unnamedObjectSchemas = codeModel.getSchemas().getObjects().stream().filter(s -> {
            String name = Utils.getDefaultName(s);
            return name.startsWith(prefix) && name.endsWith(postfix);
        }).collect(Collectors.toList());
        if (!unnamedObjectSchemas.isEmpty()) {
            SchemaReferences references = new SchemaReferences(codeModel);
            unnamedObjectSchemas.forEach(s -> renameSchema(references, s, names));
        }
        return codeModel;
    }

    protected CodeModel normalizeUnnamedChoiceType(CodeModel codeModel, Set<String> names) {
        List<ChoiceSchema> unnamedChoiceSchemas = codeModel.getSchemas()
            .getChoices()
            .stream()
            .filter(s -> isUnnamedChoice(Utils.getDefaultName(s)))
            .collect(Collectors.toList());
        SchemaReferences references = unnamedChoiceSchemas.isEmpty() ? null : new SchemaReferences(codeModel);
        if (references != null) {
            for (ChoiceSchema schema : unnamedChoiceSchemas) {
                renameSchema(references, schema, names);
            }
        }

        List<SealedChoiceSchema> unnamedSealedChoiceSchemas = codeModel.getSchemas()
            .getSealedChoices()
            .stream()
            .filter(s -> isUnnamedChoice(Utils.getDefaultName(s)))
            .collect(Collectors.toList());
        if (!unnamedSealedChoiceSchemas.isEmpty()) {
            if (references == null) {
                references = new SchemaReferences(codeModel);
            }
            for (SealedChoiceSchema schema : unnamedSealedChoiceSchemas) {
                renameSchema(references, schema, names);
            }
        }

        return codeModel;
    }

    private static boolean isUnnamedChoice(String name) {
        // unnamed choice type is named by modelerfour as e.g. Enum11
        final String prefix = "Enum";

        boolean unnamed = false;
        if (name.startsWith(prefix)) {
            String restName = name.substring(prefix.length());
            try {
                Integer.parseInt(restName);
                unnamed = true;
            } catch (NumberFormatException e) {
                // ignore
            }
        }
        return unnamed;
    }

    private static void renameSchema(SchemaReferences references, Schema schema, Set<String> names) {
        NamingContext context = references.usages.get(schema);
        if (context == null) {
            return;
        }
        String valueName = context.value instanceof Property
            ? ((Property) context.value).getSerializedName()
            : Utils.getDefaultName(context.value);
        String suffix = context.arrayProperty ? Utils.getSingular(valueName) : valueName;
        // Resolve the owner's name now: earlier normalization may have renamed it after indexing.
        String newName = rename(Utils.getDefaultName(context.owner) + CodeNamer.toPascalCase(suffix), names, false);
        if (context.value instanceof Property) {
            LOGGER.warn("Rename schema from '{}' to '{}', based on parent schema '{}' and property '{}'",
                Utils.getDefaultName(schema), newName, Utils.getDefaultName(context.owner), valueName);
        } else {
            LOGGER.warn("Rename schema from '{}' to '{}', based on operation group '{}'", Utils.getDefaultName(schema),
                newName, Utils.getDefaultName(context.owner));
        }
        schema.getLanguage().getDefault().setName(newName);
    }

    private static final class SchemaReferences {
        private final Map<Schema, NamingContext> usages = new IdentityHashMap<>();

        private SchemaReferences(CodeModel codeModel) {
            // Keep the original four-tier precedence, and the first owner/value within each tier.
            for (ObjectSchema owner : codeModel.getSchemas().getObjects()) {
                for (Property property : owner.getProperties()) {
                    add(property.getSchema(), owner, property, false);
                }
            }
            for (ObjectSchema owner : codeModel.getSchemas().getObjects()) {
                for (Property property : owner.getProperties()) {
                    if (property.getSchema() instanceof ArraySchema) {
                        add(((ArraySchema) property.getSchema()).getElementType(), owner, property, true);
                    }
                }
            }
            indexParameters(codeModel, false);
            indexParameters(codeModel, true);
        }

        private void indexParameters(CodeModel codeModel, boolean arrays) {
            for (OperationGroup group : codeModel.getOperationGroups()) {
                for (Operation operation : group.getOperations()) {
                    Stream
                        .concat(operation.getParameters().stream(),
                            operation.getRequests().stream().flatMap(request -> request.getParameters().stream()))
                        .forEach(parameter -> {
                            Schema schema = parameter.getSchema();
                            if (!arrays) {
                                add(schema, group, parameter, false);
                            } else if (schema instanceof ArraySchema) {
                                add(((ArraySchema) schema).getElementType(), group, parameter, false);
                            }
                        });
                }
            }
        }

        private void add(Schema schema, Metadata owner, Value value, boolean arrayProperty) {
            if (schema != null && !usages.containsKey(schema)) {
                usages.put(schema, new NamingContext(owner, value, arrayProperty));
            }
        }
    }

    private static final class NamingContext {
        private final Metadata owner;
        private final Value value;
        private final boolean arrayProperty;

        private NamingContext(Metadata owner, Value value, boolean arrayProperty) {
            this.owner = owner;
            this.value = value;
            this.arrayProperty = arrayProperty;
        }
    }

    protected CodeModel normalizeUnnamedAdditionalProperties(CodeModel codeModel, Set<String> names) {
        // unnamed type is named by modelerfour as e.g.
        // ComponentsQit0EtSchemasManagedclusterpropertiesPropertiesIdentityprofileAdditionalproperties

        final String prefix = "Components";
        final String postfix = "Additionalproperties";

        codeModel.getSchemas()
            .getDictionaries()
            .stream()
            .filter(s -> s.getElementType() instanceof ObjectSchema)
            .forEach(dict -> {
                ObjectSchema schema = (ObjectSchema) dict.getElementType();

                List<Schema> subtypes = new ArrayList<>();
                subtypes.add(schema);
                if (schema.getChildren() != null && schema.getChildren().getAll() != null) {
                    subtypes.addAll(schema.getChildren().getAll());
                }

                for (Schema type : subtypes) {
                    String name = Utils.getDefaultName(type);
                    if (name.startsWith(prefix) && name.endsWith(postfix)) {
                        String newName = Utils.getDefaultName(dict);
                        newName = rename(newName, names);
                        type.getLanguage().getDefault().setName(newName);
                        LOGGER.warn("Rename schema default name, from '{}' to '{}'", name, newName);
                    }
                }
            });

        return codeModel;
    }

    protected CodeModel normalizeUnnamedBaseType(CodeModel codeModel, Set<String> names) {
        // unnamed base type is named by modelerfour as e.g. Components1Q1Og48SchemasManagedclusterAllof1

        final String prefix = "Components";
        final String allOf = "Allof";

        codeModel.getSchemas().getObjects().forEach(schema -> {
            String name = Utils.getDefaultName(schema);
            if (schema.getChildren() != null
                && !CoreUtils.isNullOrEmpty(schema.getChildren().getImmediate())
                && name.startsWith(prefix)
                && name.contains(allOf)) {
                int index = name.lastIndexOf(allOf) + allOf.length();
                boolean unnamed = false;
                String restName = name.substring(index);
                if (restName.isEmpty()) {
                    unnamed = true;
                } else {
                    try {
                        Integer.parseInt(restName);
                        unnamed = true;
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }

                if (unnamed) {
                    Schema firstChild = schema.getChildren().getImmediate().iterator().next();
                    String newName = "Base" + Utils.getDefaultName(firstChild);
                    newName = rename(newName, names);
                    schema.getLanguage().getDefault().setName(newName);
                    LOGGER.warn("Rename schema default name, from '{}' to '{}'", name, newName);
                }
            }
        });

        return codeModel;
    }

    protected CodeModel normalizeUnnamedRequestBody(CodeModel codeModel, Set<String> names) {
        // unnamed request body is named by modelerfour as e.g.
        // Paths1Ezr0XyApplicationsApplicationIdMicrosoftGraphGetmembergroupsPostRequestbodyContentApplicationJsonSchema

        final String prefix = "Paths";
        final String postfix = "Schema";
        final String requestBody = "Requestbody";

        codeModel.getOperationGroups()
            .forEach(og -> og.getOperations().forEach(operation -> operation.getRequests().forEach(request -> {
                Optional<Schema> bodySchemaOpt = request.getParameters()
                    .stream()
                    .filter(p -> p.getSchema() != null
                        && p.getProtocol() != null
                        && p.getProtocol().getHttp() != null
                        && p.getProtocol().getHttp().getIn() == RequestParameterLocation.BODY)
                    .map(Value::getSchema)
                    .findFirst();
                if (bodySchemaOpt.isPresent()) {
                    Schema schema = bodySchemaOpt.get();
                    String name = Utils.getDefaultName(schema);
                    if (name.startsWith(prefix) && name.endsWith(postfix) && name.contains(requestBody)) {
                        String newName = Utils.getDefaultName(og) + Utils.getDefaultName(operation) + "RequestBody";
                        newName = rename(newName, names);
                        schema.getLanguage().getDefault().setName(newName);
                        LOGGER.warn("Rename schema default name, from '{}' to '{}'", name, newName);
                    }
                }
            })));

        return codeModel;
    }

    private static String rename(String name, Set<String> names) {
        return rename(name, names, true);
    }

    private static String rename(String name, Set<String> names, boolean deduplicate) {
        // modelerfour does a bad job of deduplicate on unnamed Enum, so deduplicate=false when processing unnamed Enum
        if (!deduplicate || !names.contains(name)) {
            names.add(name);
        } else {
            final int maxTry = 100;
            int index = 1;
            while (index < maxTry) {
                String name1 = name + index;
                if (!names.contains(name1)) {
                    names.add(name1);
                    return name1;
                }
                ++index;
            }
        }
        return name;
    }

    private CodeModel namingOverride(CodeModel codeModel) {
        if (!nameOverridePlan.isEmpty()) {
            overrideName(codeModel);

            codeModel.getSchemas().getObjects().forEach(this::overrideName);
            codeModel.getSchemas()
                .getObjects()
                .stream()
                .flatMap(o -> o.getProperties().stream())
                .forEach(this::overrideName);

            codeModel.getSchemas().getAnds().forEach(this::overrideName);
            codeModel.getSchemas().getChoices().forEach(this::overrideName);
            codeModel.getSchemas().getSealedChoices().forEach(this::overrideName);
            codeModel.getSchemas().getDictionaries().forEach(this::overrideName);

            codeModel.getOperationGroups().forEach(this::overrideName);
            codeModel.getOperationGroups()
                .stream()
                .flatMap(og -> og.getOperations().stream())
                .forEach(this::overrideName);
            codeModel.getOperationGroups()
                .stream()
                .flatMap(og -> og.getOperations().stream())
                .flatMap(o -> o.getParameters().stream())
                .forEach(this::overrideName);
            codeModel.getOperationGroups()
                .stream()
                .flatMap(og -> og.getOperations().stream())
                .flatMap(o -> o.getRequests().stream())
                .flatMap(r -> r.getParameters().stream())
                .forEach(this::overrideName);

            codeModel.getOperationGroups()
                .stream()
                .flatMap(og -> og.getOperations().stream())
                .flatMap(o -> o.getResponses().stream())
                .filter(r -> r.getProtocol().getHttp().getHeaders() != null)
                .flatMap(r -> r.getProtocol().getHttp().getHeaders().stream())
                .forEach(this::overrideName);
        }
        return codeModel;
    }

    private void overrideName(Metadata m) {
        String name = Utils.getDefaultName(m);
        String newName = overrideName(name);
        if (!name.equals(newName)) {
            m.getLanguage().getDefault().setName(newName);
            LOGGER.info("Override default name, from '{}' to '{}'", name, newName);
        }
    }

    private void overrideName(Header h) {
        String name = (h.getLanguage() != null && h.getLanguage().getDefault() != null)
            ? h.getLanguage().getDefault().getName()
            : null;
        if (name != null) {
            String newName = overrideName(name);
            if (!name.equals(newName)) {
                h.getLanguage().getDefault().setName(newName);
                // LOGGER.info("Override default name, from '{}' to '{}'", name, newName);
            }
        }

        // We should not modify header name directly
        // for backward compatibility, here it only change case, where header is case-insensitive
        name = h.getHeader();
        String newName = overrideName(name);
        if (!name.equals(newName)) {
            if (name.equalsIgnoreCase(newName)) {
                LOGGER.info("Override response header, from '{}' to '{}'", name, newName);
                h.setHeader(newName);
            } else {
                LOGGER.info("Abort override response header, from '{}' to '{}'", name, newName);
            }
        }
    }

    private String overrideName(String name) {
        String newName = name;
        for (Map.Entry<String, String> entry : nameOverridePlan.entrySet()) {
            int index = newName.indexOf(entry.getKey());
            if (index >= 0) {
                int endIndex = index + entry.getKey().length();
                if (wordMatch(newName, index, endIndex)) {
                    newName = newName.replace(entry.getKey(), entry.getValue());
                }
            }
        }
        return newName;
    }

    // Whether the match is the whole word in the name.
    // E.g. "lower": "loWer", and the actual name is "flower". We won't replace it to be "floWer".
    private boolean wordMatch(String name, int index, int endIndex) {
        return !((index > 0 && isSameCase(name.charAt(index - 1), name.charAt(index)))
            || (endIndex < name.length() && isSameCase(name.charAt(endIndex - 1), name.charAt(endIndex))));
    }

    private static boolean isSameCase(char c1, char c2) {
        return (Character.isUpperCase(c1) && Character.isUpperCase(c2))
            || (Character.isLowerCase(c1) && Character.isLowerCase(c2));
    }
}
