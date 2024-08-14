// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.util.serializer.CollectionFormat;

import java.util.Set;

/**
 * A parameter for a ProxyMethod.
 */
public class ProxyMethodParameter extends MethodParameter {

    public static final ProxyMethodParameter REQUEST_OPTIONS_PARAMETER = new ProxyMethodParameter.Builder()
            .description("The options to configure the HTTP request before HTTP client sends it.")
            .wireType(ClassType.REQUEST_OPTIONS)
            .clientType(ClassType.REQUEST_OPTIONS)
            .name("requestOptions")
            .requestParameterLocation(RequestParameterLocation.NONE)
            .requestParameterName("requestOptions")
            .alreadyEncoded(true)
            .constant(false)
            .required(false)
            .nullable(false)
            .fromClient(false)
            .parameterReference("requestOptions")
            .origin(ParameterSynthesizedOrigin.REQUEST_OPTIONS)
            .build();

    /**
     * Get the name of this parameter when it is serialized.
     */
    private final String requestParameterName;
    /**
     * Whether the value of this parameter will already be encoded (and can therefore be skipped when other
     * parameters' values are being encoded.
     */
    private final boolean alreadyEncoded;
    /**
     * Whether this parameter is nullable.
     */
    private final boolean isNullable;
    /**
     * The x-ms-header-collection-prefix extension value.
     */
    private final String headerCollectionPrefix;
    /**
     * The reference to this parameter from a caller.
     */
    private final String parameterReference;
    /**
     * The collection format if the parameter is a list type.
     */
    private final CollectionFormat collectionFormat;
    /**
     * The explode if the parameter is a list type.
     */
    private final boolean explode;

    private final ParameterSynthesizedOrigin origin;

    /**
     * Create a new RestAPIParameter based on the provided properties.
     *
     * @param description The description of this parameter.
     * @param rawType The raw type of this parameter. Result of SchemaMapper.
     * @param wireType The type of this parameter.
     * @param clientType The type of this parameter users interact with.
     * @param name The name of this parameter when it is used as a variable.
     * @param requestParameterLocation The location within the REST API method's HttpRequest where this parameter will
     * be added.
     * @param requestParameterName The name of the HttpRequest's parameter to substitute with this parameter's value.
     * @param alreadyEncoded Whether the value of this parameter will already be encoded (and can therefore be
     * skipped when other parameters' values are being encoded.
     * @param isConstant Whether this parameter is a constant value.
     * @param isRequired Whether this parameter is required.
     * @param isNullable Whether this parameter is nullable.
     * @param fromClient Whether this parameter's value comes from a ServiceClientProperty.
     * @param headerCollectionPrefix The x-ms-header-collection-prefix extension value.
     * @param parameterReference The reference to this parameter from a caller.
     * @param defaultValue The default value of the parameter.
     * @param collectionFormat The collection format if the parameter is a list type.
     * @param explode Whether arrays and objects should generate separate parameters for each array item or object
     * property.
     */
    protected ProxyMethodParameter(String description, IType rawType, IType wireType, IType clientType, String name,
        RequestParameterLocation requestParameterLocation, String requestParameterName, boolean alreadyEncoded,
        boolean isConstant, boolean isRequired, boolean isNullable, boolean fromClient, String headerCollectionPrefix,
        String parameterReference, String defaultValue, CollectionFormat collectionFormat, boolean explode,
        ParameterSynthesizedOrigin origin) {
        super(description, wireType, rawType, clientType, name, requestParameterLocation, isConstant, isRequired,
            fromClient, defaultValue);
        this.requestParameterName = requestParameterName;
        this.alreadyEncoded = alreadyEncoded;
        this.isNullable = isNullable;
        this.headerCollectionPrefix = headerCollectionPrefix;
        this.parameterReference = parameterReference;
        this.collectionFormat = collectionFormat;
        this.explode = explode;
        this.origin = origin;
    }

    public final String getRequestParameterName() {
        return requestParameterName;
    }

    public final boolean getAlreadyEncoded() {
        return alreadyEncoded;
    }

    public final boolean isNullable() {
        return isNullable;
    }

    public final String getHeaderCollectionPrefix() {
        return headerCollectionPrefix;
    }

    public final String getParameterReference() {
        return parameterReference;
    }

    public final String getParameterReferenceConverted() {
        return String.format("%1$sConverted", CodeNamer.toCamelCase(CodeNamer.removeInvalidCharacters(getParameterReference())));
    }

    public final CollectionFormat getCollectionFormat() {
        return collectionFormat;
    }

    public final boolean getExplode() {
        return explode;
    }

    public ParameterSynthesizedOrigin getOrigin() {
        return origin;
    }

    public final String convertFromClientType(String source, String target, boolean alwaysNull) {
        return convertFromClientType(source, target, alwaysNull, false);
    }

