// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ArraySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.model.WellKnownMethodName;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.azure.core.http.HttpMethod;
import org.slf4j.Logger;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Normalizes the names of common operations (list, get, delete).
 */
class OperationNameNormalization {

    private static final Logger LOGGER = new PluginLogger(FluentNamer.getPluginInstance(), OperationNameNormalization.class);

    private static final Pattern TRIM_LEADING_AND_TRAILING_FORWARD_SLASH = Pattern.compile("^(?:/*)?(.*?)(?:/*)?$");

    public CodeModel process(CodeModel codeModel) {
        codeModel.getOperationGroups().forEach(OperationNameNormalization::process);
        return codeModel;
    }

    private static final String SEGMENT_SUBSCRIPTIONS = "subscriptions";
    private static final String SEGMENT_RESOURCE_GROUPS = "resourceGroups";
    private static final String SEGMENT_PROVIDERS = "providers";

    private static void process(OperationGroup operationGroup) {
        Map<String, String> renamePlan = makeRenamePlan(operationGroup);
        applyRename(operationGroup, renamePlan);
    }

    private static void applyRename(OperationGroup operationGroup, Map<String, String> renamePlan) {
        Optional<Set<String>> conflictNames = checkConflict(operationGroup, renamePlan);
        conflictNames.ifPresent(names -> {
            LOGGER.warn("Conflict operation name found after attempted rename '{}', in operation group '{}'", names, Utils.getJavaName(operationGroup));
            renamePlan.values().removeAll(names);
        });

        rename(operationGroup, renamePlan);
    }

    private static Optional<Set<String>> checkConflict(OperationGroup operationGroup, Map<String, String> renamePlan) {
        List<String> names = operationGroup.getOperations().stream()
                .map(Utils::getJavaName)
                .map(name -> renamePlan.getOrDefault(name, name))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        Set<String> namesWithConflict = names.stream()
                .collect(Collectors.groupingBy(Function.identity()))
                .entrySet().stream()
                .filter(e -> e.getValue().size() > 1)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());

