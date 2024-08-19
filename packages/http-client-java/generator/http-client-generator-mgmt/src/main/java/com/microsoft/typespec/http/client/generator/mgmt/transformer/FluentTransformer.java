// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.UuidSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.azure.core.util.CoreUtils;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

public class FluentTransformer {

    private final FluentJavaSettings fluentJavaSettings;

    private final Logger logger = new PluginLogger(FluentNamer.getPluginInstance(), FluentTransformer.class);

    public FluentTransformer(FluentJavaSettings fluentJavaSettings) {
        this.fluentJavaSettings = fluentJavaSettings;
    }

    public CodeModel preTransform(CodeModel codeModel) {
        codeModel = removeXml(codeModel);
        codeModel = deduplicateOperations(codeModel);
        codeModel = normalizeParameterLocation(codeModel);
        codeModel = renameUngroupedOperationGroup(codeModel, fluentJavaSettings);
        codeModel = new SchemaNameNormalization(fluentJavaSettings.getNamingOverride()).process(codeModel);
        codeModel = new ConstantSchemaOptimization().process(codeModel);
        codeModel = renameHostParameter(codeModel);
        codeModel = transformSubscriptionIdUuid(codeModel);
        return codeModel;
    }

    public CodeModel postTransform(CodeModel codeModel) {
        codeModel = new OperationGroupFilter(fluentJavaSettings.getJavaNamesForRemoveOperationGroup()).process(codeModel);
        codeModel = new OperationGroupRenamer(fluentJavaSettings.getJavaNamesForRenameOperationGroup()).process(codeModel);
        codeModel = new NamingConflictResolver().process(codeModel);
        codeModel = new SchemaRenamer(fluentJavaSettings.getJavaNamesForRenameModel()).process(codeModel);
        codeModel = new OperationNameNormalization().process(codeModel);
        codeModel = new ResourceTypeNormalization().process(codeModel);
        codeModel = new ErrorTypeNormalization().process(codeModel);
        codeModel = new ResponseStatusCodeNormalization().process(codeModel);
        if (fluentJavaSettings.isResourcePropertyAsSubResource()) {
            codeModel = new ResourcePropertyNormalization().process(codeModel);
        }
        codeModel = new SchemaCleanup(fluentJavaSettings.getJavaNamesForPreserveModel()).process(codeModel);
        return codeModel;
    }

    protected CodeModel deduplicateOperations(CodeModel codeModel) {
        // avoid duplicate Operations_List, which is common in management-plane
        codeModel.getOperationGroups().stream()
                .filter(og -> "Operations".equalsIgnoreCase(Utils.getDefaultName(og)))
                .findFirst().ifPresent(og -> {
                    List<Operation> deduplicatedOperations = og.getOperations().stream()
                            .filter(o -> Utils.getDefaultName(o) != null)
                            .collect(Collectors.toMap(Utils::getDefaultName, Function.identity(), (p, q) -> p)).values()
                            .stream().filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    deduplicatedOperations.addAll(og.getOperations().stream()
                            .filter(o -> Utils.getDefaultName(o) == null)
                            .collect(Collectors.toList()));

                    if (deduplicatedOperations.size() < og.getOperations().size()) {
                        logger.warn("Duplicate operations found in operation group 'Operations'");
                        og.setOperations(deduplicatedOperations);
                    }
                });

        return codeModel;
    }

