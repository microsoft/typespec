// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.HttpExceptionType;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodNamer;
import com.azure.core.http.ContentType;
import com.azure.core.http.HttpMethod;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * A method within a Proxy.
 */
public class ProxyMethod {
    /**
     * Get the Content-Type of the request.
     */
    private final String requestContentType;
    /**
     * The value that is returned from this method.
     */
    protected IType returnType;
    /**
     * Get the HTTP method that will be used for this method.
     */
    private final HttpMethod httpMethod;
    /**
     * Get the base URL that will be used for each REST API method.
     */
    private final String baseUrl;
    /**
     * Get the path of this method's request URL.
     */
    private final String urlPath;
    /**
     * Get the status codes that are expected in the response.
     */
    private final List<Integer> responseExpectedStatusCodes;

    private final Map<ClassType, List<Integer>> unexpectedResponseExceptionTypes;
    /**
     * Get the exception type to throw if this method receives and unexpected response status code.
     */
    private final ClassType unexpectedResponseExceptionType;
    /**
     * Get the name of this Rest API method.
     */
    private final String name;

    /**
     * Get the base name of this Rest API method.
     */
    private final String baseName;

    /**
     * Get the parameters that are provided to this method.
     */
    protected List<ProxyMethodParameter> parameters;
    /**
     * Get all parameters defined in swagger to this method.
     */
    protected List<ProxyMethodParameter> allParameters;
    /**
     * Get the description of this method.
     */
    private final String description;
    /**
     * The value of the ReturnValueWireType annotation for this method.
     */
    protected IType returnValueWireType;
    /**
     * The response body type.
     */
    private final IType responseBodyType;
    /**
     * The raw response body type. responseBodyType is set to BinaryData in low-level mode. We need raw type.
     */
    private final IType rawResponseBodyType;
    /**
     * Get whether this method resumes polling of an LRO.
     */
    private final boolean isResumable;
    /**
     * The media-types in response.
     */
    private final Set<String> responseContentTypes;

    private final Map<String, ProxyMethodExample> examples;

    private final List<String> specialHeaders;

    private final String operationId;

    private final boolean isSync;
    private ProxyMethod syncProxy;
    private final boolean customHeaderIgnored;

    protected ProxyMethod(String requestContentType, IType returnType, HttpMethod httpMethod, String baseUrl,
        String urlPath, List<Integer> responseExpectedStatusCodes, ClassType unexpectedResponseExceptionType,
        Map<ClassType, List<Integer>> unexpectedResponseExceptionTypes, String name,
        List<ProxyMethodParameter> parameters, List<ProxyMethodParameter> allParameters, String description,
        IType returnValueWireType, IType responseBodyType, IType rawResponseBodyType, boolean isResumable,
        Set<String> responseContentTypes, String operationId, Map<String, ProxyMethodExample> examples,
        List<String> specialHeaders) {
        this(requestContentType, returnType, httpMethod, baseUrl, urlPath, responseExpectedStatusCodes,
            unexpectedResponseExceptionType, unexpectedResponseExceptionTypes, name, parameters, allParameters,
            description, returnValueWireType, responseBodyType, rawResponseBodyType, isResumable, responseContentTypes,
            operationId, examples, specialHeaders, false, name, false);
    }