        return namesWithConflict.isEmpty() ? Optional.empty() : Optional.of(namesWithConflict);
    }

    private static void rename(OperationGroup operationGroup, Map<String, String> renamePlan) {
        operationGroup.getOperations().stream()
                .filter(operation -> renamePlan.containsKey(Utils.getJavaName(operation)))
                .forEach(operation -> {
                    String newName = renamePlan.get(Utils.getJavaName(operation));
                    LOGGER.info("Rename operation from '{}' to '{}', in operation group '{}'", Utils.getJavaName(operation), newName, Utils.getJavaName(operationGroup));
                    operation.getLanguage().getJava().setName(newName);
                    if (operation.getConvenienceApi() != null) {
                        operation.getConvenienceApi().getLanguage().getJava().setName(newName);
                    }
                });
    }

    private static Map<String, String> makeRenamePlan(OperationGroup operationGroup) {
        final Set<WellKnownMethodName> candidateWellKnownName = new HashSet<>(Arrays.asList(
                WellKnownMethodName.LIST,
                WellKnownMethodName.LIST_BY_RESOURCE_GROUP,
                WellKnownMethodName.GET_BY_RESOURCE_GROUP,
                WellKnownMethodName.DELETE));

        Map<String, String> renamePlan = new HashMap<>();

        for (Operation operation : operationGroup.getOperations()) {
            String path = operation.getRequests().iterator().next().getProtocol().getHttp().getPath().trim();
            Matcher matcher = TRIM_LEADING_AND_TRAILING_FORWARD_SLASH.matcher(path);
            if (matcher.matches()) {
                path = matcher.group(1);
            }
            String[] urlSegments = path.split(Pattern.quote("/"));

            String newName = null;
            if (HttpMethod.GET.name().equalsIgnoreCase(operation.getRequests().iterator().next().getProtocol().getHttp().getMethod())) {
                if (urlSegments.length == 8 // e.g. subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.AzureSphere/catalogs/{catalogName}
                        && urlSegments[0].equalsIgnoreCase(SEGMENT_SUBSCRIPTIONS)
                        && urlSegments[2].equalsIgnoreCase(SEGMENT_RESOURCE_GROUPS)
                        && urlSegments[4].equalsIgnoreCase(SEGMENT_PROVIDERS)) {
                    if (candidateWellKnownName.contains(WellKnownMethodName.GET_BY_RESOURCE_GROUP)) {
                        newName = WellKnownMethodName.GET_BY_RESOURCE_GROUP.getMethodName();

                        normalizePathParameterOrder(operation, urlSegments);
                    }
                } else if ((urlSegments.length == 5 || urlSegments.length == 7)
                        && urlSegments[0].equalsIgnoreCase(SEGMENT_SUBSCRIPTIONS)
                        && isPossiblePagedList(operation)
                        && hasArrayInResponse(operation.getResponses())) {
                    if (candidateWellKnownName.contains(WellKnownMethodName.LIST_BY_RESOURCE_GROUP)) {
                        if ((urlSegments.length == 7 && urlSegments[2].equalsIgnoreCase(SEGMENT_RESOURCE_GROUPS))
                                || (urlSegments.length == 5 && !urlSegments[2].equalsIgnoreCase(SEGMENT_PROVIDERS))) {
                            newName = WellKnownMethodName.LIST_BY_RESOURCE_GROUP.getMethodName();
                        }
                    }
                    if (candidateWellKnownName.contains(WellKnownMethodName.LIST)) {
                        if (urlSegments.length == 5 && urlSegments[2].equalsIgnoreCase(SEGMENT_PROVIDERS)) {
                            // e.g. subscriptions/{subscriptionId}/providers/Microsoft.AzureSphere/catalogs
                            newName = WellKnownMethodName.LIST.getMethodName();
                        }
                    }
                }
            } else if (HttpMethod.DELETE.name().equalsIgnoreCase(operation.getRequests().iterator().next().getProtocol().getHttp().getMethod())) {
                if (urlSegments.length == 8
                        && urlSegments[0].equalsIgnoreCase(SEGMENT_SUBSCRIPTIONS)
                        && urlSegments[2].equalsIgnoreCase(SEGMENT_RESOURCE_GROUPS)
                        && urlSegments[4].equalsIgnoreCase(SEGMENT_PROVIDERS)) {
                    if (candidateWellKnownName.contains(WellKnownMethodName.DELETE)) {
                        newName = WellKnownMethodName.DELETE.getMethodName();

                        normalizePathParameterOrder(operation, urlSegments);
                    }
                }
            }

            if (newName != null) {
                if (!newName.equals(Utils.getJavaName(operation))) {
                    renamePlan.put(Utils.getJavaName(operation), newName);
                }
                candidateWellKnownName.remove(WellKnownMethodName.fromMethodName(newName));
            }
        }

        return renamePlan;
    }

    private static void normalizePathParameterOrder(Operation operation, String[] urlSegments) {
        // check path parameter order
        String resourceGroupParameterName = parameterSerializedName(urlSegments[3]);
        operation.getRequests().forEach(request -> {
            List<Parameter> pathMethodParameters = request.getParameters().stream()
                    .filter(OperationNameNormalization::isPathParameterInMethod)
                    .collect(Collectors.toList());
            if (pathMethodParameters.size() == 2
                    && resourceGroupParameterName.equals(pathMethodParameters.get(1).getLanguage().getDefault().getSerializedName())) {
                // resourceGroup parameter and resourceName parameter in reverse order
                String resourceNameParameterName = parameterSerializedName(urlSegments[7]);

                LOGGER.info("Reorder '{}' parameter and '{}' parameter, in operation '{}'", resourceGroupParameterName, resourceNameParameterName, Utils.getJavaName(operation));

                int rgIndex = -1;
                int nameIndex = -1;
                for (int i = 0; i < request.getParameters().size(); ++i) {
                    Parameter p = request.getParameters().get(i);
                    if (isPathParameterInMethod(p)) {
                        if (resourceGroupParameterName.equals(p.getLanguage().getDefault().getSerializedName())) {
                            rgIndex = i;
                        } else if (resourceNameParameterName.equals(p.getLanguage().getDefault().getSerializedName())) {
                            nameIndex = i;
                        }
                    }
                }
                if (rgIndex >= 0 && nameIndex >= 0) {
                    Collections.swap(request.getParameters(), rgIndex, nameIndex);
                }
            }
        });
    }

    private static boolean isPossiblePagedList(Operation operation) {
        return (operation.getExtensions() != null && operation.getExtensions().getXmsPageable() != null);
//                || (Utils.getJavaName(operation).equals(WellKnownMethodName.LIST) || Utils.getJavaName(operation).equals(WellKnownMethodName.LIST_BY_RESOURCE_GROUP));
    }

    private static boolean hasArrayInResponse(List<Response> responses) {
        return responses.stream()
                .anyMatch(r -> r.getSchema() instanceof ObjectSchema
                        && ((ObjectSchema) r.getSchema()).getProperties().stream().anyMatch(p -> p.getSerializedName().equals("value") && p.getSchema() instanceof ArraySchema));
    }

    private static boolean isPathParameterInMethod(Parameter parameter) {
        return parameter.getImplementation() == Parameter.ImplementationLocation.METHOD
                && parameter.getProtocol() != null
                && parameter.getProtocol().getHttp() != null
                && parameter.getProtocol().getHttp().getIn() == RequestParameterLocation.PATH;
    }

    private static String parameterSerializedName(String parameterNameInUrl) {
        if (parameterNameInUrl.startsWith("{") && parameterNameInUrl.endsWith("}")) {
            parameterNameInUrl = parameterNameInUrl.substring(1, parameterNameInUrl.length() - 1);
        }
        return parameterNameInUrl;
    }
}