    protected CodeModel normalizeParameterLocation(CodeModel codeModel) {
        List<Parameter> modifiedGlobalParameters = new ArrayList<>();
        codeModel.getGlobalParameters().stream().filter(p -> p.getImplementation() == Parameter.ImplementationLocation.CLIENT
                && p.getProtocol() != null && p.getProtocol().getHttp() != null).forEach(p -> {
                    String serializedName = p.getLanguage().getDefault().getSerializedName();
                    if ((p.getProtocol().getHttp().getIn() == RequestParameterLocation.PATH && !"subscriptionId".equalsIgnoreCase(serializedName))
                            || (p.getProtocol().getHttp().getIn() == RequestParameterLocation.QUERY && !"api-version".equalsIgnoreCase(serializedName))) {
                        logger.warn("Modify parameter '{}' implementation from CLIENT to METHOD", serializedName);
                        p.setImplementation(Parameter.ImplementationLocation.METHOD);
                        modifiedGlobalParameters.add(p);
                    }
                });
        if (!modifiedGlobalParameters.isEmpty()) {
            // add now METHOD parameter to signature parameters
            codeModel.getOperationGroups().stream().flatMap(og -> og.getOperations().stream()).forEach(o -> {
                List<Parameter> parameters = o.getParameters();
                List<Parameter> signatureParameters = o.getSignatureParameters();
                for (Parameter parameter : modifiedGlobalParameters) {
                    if (!signatureParameters.contains(parameter) && parameters.contains(parameter)) {
                        signatureParameters.add(parameter);
                    }
                }
            });
        }
        return codeModel;
    }

    protected CodeModel renameUngroupedOperationGroup(CodeModel codeModel, FluentJavaSettings settings) {
        final String nameForUngroupedOperations = Utils.getNameForUngroupedOperations(codeModel, settings);
        if (nameForUngroupedOperations == null) {
            return codeModel;
        }

        codeModel.getOperationGroups().stream()
                .filter(og -> Utils.getDefaultName(og) == null || Utils.getDefaultName(og).isEmpty())
                .forEach(og -> {
                    logger.info("Rename ungrouped operation group to '{}'", nameForUngroupedOperations);
                    og.set$key(nameForUngroupedOperations);
                    og.getLanguage().getDefault().setName(nameForUngroupedOperations);
                });
        return codeModel;
    }

    /**
     * Renames $host to endpoint.
     *
     * @param codeModel Code model.
     * @return Processed code model.
     */
    protected CodeModel renameHostParameter(CodeModel codeModel) {
        codeModel.getGlobalParameters().stream()
                .filter(p -> "$host".equals(p.getLanguage().getDefault().getSerializedName()))
                .forEach(p -> {
                    p.getLanguage().getDefault().setName("endpoint");
                });
        return codeModel;
    }

    private CodeModel transformSubscriptionIdUuid(CodeModel codeModel) {
        // if globalParameter has "subscriptionId" and is UuidSchema, then make the schema StringSchema
        codeModel.getGlobalParameters().stream()
            .filter(p -> "subscriptionId".equals(p.getLanguage().getDefault().getSerializedName())
                && p.getSchema() instanceof UuidSchema)
            .forEach(p -> {
                Schema oldSchema = p.getSchema();
                StringSchema newSchema = new StringSchema();
                // copy schema metadata
                newSchema.setLanguage(oldSchema.getLanguage());
                newSchema.setProtocol(oldSchema.getProtocol());
                newSchema.setExtensions(oldSchema.getExtensions());

                newSchema.setType(Schema.AllSchemaTypes.STRING);
                newSchema.setSummary(oldSchema.getSummary());
                newSchema.setExample(oldSchema.getExample());
                newSchema.setSerialization(oldSchema.getSerialization());
                newSchema.set$key(oldSchema.get$key());
                newSchema.setUid(oldSchema.getUid());
                newSchema.setDescription(oldSchema.getDescription());
                newSchema.setApiVersions(oldSchema.getApiVersions());
                newSchema.setDeprecated(oldSchema.getDeprecated());
                newSchema.setExternalDocs(oldSchema.getExternalDocs());
                p.setSchema(newSchema);
            });
        return codeModel;
    }

    private static CodeModel removeXml(CodeModel codeModel) {
        // remove xml from serializationFormats, as mgmt currently does not have dependency on jackson-dataformat-xml package
        if (!CoreUtils.isNullOrEmpty(codeModel.getSchemas().getObjects())) {
            codeModel.getSchemas().getObjects().forEach(o -> {
                if (!CoreUtils.isNullOrEmpty(o.getSerializationFormats())) {
                    o.getSerializationFormats().remove("xml");
                }
            });
        }
        return codeModel;
    }
}