    /**
     * Create a new RestAPIMethod with the provided properties.
     *
     * @param requestContentType The Content-Type of the request.
     * @param returnType The type of value that is returned from this method.
     * @param httpMethod The HTTP method that will be used for this method.
     * @param baseUrl The base URL that will be used for each REST API method.
     * @param urlPath The path of this method's request URL.
     * @param responseExpectedStatusCodes The status codes that are expected in the response.
     * @param returnValueWireType The return value's type as it is received from the network (across the wire).
     * @param unexpectedResponseExceptionType The exception type to throw if this method receives and unexpected
     * response status code.
     * @param name The name of this REST API method.
     * @param parameters The parameters that are provided to this method.
     * @param description The description of this method.
     * @param isResumable Whether this method is resumable.
     * @param responseContentTypes The media-types in response.
     * @param operationId the operation ID
     * @param examples the examples for the method.
     * @param specialHeaders list of special headers
     * @param isSync indicates if this proxy method is a synchronous method.
     * @param baseName the base name of the REST method.
     */
    protected ProxyMethod(String requestContentType, IType returnType, HttpMethod httpMethod, String baseUrl,
        String urlPath, List<Integer> responseExpectedStatusCodes, ClassType unexpectedResponseExceptionType,
        Map<ClassType, List<Integer>> unexpectedResponseExceptionTypes, String name,
        List<ProxyMethodParameter> parameters, List<ProxyMethodParameter> allParameters, String description,
        IType returnValueWireType, IType responseBodyType, IType rawResponseBodyType, boolean isResumable,
        Set<String> responseContentTypes, String operationId, Map<String, ProxyMethodExample> examples,
        List<String> specialHeaders, boolean isSync, String baseName, boolean customHeaderIgnored) {
        this.requestContentType = requestContentType;
        this.returnType = returnType;
        this.httpMethod = httpMethod;
        this.baseUrl = baseUrl;
        this.urlPath = urlPath;
        this.responseExpectedStatusCodes = responseExpectedStatusCodes;
        this.unexpectedResponseExceptionType = unexpectedResponseExceptionType;
        this.unexpectedResponseExceptionTypes = unexpectedResponseExceptionTypes;
        this.name = name;
        this.parameters = parameters;
        this.allParameters = allParameters;
        this.description = description;
        this.returnValueWireType = returnValueWireType;
        this.responseBodyType = responseBodyType;
        this.rawResponseBodyType = rawResponseBodyType;
        this.isResumable = isResumable;
        this.responseContentTypes = responseContentTypes;
        this.operationId = operationId;
        this.examples = examples;
        this.specialHeaders = specialHeaders;
        this.isSync = isSync;
        this.baseName = baseName;
        this.customHeaderIgnored = customHeaderIgnored;
    }

    public final String getRequestContentType() {
        return requestContentType;
    }

    public final IType getReturnType() {
        return returnType;
    }

    public final HttpMethod getHttpMethod() {
        return httpMethod;
    }

    public final String getBaseUrl() {
        return baseUrl;
    }

    public final String getUrlPath() {
        return urlPath;
    }

    public final List<Integer> getResponseExpectedStatusCodes() {
        return responseExpectedStatusCodes;
    }

    public final ClassType getUnexpectedResponseExceptionType() {
        return unexpectedResponseExceptionType;
    }

    public final Map<ClassType, List<Integer>> getUnexpectedResponseExceptionTypes() {
        return unexpectedResponseExceptionTypes;
    }

    public final String getName() {
        return name;
    }

    public final String getBaseName() {
        return baseName == null ? name : baseName;
    }

    public final List<ProxyMethodParameter> getParameters() {
        return parameters;
    }

    public final List<ProxyMethodParameter> getAllParameters() {
        return allParameters;
    }

    public final String getDescription() {
        return description;
    }

    public final IType getReturnValueWireType() {
        return returnValueWireType;
    }

    public IType getResponseBodyType() {
        return responseBodyType;
    }

    public IType getRawResponseBodyType() {
        return rawResponseBodyType;
    }

    public final boolean isResumable() {
        return isResumable;
    }

    public final String getPagingAsyncSinglePageMethodName() {
        return MethodNamer.getPagingAsyncSinglePageMethodName(getName());
    }

    public final String getPagingSinglePageMethodName() {
        return MethodNamer.getPagingSinglePageMethodName(getBaseName());
    }

    public final String getSimpleAsyncMethodName() {
        return MethodNamer.getSimpleAsyncMethodName(getName());
    }

    public final String getSimpleAsyncRestResponseMethodName() {
        return MethodNamer.getSimpleAsyncRestResponseMethodName(getName());
    }

    public final String getSimpleRestResponseMethodName() {
        return MethodNamer.getSimpleRestResponseMethodName(getBaseName());
    }

    public final Set<String> getResponseContentTypes() {
        return responseContentTypes;
    }

    public String getOperationId() {
        return operationId;
    }

    public Map<String, ProxyMethodExample> getExamples() {
        return examples;
    }

    public List<String> getSpecialHeaders() {
        return specialHeaders;
    }

    public boolean isSync() {
        return isSync;
    }

    public boolean isCustomHeaderIgnored() {
        return customHeaderIgnored;
    }

