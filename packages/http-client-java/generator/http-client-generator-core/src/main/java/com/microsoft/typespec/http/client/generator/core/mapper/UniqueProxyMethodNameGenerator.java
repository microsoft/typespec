// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.slf4j.Logger;

/**
 * A type to deduplicate proxy method names when their request has same parameters. For example, one request takes
 * "application/json" and another takes "text/plain", which both are String type i.e., API with multiple content-types.
 */
public final class UniqueProxyMethodNameGenerator {
    private static final Set<ProxyMethodParameter> EXCEPT;
    static {
        EXCEPT = new HashSet<>();
        EXCEPT.add(ProxyMethodParameter.CONTEXT_PARAMETER);
        EXCEPT.add(ProxyMethodParameter.REQUEST_OPTIONS_PARAMETER);
    }
    private final String operationName;
    private final Logger logger;
    // The set of list where each list is the method signature that were seen so far.
    private final Set<List<String>> methodSignatures;

    UniqueProxyMethodNameGenerator(String operationName, Logger logger) {
        this.operationName = operationName;
        this.logger = logger;
        this.methodSignatures = new HashSet<>();
    }

    /**
     * Generates a unique proxy method name using 'operationName' as base name and considering the parameters and
     * request content type. If a conflict is detected with an existing method signature, the method name is modified
     * to ensure uniqueness by appending the request content type or an increasing index number.
     *
     * @param parameters the stream of parameters of the proxy method for which to generate the unique name.
     * @param requestContentType the content type of the request.
     * @return a unique method name.
     */
    String getUniqueName(Stream<ProxyMethodParameter> parameters, String requestContentType) {
        final List<String> signature = new ArrayList<>();
        String name = operationName;
        signature.add(operationName);
        signature.addAll(parameters.filter(p -> !EXCEPT.contains(p))
            .map(p -> p.getWireType().toString())   // simple class name should be enough?
            .collect(Collectors.toList()));

        if (methodSignatures.contains(signature)) {
            // got a conflict on method signature
            String conflictMethodSignature = signature.toString();
            // first try to append media type
            if (!CoreUtils.isNullOrEmpty(requestContentType)) {
                signature.set(0,
                    operationName + CodeNamer.toPascalCase(CodeNamer.removeInvalidCharacters(requestContentType)));
            }

            // if not working, then just append increasing index no.
            int indexNo = 1;
            while (methodSignatures.contains(signature)) {
                signature.set(0, operationName + indexNo);
                ++indexNo;
            }

            // let's hope the new name does not conflict with name from another operation
            name = signature.get(0);
            logger.warn("Rename method to '{}', due to conflict on method signature {}", name, conflictMethodSignature);
        }
        methodSignatures.add(signature);
        return name;
    }
}