    public final String convertFromClientType(String source, String target) {
        return convertFromClientType(source, target, false, false);
    }

    public final String convertFromClientType(String source, String target, boolean alwaysNull, boolean alwaysNonNull) {
        if (getClientType() == getWireType()) {
            return String.format("%1$s %2$s = %3$s;", getWireType(), target, source);
        }
        if (alwaysNull) {
            return String.format("%1$s %2$s = null;", getWireType(), target);
        }
        if (isRequired() || alwaysNonNull) {
            return String.format("%1$s %2$s = %3$s;", getWireType(), target, getWireType().convertFromClientType(source));
        } else {
            return String.format("%1$s %2$s = %3$s == null ? null : %4$s;", getWireType(), target, source, getWireType().convertFromClientType(source));
        }
    }

    /**
     * Add this property's imports to the provided set of imports.
     *
     * @param imports The set of imports to add to.
     * @param includeImplementationImports Whether to include imports that are only necessary for method
     * implementations.
     */
    public void addImportsTo(Set<String> imports, boolean includeImplementationImports, JavaSettings settings) {
        if (getRequestParameterLocation() != RequestParameterLocation.NONE/* && getRequestParameterLocation() != RequestParameterLocation.FormData*/) {
            if (settings.isBranded()) {
                imports.add(String.format("%1$s.annotation.%2$sParam",
                        ExternalPackage.CORE.getPackageName(),
                        CodeNamer.toPascalCase(getRequestParameterLocation().toString())));
            } else {
                imports.add(String.format("%1$s.http.annotation.%2$sParam",
                        ExternalPackage.CORE.getPackageName(),
                        CodeNamer.toPascalCase(getRequestParameterLocation().toString())));
            }
        }
        if (getRequestParameterLocation() != RequestParameterLocation.BODY) {
            if (getClientType() == ArrayType.BYTE_ARRAY) {
                imports.add("com.azure.core.util.Base64Util");
            } else if (getClientType() instanceof ListType && !getExplode()) {
                imports.add("com.azure.core.util.serializer.CollectionFormat");
                imports.add("com.azure.core.util.serializer.JacksonAdapter");
            } else if (getClientType() instanceof ListType && getExplode()) {
                imports.add("java.util.stream.Collectors");
            }
        }
//        if (getRequestParameterLocation() == RequestParameterLocation.FormData) {
//            imports.add(String.format("com.azure.core.annotation.FormParam"));
//        }

        if (!settings.isBranded()) {
            imports.add("io.clientcore.core.http.models.HttpMethod");
        }

        getWireType().addImportsTo(imports, includeImplementationImports);
    }

    /**
     * Creates a builder that is initialized with all the builder properties set to current values of this instance.
     *
     * @return A new builder instance initialized with properties values of this instance.
     */
    public ProxyMethodParameter.Builder newBuilder() {
        return new Builder(this);
    }

    public static class Builder {
        protected String description;
        protected IType rawType;
        protected IType wireType;
        protected IType clientType;
        protected String name;
        protected RequestParameterLocation requestParameterLocation = RequestParameterLocation.values()[0];
        protected String requestParameterName;
        protected boolean alreadyEncoded = false;
        protected boolean isConstant = false;
        protected boolean isRequired;
        protected boolean isNullable;
        protected boolean fromClient;
        protected String headerCollectionPrefix;
        protected String parameterReference;
        protected String defaultValue;
        protected CollectionFormat collectionFormat;
        protected boolean explode;
        protected ParameterSynthesizedOrigin origin;