    public ProxyMethod toSync() {
        if (isSync) {
            return this;
        }

        if (this.syncProxy != null) {
            return syncProxy;
        }

        List<ProxyMethodParameter> syncParams = this.getParameters()
            .stream()
            .map(this::mapToSyncParam)
            .collect(Collectors.toList());

        List<ProxyMethodParameter> allSyncParams = this.getAllParameters()
            .stream()
            .map(this::mapToSyncParam)
            .collect(Collectors.toList());

        this.syncProxy = new ProxyMethod.Builder().parameters(syncParams)
            .httpMethod(this.getHttpMethod())
            .name(this.getName() + "Sync")
            .baseName(this.getName())
            .description(this.getDescription())
            .baseURL(this.getBaseUrl())
            .operationId(this.getOperationId())
            .isResumable(this.isResumable())
            .examples(this.getExamples())
            .rawResponseBodyType(mapToSyncType(this.getRawResponseBodyType()))
            .requestContentType(this.getRequestContentType())
            .responseBodyType(mapToSyncType(this.getResponseBodyType()))
            .returnType(mapToSyncType(this.getReturnType()))
            .returnValueWireType(mapToSyncType(this.getReturnValueWireType()))
            .urlPath(this.getUrlPath())
            .specialHeaders(this.getSpecialHeaders())
            .unexpectedResponseExceptionType(this.getUnexpectedResponseExceptionType())
            .unexpectedResponseExceptionTypes(this.getUnexpectedResponseExceptionTypes())
            .allParameters(allSyncParams)
            .responseContentTypes(this.getResponseContentTypes())
            .responseExpectedStatusCodes(this.getResponseExpectedStatusCodes())
            .isSync(true)
            .customHeaderIgnored(this.customHeaderIgnored)
            .build();
        return this.syncProxy;
    }

    private ProxyMethodParameter mapToSyncParam(ProxyMethodParameter param) {
        return param.newBuilder()
            .clientType(mapToSyncType(param.getClientType()))
            .rawType(mapToSyncType(param.getRawType()))
            .wireType(mapToSyncType(param.getWireType()))
            .build();
    }

    private IType mapToSyncType(IType type) {
        if (type == GenericType.FLUX_BYTE_BUFFER) {
            return ClassType.BINARY_DATA;
        }

        if (type instanceof GenericType) {
            GenericType genericType = (GenericType) type;
            if (genericType.getName().equals("Mono")) {
                if (genericType.getTypeArguments()[0] instanceof GenericType) {
                    GenericType innerGenericType = (GenericType) genericType.getTypeArguments()[0];
                    if (innerGenericType.getName().equals("ResponseBase")
                        && innerGenericType.getTypeArguments()[1] == GenericType.FLUX_BYTE_BUFFER) {
                        return GenericType.RestResponse(innerGenericType.getTypeArguments()[0],
                            JavaSettings.getInstance().isInputStreamForBinary()
                                ? ClassType.INPUT_STREAM
                                : ClassType.BINARY_DATA);
                    }
                }

                if (genericType.getTypeArguments()[0] == ClassType.STREAM_RESPONSE) {
                    return JavaSettings.getInstance().isInputStreamForBinary() ? GenericType.Response(
                        ClassType.INPUT_STREAM) : GenericType.Response(ClassType.BINARY_DATA);
                }
                return genericType.getTypeArguments()[0];
            }
            if (genericType.getName().equals("PagedFlux")) {
                IType pageType = genericType.getTypeArguments()[0];
                return GenericType.PagedIterable(pageType);
            }
            if (genericType.getName().equals("PollerFlux")) {
                IType[] typeArguments = genericType.getTypeArguments();
                IType pollType = typeArguments[0];
                IType resultType = typeArguments[1];
                return GenericType.SyncPoller(pollType, resultType);
            }
        }
        return type;
    }

