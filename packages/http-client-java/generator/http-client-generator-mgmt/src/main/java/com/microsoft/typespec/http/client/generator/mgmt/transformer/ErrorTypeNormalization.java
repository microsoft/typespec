// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Relations;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Value;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.azure.core.util.CoreUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class ErrorTypeNormalization {

    private static final Logger LOGGER = new PluginLogger(FluentNamer.getPluginInstance(), ErrorTypeNormalization.class);

    private static final String ERROR_PROPERTY_NAME = "error";

    public CodeModel process(CodeModel codeModel) {
        codeModel.getOperationGroups().stream()
                .flatMap(og -> og.getOperations().stream())
                .flatMap(o -> o.getExceptions().stream())
                .map(Response::getSchema)
                .filter(Objects::nonNull)
                .distinct()
                .forEach(s -> process((ObjectSchema) s));

        return codeModel;
    }

    private static final Set<String> MANAGEMENT_ERROR_FIELDS = new HashSet<>(Arrays.asList("code", "message", "target", "details", "additionalInfo"));
    private static final Set<String> MANAGEMENT_ERROR_FIELDS_MIN_REQUIRED = new HashSet<>(Arrays.asList("code", "message"));

    private static final ObjectSchema DUMMY_ERROR = dummyManagementError();

    private static ObjectSchema dummyManagementError() {
        ObjectSchema schema = new ObjectSchema();
        schema.setLanguage(new Languages());
        schema.getLanguage().setJava(new Language());
        schema.getLanguage().getJava().setName(FluentType.MANAGEMENT_ERROR.getName());
        schema.setProperties(new ArrayList<>());
        schema.getProperties().add(new Property());
        schema.getProperties().get(0).setSerializedName("code");
        schema.getProperties().add(new Property());
        schema.getProperties().get(1).setSerializedName("message");
        return schema;
    }

    private void process(ObjectSchema error) {
        ObjectSchema errorSchema = error;

        Optional<ObjectSchema> errorSchemaOpt = error.getProperties().stream()
                .filter(p -> ERROR_PROPERTY_NAME.equalsIgnoreCase(p.getSerializedName()))
                .map(Value::getSchema)
                .filter(s -> s instanceof ObjectSchema)
                .map(s -> (ObjectSchema) s)
                .findFirst();

        if (errorSchemaOpt.isPresent()) {
            errorSchema = errorSchemaOpt.get();
        }

        normalizeErrorType(error, errorSchema);
    }

    private void normalizeErrorType(ObjectSchema error, ObjectSchema errorSchema) {
        switch (getErrorType(errorSchema)) {
            case MANAGEMENT_ERROR:
                final boolean updateChildrenParent = errorSchema != error && existNoneExceptionChildren(error);

                LOGGER.info("Rename error from '{}' to 'ManagementError'", Utils.getJavaName(error));

                error.getLanguage().getJava().setName(FluentType.MANAGEMENT_ERROR.getName());

                if (errorSchema != error) {
                    errorSchema.getLanguage().getJava().setName(FluentType.MANAGEMENT_ERROR.getName());
                }

                if (updateChildrenParent) {
                    // update its subclass of usage=input/output, to avoid inherit from this error model "ErrorResponse"
                    error.getChildren().getAll().stream().filter(ErrorTypeNormalization::usedMoreThanException).forEach(o -> {
                        if (o instanceof ObjectSchema) {
                            adaptForParentSchema((ObjectSchema) o, error);
                        }
                    });
                }

                if (errorSchema != error && !updateChildrenParent) {
                    error.setChildren(errorSchema.getChildren());
                }

                normalizeSubclass(errorSchema);

                break;

            case SUBCLASS_MANAGEMENT_ERROR:
                LOGGER.info("Modify error '{}' as subclass of 'ManagementError'", Utils.getJavaName(error));

                error.getLanguage().getJava().setName(Utils.getJavaName(errorSchema));

                // make it a subclass of ManagementError
                Relations parents = new Relations();
                parents.setAll(Collections.singletonList(DUMMY_ERROR));
                parents.setImmediate(Collections.singletonList(DUMMY_ERROR));
                errorSchema.setParents(parents);

                if (errorSchema != error) {
                    error.setParents(parents);
                    error.setChildren(errorSchema.getChildren());
                }

                filterProperties(errorSchema);

                if (errorSchema != error) {
                    error.setProperties(errorSchema.getProperties());
                }

                normalizeSubclass(errorSchema);

                break;

            case GENERIC:
                break;
        }
    }

    private void adaptForParentSchema(ObjectSchema compositeType, ObjectSchema error) {
        // remove "ErrorResponse" from its parents
        Iterator<Schema> itor = compositeType.getParents().getImmediate().iterator();
        while (itor.hasNext()) {
            Schema type = itor.next();
            if (type == error) {
                itor.remove();
                break;
            }
        }
        itor = compositeType.getParents().getAll().iterator();
        while (itor.hasNext()) {
            Schema type = itor.next();
            if (type == error) {
                itor.remove();
                break;
            }
        }

        // move "error" to subclass, make it composite with "error", instead of inherit from "ErrorResponse"
        if (compositeType.getProperties() == null || compositeType.getProperties().stream().noneMatch(p -> ERROR_PROPERTY_NAME.equalsIgnoreCase(p.getSerializedName()))) {
            if (compositeType.getProperties() == null) {
                compositeType.setProperties(new ArrayList<>());
            }
            compositeType.getProperties().add(error.getProperties().stream().filter(p -> ERROR_PROPERTY_NAME.equalsIgnoreCase(p.getSerializedName())).findFirst().get());
        }
    }

    private static boolean existNoneExceptionChildren(ObjectSchema error) {
        return error.getChildren() != null && error.getChildren().getAll().stream()
                .anyMatch(ErrorTypeNormalization::usedMoreThanException);
    }

    private static boolean usedMoreThanException(Schema schema) {
        return !CoreUtils.isNullOrEmpty(schema.getUsage())
                && (schema.getUsage().contains(SchemaContext.INPUT) || schema.getUsage().contains(SchemaContext.OUTPUT));
    }

    private void normalizeSubclass(ObjectSchema errorSchema) {
        if (errorSchema.getChildren() != null && errorSchema.getChildren().getImmediate() != null) {
            for (Schema schema : errorSchema.getChildren().getImmediate()) {
                if (schema instanceof ObjectSchema) {
                    ObjectSchema error = (ObjectSchema) schema;

                    LOGGER.info("Modify type '{}' as subclass of '{}'", Utils.getJavaName(error), Utils.getJavaName(errorSchema));

                    filterProperties(error);
                }
            }
        }
    }

    private void filterProperties(ObjectSchema errorSchema) {
        List<Property> properties = new ArrayList<>();
        errorSchema.getProperties().forEach(p -> {
            if (!MANAGEMENT_ERROR_FIELDS.contains(p.getSerializedName())) {
                p.setReadOnly(true);
                properties.add(p);
            } else if (p.getSerializedName().equals("details")) {
                normalizeErrorDetailType(p);
                if (FluentType.nonManagementError(Utils.getJavaName(((ArraySchema) p.getSchema()).getElementType()))) {
                    p.setReadOnly(true);
                    properties.add(p);
                }
            }
        });
        errorSchema.setProperties(properties);
    }

    private void normalizeErrorDetailType(Property details) {
        Schema detailsSchema = details.getSchema();
        if (detailsSchema instanceof ArraySchema && ((ArraySchema) detailsSchema).getElementType() instanceof ObjectSchema ) {
            ObjectSchema error = (ObjectSchema) ((ArraySchema) detailsSchema).getElementType();
            if (error.getParents() == null || FluentType.nonManagementError(Utils.getJavaName(error.getParents().getImmediate().get(0)))) {
                // if not subclass of ManagementError, normalize it

                switch (getErrorType(error)) {
                    case MANAGEMENT_ERROR:
                        error.getLanguage().getJava().setName(FluentType.MANAGEMENT_ERROR.getName());
                        break;

                    case SUBCLASS_MANAGEMENT_ERROR:
                    case GENERIC:
                        Relations parents = new Relations();
                        parents.setAll(Collections.singletonList(DUMMY_ERROR));
                        parents.setImmediate(Collections.singletonList(DUMMY_ERROR));
                        error.setParents(parents);

                        filterProperties(error);
                        break;
                }
            }
        } else {
            ArraySchema arraySchema = new ArraySchema();
            arraySchema.setLanguage(new Languages());
            arraySchema.getLanguage().setJava(new Language());
            arraySchema.getLanguage().getJava().setName("ManagementErrorDetails");

            arraySchema.setElementType(DUMMY_ERROR);

            details.setSchema(arraySchema);
        }
    }

    private ErrorType getErrorType(ObjectSchema error) {
        Set<String> propertyNames = error.getProperties().stream()
                .map(Property::getSerializedName)
                .collect(Collectors.toSet());

        ErrorType type;
        if (MANAGEMENT_ERROR_FIELDS.containsAll(propertyNames)) {
            type = ErrorType.MANAGEMENT_ERROR;
        } else if (propertyNames.containsAll(MANAGEMENT_ERROR_FIELDS_MIN_REQUIRED)) {
            type = ErrorType.SUBCLASS_MANAGEMENT_ERROR;
        } else {
            type = ErrorType.GENERIC;
        }
        return type;
    }

    private enum ErrorType {
        MANAGEMENT_ERROR, SUBCLASS_MANAGEMENT_ERROR, GENERIC
    }
}
