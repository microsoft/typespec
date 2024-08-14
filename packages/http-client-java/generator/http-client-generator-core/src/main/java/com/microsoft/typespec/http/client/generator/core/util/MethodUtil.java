// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.BinarySchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ChoiceValue;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.KnownMediaType;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Language;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Languages;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocol;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Protocols;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Schema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SealedChoiceSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.StringSchema;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.MethodParameter;
import com.azure.core.http.HttpMethod;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public class MethodUtil {

    public static final String REPEATABILITY_REQUEST_ID_HEADER = "repeatability-request-id";
    public static final String REPEATABILITY_FIRST_SENT_HEADER = "repeatability-first-sent";
    public static final String REPEATABILITY_REQUEST_ID_VARIABLE_NAME = CodeNamer.toCamelCase(REPEATABILITY_REQUEST_ID_HEADER);
    public static final String REPEATABILITY_FIRST_SENT_VARIABLE_NAME = CodeNamer.toCamelCase(REPEATABILITY_FIRST_SENT_HEADER);
    public static final String REPEATABILITY_REQUEST_ID_EXPRESSION = "CoreUtils.randomUuid().toString()";
    public static final String REPEATABILITY_FIRST_SENT_EXPRESSION = "DateTimeRfc1123.toRfc1123String(OffsetDateTime.now())";

    public static final String CONTENT_TYPE_APPLICATION_JSON_ERROR_WEIGHT = "application/json;q=0.9";

    private static final Set<HttpMethod> REPEATABILITY_REQUEST_HTTP_METHODS
        = EnumSet.of(HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE, HttpMethod.POST);

    /**
     * Checks that method include special headers for Repeatable Requests Version 1.0 ("repeatability-request-id")
     * @param proxyMethod the proxy method
     * @return whether method include special headers for Repeatable Requests Version 1.0
     */
    public static boolean isMethodIncludeRepeatableRequestHeaders(ProxyMethod proxyMethod) {
        // Repeatable Requests Version 1.0
        // https://docs.oasis-open.org/odata/repeatable-requests/v1.0/cs01/repeatable-requests-v1.0-cs01.html
        if (proxyMethod == null || CoreUtils.isNullOrEmpty(proxyMethod.getSpecialHeaders())) {
            return false;
        }

        // check supported HTTP method
        if (!isHttpMethodSupportRepeatableRequestHeaders(proxyMethod.getHttpMethod())) {
            return false;
        }

        // check "repeatability-request-id" exists
        return proxyMethod.getSpecialHeaders().contains(REPEATABILITY_REQUEST_ID_HEADER);
    }

    public static boolean isHttpMethodSupportRepeatableRequestHeaders(HttpMethod httpMethod) {
        return REPEATABILITY_REQUEST_HTTP_METHODS.contains(httpMethod);
    }

    /**
     * Gets Javadoc description for method parameter.
     *
     * @param parameter the method parameter.
     * @param name the name of method parameter, used when no description found.
     * @param isProtocolMethod whether the description is used for simplified method.
     * @return the Javadoc description for method parameter.
     */
    public static String getMethodParameterDescription(Parameter parameter, String name, boolean isProtocolMethod) {
        String summary = parameter.getSummary();
        String description = null;
        // parameter description
        if (parameter.getLanguage() != null) {
            description = parameter.getLanguage().getDefault().getDescription();
        }

        String javadocDescription = SchemaUtil.mergeSummaryWithDescription(summary, description);
        if (CoreUtils.isNullOrEmpty(javadocDescription)) { // fallback to dummy description only when both summary and description are empty
            javadocDescription = "The " + name + " parameter";
        }

        // add allowed enum values
        if (isProtocolMethod && parameter.getProtocol().getHttp().getIn() != RequestParameterLocation.BODY) {
            javadocDescription = MethodUtil.appendAllowedEnumValuesForEnumType(parameter, javadocDescription);
        }

        return javadocDescription;
    }

    /**
     * Gets the HttpMethod from operation. Returns <code>null</code> if not recognized.
     *
     * @param operation the operation.
     * @return the HttpMethod from operation. <code>null</code> if not recognized.
     */
    public static HttpMethod getHttpMethod(Operation operation) {
        if (!CoreUtils.isNullOrEmpty(operation.getRequests())
                && operation.getRequests().get(0).getProtocol() != null
                && operation.getRequests().get(0).getProtocol().getHttp() != null) {
            try {
                return HttpMethod.valueOf(operation.getRequests().get(0).getProtocol().getHttp().getMethod().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException | NullPointerException e) {
                return null;
            }
        } else {
            return null;
        }
    }

    /**
     * Find the first request consumes binary type, if no binary request, return the first request in requests.
     * If the selected binary request does not have content-type parameter, we will add one for it.
     * Update operation with the result requests list.
     * 
     * @param requests a list of requests
     * @return the first request consumes binary type, if no binary request, return the first request in requests
     */
    public static Request tryMergeBinaryRequestsAndUpdateOperation(List<Request> requests, Operation operation) {
        Request selectedRequest = requests.get(0);
        for (Request request : requests) {
            if (request.getProtocol().getHttp().getKnownMediaType() != null
                    && request.getProtocol().getHttp().getKnownMediaType().equals(KnownMediaType.BINARY)) {
                // add contentType parameter
                if (getContentTypeCount(requests) > 1 && !hasContentTypeParameter(request)) {
                    Parameter contentTypeParameter = createContentTypeParameter(request, operation);
                    request.getParameters().add(findIndexForContentTypeParam(request.getParameters()), contentTypeParameter);
                    if (contentTypeParameter.isRequired()) {
                        request.getSignatureParameters().add(findIndexForContentTypeParam(request.getSignatureParameters()), contentTypeParameter);
                    }
                }
                selectedRequest = request;

                operation.setRequests(new ArrayList<>());
                operation.getRequests().add(selectedRequest);
                break;
            }
        }
        return selectedRequest;
    }

    /**
     * @param request the request to put contentType on
     * @param operation the operation
     * @return the created content type parameter
     */
    public static Parameter createContentTypeParameter(Request request, Operation operation) {
        List<Request> requests = operation.getRequests();
        Parameter contentType = new Parameter();
        contentType.setOperation(operation);
        contentType.setDescription("The content type");
        for (Parameter parameter : request.getParameters()) {
            if (parameter.getSchema() instanceof BinarySchema) {
                contentType.setRequired(parameter.isRequired());
                break;
            }
        }
        contentType.setImplementation(Parameter.ImplementationLocation.METHOD);

        Language language = new Language();
        language.setName("ContentType");
        language.setDescription("The content type");
        SealedChoiceSchema sealedChoiceSchema = new SealedChoiceSchema();
        StringSchema stringSchema = new StringSchema();
        stringSchema.setType(Schema.AllSchemaTypes.STRING);
        sealedChoiceSchema.setChoiceType(stringSchema);
        sealedChoiceSchema.setChoices(getContentTypeChoiceValues(requests));
        sealedChoiceSchema.setType(Schema.AllSchemaTypes.fromValue("sealed-choice"));
        sealedChoiceSchema.setLanguage(new Languages());
        sealedChoiceSchema.getLanguage().setDefault(language);
        sealedChoiceSchema.getLanguage().setJava(language);
        sealedChoiceSchema.setProtocol(new Protocols());

        language = new Language();
        language.setName("contentType");
        language.setSerializedName("Content-Type");
        language.setDescription("The content type");
        contentType.setSchema(sealedChoiceSchema);
        contentType.setImplementation(Parameter.ImplementationLocation.METHOD);
        contentType.setProtocol(new Protocols());
        contentType.getProtocol().setHttp(new Protocol());
        contentType.getProtocol().getHttp().setIn(RequestParameterLocation.HEADER);
        contentType.setLanguage(new Languages());
        contentType.getLanguage().setDefault(language);
        contentType.getLanguage().setJava(language);
        return contentType;
    }

    /**
     * @param requests a list of requests
     * @return true if the requests have different content types, otherwise return false
     */
    public static int getContentTypeCount(List<Request> requests) {
        Set<String> mediaTypes = new HashSet<>();
        for (Request request : requests) {
            if (!CoreUtils.isNullOrEmpty(request.getProtocol().getHttp().getMediaTypes())) {
                mediaTypes.addAll(request.getProtocol().getHttp().getMediaTypes());
            }
        }
        return mediaTypes.size();
    }

    /**
     * If the parameter is not enum type, return the description directly, otherwise append the string of allowed values to the description
     * @param parameter a parameter
     * @param description parameter description
     * @return the description that appends the string of allowed values for enum type parameter
     */
    public static String appendAllowedEnumValuesForEnumType(Parameter parameter, String description) {
        IType type = Mappers.getSchemaMapper().map(parameter.getSchema());
        if (parameter.getSchema() == null || !(type instanceof EnumType)) {
            return description;
        }
        String res = description;
        if (description.endsWith(".")) {
            res += " Allowed values: ";
        } else {
            res += ". Allowed values: ";
        }
        EnumType enumType = (EnumType) type;
        List<ClientEnumValue> choices = enumType.getValues();
        if (choices != null && !choices.isEmpty()) {
            res += choices.stream().map(choice -> {
                if (enumType.getElementType() == ClassType.STRING) {
                    return "\"" + choice.getValue() + "\"";
                } else {
                    return choice.getValue();
                }
            }).collect(Collectors.joining(", "));
        }
        res += ".";
        return res;
    }

    /**
     * Get a list of 1-1 pairs of proxy method parameter and client method parameter.
     *
     * @param clientMethod the client method
     * @return the list of 1-1 pair of proxy method parameter and client method parameter
     */
    public static List<MethodParameter> getParameters(ClientMethod clientMethod) {
        return getParameters(clientMethod, false);
    }

    /**
     * Get a list of 1-1 pairs of proxy method parameter and client method parameter.
     *
     * @param allParameter whether to match non-required proxy method parameter
     * @param clientMethod the client method
     * @return the list of 1-1 pair of proxy method parameter and client method parameter
     */
    public static List<MethodParameter> getParameters(ClientMethod clientMethod, boolean allParameter) {
        List<ProxyMethodParameter> parameters = allParameter ? clientMethod.getProxyMethod().getAllParameters()
                : clientMethod.getProxyMethod().getParameters();
        Map<String, ProxyMethodParameter> proxyMethodParameterByClientParameterName = parameters.stream()
                .collect(Collectors.toMap(p -> CodeNamer.getEscapedReservedClientMethodParameterName(p.getName()), Function.identity()));
        return clientMethod.getMethodInputParameters().stream()
                .filter(p -> !p.isConstant() && !p.isFromClient())
                .map(p -> new MethodParameter(proxyMethodParameterByClientParameterName.get(p.getName()), p))
                .collect(Collectors.toList());
    }

    /**
     * Checks if the parameter is "maxpagesize".
     * <p>
     * It checks if the serialized name is "maxpagesize", or client name is "maxPageSize".
     *
     * @param parameter the parameter
     * @return whether the parameter is "maxpagesize".
     */
    public static boolean isMaxPageSizeParameter(Parameter parameter) {
        return parameter.getProtocol() != null && parameter.getProtocol().getHttp() != null
                // query parameter
                && parameter.getProtocol().getHttp().getIn() == RequestParameterLocation.QUERY
                // serialized name == maxpagesize, or relax a bit, client name == maxPageSize
                && (Objects.equals(parameter.getLanguage().getDefault().getSerializedName(), "maxpagesize") || Objects.equals(SchemaUtil.getJavaName(parameter), "maxPageSize"));
    }

    /**
     * Finds the serialized name of "maxpagesize" parameter, if exists.
     *
     * @param proxyMethod the proxy method
     * @return the serialized name of "maxpagesize" parameter, if exists.
     */
    public static Optional<String> serializedNameOfMaxPageSizeParameter(ProxyMethod proxyMethod) {
        return proxyMethod.getAllParameters().stream()
                .filter(p -> p.getRequestParameterLocation() == RequestParameterLocation.QUERY
                        && (Objects.equals(p.getRequestParameterName(), "maxpagesize") || Objects.equals(p.getName(), "maxPageSize")))
                .map(ProxyMethodParameter::getRequestParameterName)
                .findFirst();
    }

    /**
     *
     * @param request the input request
     * @return true if there is parameter in the request named "contentType", otherwise, return false
     */
    private static boolean hasContentTypeParameter(Request request) {
        for (Parameter parameter : request.getParameters()) {
            if (parameter.getProtocol() != null && parameter.getProtocol().getHttp() != null
                    && RequestParameterLocation.HEADER == parameter.getProtocol().getHttp().getIn()
                    && parameter.getLanguage() != null && parameter.getLanguage().getJava() != null
                    && "Content-Type".equalsIgnoreCase(parameter.getLanguage().getJava().getSerializedName())) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param parameters a list of parameters
     * @return return the index of the BinarySchema parameter, if not found, return -1
     */
    private static int findIndexForContentTypeParam(List<Parameter> parameters) {
        int binarySchemaBodyIndex = -1;
        for (int i = 0; i < parameters.size(); ++i) {
            if (parameters.get(i).getProtocol() != null && parameters.get(i).getProtocol().getHttp() != null
                    && RequestParameterLocation.HEADER == parameters.get(i).getProtocol().getHttp().getIn()
                    && parameters.get(i).getLanguage() != null && parameters.get(i).getLanguage().getJava() != null
                    && "Content-Length".equalsIgnoreCase(parameters.get(i).getLanguage().getJava().getSerializedName())) {
                return i;
            }
            if (parameters.get(i).getSchema() instanceof BinarySchema) {
                binarySchemaBodyIndex = i;
            }
        }
        return binarySchemaBodyIndex;
    }

    /**
     *
     * @param requests a list of requests
     * @return the content type choices of the requests
     */
    private static List<ChoiceValue> getContentTypeChoiceValues(List<Request> requests) {
        List<ChoiceValue> choiceValues = new ArrayList<>();
        for (Request request : requests) {
            if (!CoreUtils.isNullOrEmpty(request.getProtocol().getHttp().getMediaTypes())) {
                for (String mediaType : request.getProtocol().getHttp().getMediaTypes()) {
                    ChoiceValue choiceValue = new ChoiceValue();
                    choiceValue.setValue(mediaType);

                    // TODO: language is never used, is this a mistake or should this be removed?
                    Language language = new Language();
                    language.setName(mediaType.toUpperCase(Locale.ROOT));
                    language.setDescription("Content Type " + mediaType);
                    choiceValues.add(choiceValue);
                }
            }
        }
        return choiceValues;
    }

    public static boolean isContentTypeInRequest(Request request, String contentType) {
        return request.getProtocol() != null && request.getProtocol().getHttp() != null
                && request.getProtocol().getHttp().getMediaTypes() != null
                && request.getProtocol().getHttp().getMediaTypes().contains(contentType);
    }
}