    /**
     * Add this property's imports to the provided set of imports.
     *
     * @param imports The set of imports to add to.
     * @param includeImplementationImports Whether to include imports that are only necessary for method
     * implementations.
     */
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports, JavaSettings settings) {
        Annotation.HTTP_REQUEST_INFORMATION.addImportsTo(imports);
        Annotation.UNEXPECTED_RESPONSE_EXCEPTION_INFORMATION.addImportsTo(imports);
        if (includeImplementationImports) {
            if (getUnexpectedResponseExceptionType() != null) {
                Annotation.UNEXPECTED_RESPONSE_EXCEPTION_TYPE.addImportsTo(imports);
                getUnexpectedResponseExceptionType().addImportsTo(imports, includeImplementationImports);
            }
            if (getUnexpectedResponseExceptionTypes() != null) {
                Annotation.UNEXPECTED_RESPONSE_EXCEPTION_TYPE.addImportsTo(imports);
                getUnexpectedResponseExceptionTypes().keySet()
                    .forEach(e -> e.addImportsTo(imports, includeImplementationImports));
            }
            if (isResumable()) {
                imports.add("com.azure.core.annotation.ResumeOperation");
            }
            imports.add(String.format("%1$s.annotation.%2$s", ExternalPackage.CORE.getPackageName(),
                CodeNamer.toPascalCase(getHttpMethod().toString().toLowerCase())));

            if (settings.isFluent()) {
                Annotation.HEADERS.addImportsTo(imports);
            }
            Annotation.EXPECTED_RESPONSE.addImportsTo(imports);

            if (getReturnValueWireType() != null) {
                Annotation.RETURN_VALUE_WIRE_TYPE.addImportsTo(imports);
                returnValueWireType.addImportsTo(imports, includeImplementationImports);
            }

            returnType.addImportsTo(imports, includeImplementationImports);

            if (ContentType.APPLICATION_X_WWW_FORM_URLENCODED.equals(this.requestContentType)) {
                Annotation.FORM_PARAM.addImportsTo(imports);
            }

            for (ProxyMethodParameter parameter : parameters) {
                parameter.addImportsTo(imports, includeImplementationImports, settings);
            }
        }
    }

    public HttpExceptionType getHttpExceptionType(ClassType classType) {
        if (classType == null) {
            return null;
        }

        if (Objects.equals(ClassType.CLIENT_AUTHENTICATION_EXCEPTION, classType)) {
            return HttpExceptionType.CLIENT_AUTHENTICATION;
        } else if (Objects.equals(ClassType.RESOURCE_EXISTS_EXCEPTION, classType)) {
            return HttpExceptionType.RESOURCE_EXISTS;
        } else if (Objects.equals(ClassType.RESOURCE_NOT_FOUND_EXCEPTION, classType)) {
            return HttpExceptionType.RESOURCE_NOT_FOUND;
        } else if (Objects.equals(ClassType.RESOURCE_MODIFIED_EXCEPTION, classType)) {
            return HttpExceptionType.RESOURCE_MODIFIED;
        }

        return null;
    }

    public static class Builder {
        protected String requestContentType;
        protected IType returnType;
        protected HttpMethod httpMethod;
        protected String baseUrl;
        protected String urlPath;
        protected List<Integer> responseExpectedStatusCodes;
        protected ClassType unexpectedResponseExceptionType;
        protected Map<ClassType, List<Integer>> unexpectedResponseExceptionTypes;
        protected String name;
        protected List<ProxyMethodParameter> parameters;
        protected List<ProxyMethodParameter> allParameters;
        protected String description;
        protected IType returnValueWireType;
        protected IType responseBodyType;
        protected IType rawResponseBodyType;
        protected boolean isResumable;
        protected Set<String> responseContentTypes;
        protected Map<String, ProxyMethodExample> examples;
        protected String operationId;
        protected List<String> specialHeaders;
        protected boolean isSync;
        protected String baseName;
        protected boolean customHeaderIgnored;

        /*
         * Sets the Content-Type of the request.
         * @param requestContentType the Content-Type of the request
         * @return the Builder itself
         */
        public Builder requestContentType(String requestContentType) {
            this.requestContentType = requestContentType;
            return this;
        }

        /**
         * Sets the value that is returned from this method.
         *
         * @param returnType the value that is returned from this method
         * @return the Builder itself
         */
        public Builder returnType(IType returnType) {
            this.returnType = returnType;
            return this;
        }

        /**
         * Sets the HTTP method that will be used for this method.
         *
         * @param httpMethod the HTTP method that will be used for this method
         * @return the Builder itself
         */
        public Builder httpMethod(HttpMethod httpMethod) {
            this.httpMethod = httpMethod;
            return this;
        }

        /**
         * Sets the base URL that will be used for each REST API method.
         *
         * @param baseUrl the base URL that will be used for each REST API method
         * @return the Builder itself
         */
        public Builder baseURL(String baseUrl) {
            this.baseUrl = baseUrl;
            return this;
        }

        /**
         * Sets the path of this method's request URL.
         *
         * @param urlPath the path of this method's request URL
         * @return the Builder itself
         */
        public Builder urlPath(String urlPath) {
            this.urlPath = urlPath;
            return this;
        }

        /**
         * Sets the status codes that are expected in the response.
         *
         * @param responseExpectedStatusCodes the status codes that are expected in the response
         * @return the Builder itself
         */
        public Builder responseExpectedStatusCodes(List<Integer> responseExpectedStatusCodes) {
            this.responseExpectedStatusCodes = responseExpectedStatusCodes;
            return this;
        }

        /**
         * Sets the exception type to throw if this method receives any unexpected response status code.
         *
         * @param unexpectedResponseExceptionType the exception type to throw if this method receives any unexpected
         * response status code
         * @return the Builder itself
         */
        public Builder unexpectedResponseExceptionType(ClassType unexpectedResponseExceptionType) {
            this.unexpectedResponseExceptionType = unexpectedResponseExceptionType;
            return this;
        }

        /**
         * Sets the exception type to throw if this method receives certain unexpected response status code.
         *
         * @param unexpectedResponseExceptionTypes the exception type to throw if this method receives certain
         * unexpected response status code
         * @return the Builder itself
         */
        public Builder unexpectedResponseExceptionTypes(
            Map<ClassType, List<Integer>> unexpectedResponseExceptionTypes) {
            this.unexpectedResponseExceptionTypes = unexpectedResponseExceptionTypes;
            return this;
        }

        /**
         * Sets the name of this Rest API method.
         *
         * @param name the name of this Rest API method
         * @return the Builder itself
         */
        public Builder name(String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the base name of this Rest API method.
         *
         * @param baseName the name of this Rest API method
         * @return the Builder itself
         */
        public Builder baseName(String baseName) {
            this.baseName = baseName;
            return this;
        }

        /**
         * Sets the parameters that are provided to this method.
         *
         * @param parameters the parameters that are provided to this method
         * @return the Builder itself
         */
        public Builder parameters(List<ProxyMethodParameter> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets all parameters defined in swagger to this method.
         *
         * @param allParameters the parameters that are provided to this method
         * @return the Builder itself
         */
        public Builder allParameters(List<ProxyMethodParameter> allParameters) {
            this.allParameters = allParameters;
            return this;
        }

        /**
         * Sets the description of this method.
         *
         * @param description the description of this method
         * @return the Builder itself
         */
        public Builder description(String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of the ReturnValueWireType annotation for this method.
         *
         * @param returnValueWireType the value of the ReturnValueWireType annotation for this method
         * @return the Builder itself
         */
        public Builder returnValueWireType(IType returnValueWireType) {
            this.returnValueWireType = returnValueWireType;
            return this;
        }

        /**
         * Sets the response body type.
         *
         * @param responseBodyType the response body type
         * @return the Builder itself
         */
        public Builder responseBodyType(IType responseBodyType) {
            this.responseBodyType = responseBodyType;
            return this;
        }

        /**
         * Sets the raw response body type.
         *
         * @param rawResponseBodyType the response body type
         * @return the Builder itself
         */
        public Builder rawResponseBodyType(IType rawResponseBodyType) {
            this.rawResponseBodyType = rawResponseBodyType;
            return this;
        }

        /**
         * Sets whether this method resumes polling of an LRO.
         *
         * @param isResumable whether this method resumes polling of an LRO
         * @return the Builder itself
         */
        public Builder isResumable(boolean isResumable) {
            this.isResumable = isResumable;
            return this;
        }

        /**
         * Sets the media-types in response.
         *
         * @param responseContentTypes the media-types in response
         * @return the Builder itself
         */
        public Builder responseContentTypes(Set<String> responseContentTypes) {
            this.responseContentTypes = responseContentTypes;
            return this;
        }

        /**
         * Sets the examples for the method.
         *
         * @param examples the examples
         * @return the Builder itself
         */
        public Builder examples(Map<String, ProxyMethodExample> examples) {
            this.examples = examples;
            return this;
        }

        /**
         * Sets the operation ID for reference.
         *
         * @param operationId the operation ID
         * @return the Builder itself
         */
        public Builder operationId(String operationId) {
            this.operationId = operationId;
            return this;
        }

        /**
         * Sets the special headers
         *
         * @param specialHeaders the special headers
         * @return the Builder
         */
        public Builder specialHeaders(List<String> specialHeaders) {
            this.specialHeaders = specialHeaders;
            return this;
        }

        public Builder isSync(boolean isSync) {
            this.isSync = isSync;
            return this;
        }

        public Builder customHeaderIgnored(boolean customHeaderIgnored) {
            this.customHeaderIgnored = customHeaderIgnored;
            return this;
        }

        /**
         * @return an immutable ProxyMethod instance with the configurations on this builder.
         */
        public ProxyMethod build() {
            return new ProxyMethod(requestContentType, returnType, httpMethod, baseUrl, urlPath,
                responseExpectedStatusCodes, unexpectedResponseExceptionType, unexpectedResponseExceptionTypes, name,
                parameters, allParameters, description, returnValueWireType, responseBodyType, rawResponseBodyType,
                isResumable, responseContentTypes, operationId, examples, specialHeaders, isSync, baseName,
                customHeaderIgnored);
        }
    }
}