        /**
         * Sets the description of this parameter.
         *
         * @param description the description of this parameter
         * @return the Builder itself
         */
        public Builder description(String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the raw type of this parameter. Result of SchemaMapper.
         *
         * @param rawType the raw type of this parameter
         * @return the Builder itself
         */
        public Builder rawType(IType rawType) {
            this.rawType = rawType;
            return this;
        }

        /**
         * Sets the type of this parameter.
         *
         * @param wireType the type of this parameter
         * @return the Builder itself
         */
        public Builder wireType(IType wireType) {
            this.wireType = wireType;
            return this;
        }

        /**
         * Sets the type of this parameter.
         *
         * @param clientType the type of this parameter
         * @return the Builder itself
         */
        public Builder clientType(IType clientType) {
            this.clientType = clientType;
            return this;
        }

        /**
         * Sets the name of this parameter when it is used as a variable.
         *
         * @param name the name of this parameter when it is used as a variable
         * @return the Builder itself
         */
        public Builder name(String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the location within the REST API method's URL where this parameter will be added.
         *
         * @param requestParameterLocation the location within the REST API method's URL where this parameter will be
         * added
         * @return the Builder itself
         */
        public Builder requestParameterLocation(RequestParameterLocation requestParameterLocation) {
            this.requestParameterLocation = requestParameterLocation;
            return this;
        }

        /**
         * Sets the name of this parameter when it is serialized.
         *
         * @param requestParameterName the name of this parameter when it is serialized
         * @return the Builder itself
         */
        public Builder requestParameterName(String requestParameterName) {
            this.requestParameterName = requestParameterName;
            return this;
        }

        /**
         * Sets whether or not the value of this parameter will already be encoded (and can therefore be skipped when
         * other parameters' values are being encoded.
         *
         * @param alreadyEncoded whether or not the value of this parameter will already be encoded
         * @return the Builder itself
         */
        public Builder alreadyEncoded(boolean alreadyEncoded) {
            this.alreadyEncoded = alreadyEncoded;
            return this;
        }

        /**
         * Sets whether or not this parameter is a constant value.
         *
         * @param isConstant whether or not this parameter is a constant value
         * @return the Builder itself
         */
        public Builder constant(boolean isConstant) {
            this.isConstant = isConstant;
            return this;
        }

        /**
         * Sets whether or not this parameter is required.
         *
         * @param isRequired whether or not this parameter is required
         * @return the Builder itself
         */
        public Builder required(boolean isRequired) {
            this.isRequired = isRequired;
            return this;
        }

        /**
         * Sets whether or not this parameter is nullable.
         *
         * @param isNullable whether or not this parameter is nullable
         * @return the Builder itself
         */
        public Builder nullable(boolean isNullable) {
            this.isNullable = isNullable;
            return this;
        }

        /**
         * Sets whether or not this parameter's value comes from a ServiceClientProperty.
         *
         * @param fromClient whether or not this parameter's value comes from a ServiceClientProperty
         * @return the Builder itself
         */
        public Builder fromClient(boolean fromClient) {
            this.fromClient = fromClient;
            return this;
        }

        /**
         * Sets the x-ms-header-collection-prefix extension value.
         *
         * @param headerCollectionPrefix the x-ms-header-collection-prefix extension value
         * @return the Builder itself
         */
        public Builder headerCollectionPrefix(String headerCollectionPrefix) {
            this.headerCollectionPrefix = headerCollectionPrefix;
            return this;
        }

        /**
         * Sets the reference to this parameter from a caller.
         *
         * @param parameterReference the reference to this parameter from a caller
         * @return the Builder itself
         */
        public Builder parameterReference(String parameterReference) {
            this.parameterReference = parameterReference;
            return this;
        }

        /**
         * Sets the description of this parameter.
         *
         * @param defaultValue the description of this parameter
         * @return the Builder itself
         */
        public Builder defaultValue(String defaultValue) {
            this.defaultValue = defaultValue;
            return this;
        }

        /**
         * Sets the collection format if the parameter is a list type.
         *
         * @param collectionFormat the collection format if the parameter is a list type
         * @return the Builder itself
         */
        public Builder collectionFormat(CollectionFormat collectionFormat) {
            this.collectionFormat = collectionFormat;
            return this;
        }

        /**
         * Sets the explode if the parameter is a list type.
         *
         * @param explode the explode if the parameter is a list type
         * @return the Builder itself
         */
        public Builder explode(boolean explode) {
            this.explode = explode;
            return this;
        }

        /**
         * Sets origin of the parameter.
         *
         * @param origin the origin of the parameter.
         * @return the Builder itself
         */
        public Builder origin(ParameterSynthesizedOrigin origin) {
            this.origin = origin;
            return this;
        }

        /**
         * Creates a new instance of Builder.
         */
        public Builder() {
        }

        private Builder(ProxyMethodParameter parameter) {
            this.description = parameter.getDescription();
            this.rawType = parameter.getRawType();
            this.wireType = parameter.getWireType();
            this.clientType = parameter.getClientType();
            this.name = parameter.getName();
            this.requestParameterLocation = parameter.getRequestParameterLocation();
            this.requestParameterName = parameter.getRequestParameterName();
            this.alreadyEncoded = parameter.getAlreadyEncoded();
            this.isConstant = parameter.isConstant();
            this.isRequired = parameter.isRequired();
            this.isNullable = parameter.isNullable();
            this.fromClient = parameter.isFromClient();
            this.headerCollectionPrefix = parameter.getHeaderCollectionPrefix();
            this.parameterReference = parameter.getParameterReference();
            this.defaultValue = parameter.getDefaultValue();
            this.collectionFormat = parameter.getCollectionFormat();
            this.explode = parameter.getExplode();
            this.origin = parameter.getOrigin();
        }

        public ProxyMethodParameter build() {
            return new ProxyMethodParameter(description,
                rawType,
                wireType,
                clientType,
                name,
                requestParameterLocation,
                requestParameterName,
                alreadyEncoded,
                isConstant,
                isRequired,
                isNullable,
                fromClient,
                headerCollectionPrefix,
                parameterReference,
                defaultValue,
                collectionFormat,
                explode,
                origin);
        }
    }
}
