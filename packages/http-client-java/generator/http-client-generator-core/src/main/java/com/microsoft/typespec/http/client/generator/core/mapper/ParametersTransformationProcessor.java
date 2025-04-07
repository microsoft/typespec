// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ConstantSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Request;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterMapping;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterTransformations;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/**
 * A type to process and collect the details of transformations applied to operation parameters.
 */
public final class ParametersTransformationProcessor {
    private final boolean isProtocolMethod;
    private final List<ParametersTuple> parameters = new ArrayList<>();

    ParametersTransformationProcessor(boolean isProtocolMethod) {
        this.isProtocolMethod = isProtocolMethod;
    }

    /**
     * Adds a parameter to be processed later by the {@link #process(Request)} method.
     *
     * @param clientMethodParameter the client method parameter.
     * @param parameter the source parameter from which {@code clientMethodParameter} was derived.
     */
    void addParameter(ClientMethodParameter clientMethodParameter, Parameter parameter) {
        if (isProtocolMethod || parameter.getSchema() instanceof ConstantSchema) {
            return;
        }
        if (parameter.getGroupedBy() == null && parameter.getOriginalParameter() == null) {
            return;
        }
        parameters.add(new ParametersTuple(clientMethodParameter, parameter));
    }

    ParameterTransformations process(Request request) {
        final List<Transformation> transformations = new ArrayList<>(this.parameters.size());

        for (ParametersTuple t : parameters) {
            final ClientMethodParameter clientMethodParameter = t.clientMethodParameter;
            final Parameter parameter = t.parameter;
            final InMapping in = processInputMapping(clientMethodParameter, parameter);
            final OutMapping out = processOutputMapping(clientMethodParameter, parameter);
            final ParameterMapping mapping = new ParameterMapping(in.parameter, in.parameterProperty, out.parameter,
                out.parameterProperty, out.parameterPropertyName);
            Transformation.createOrUpdate(transformations, out.parameter, mapping);
        }

        for (Parameter parameter : flattenedParameters(request)) {
            final ClientMethodParameter outParameter = Mappers.getClientParameterMapper().map(parameter);
            Transformation.create(transformations, outParameter);
        }

        final List<ParameterTransformation> list
            = transformations.stream().map(Transformation::toImmutable).collect(Collectors.toList());
        return new ParameterTransformations(list);
    }

    private static InMapping processInputMapping(ClientMethodParameter clientMethodParameter, Parameter parameter) {
        if (parameter.getGroupedBy() != null) {
            final ClientMethodParameter inParameter;
            final ClientModelProperty inParameterProperty;
            // Consider the following example spec:
            //
            // import "@azure-tools/typespec-azure-core";
            // import "@azure-tools/typespec-client-generator-core";
            // import "@typespec/http";
            // import "@typespec/rest";
            // import "@typespec/versioning";
            //
            // using Azure.ClientGenerator.Core;
            // using TypeSpec.Http;
            // using TypeSpec.Versioning;
            //
            // @service(#{ title: "Contoso" })
            // @versioned(Versions)
            // namespace Contoso {
            // enum Versions { v1: "v1" }
            // model UserOptions { @query userid?: string; @query zipcode?: string; }
            // model User { name: string; phone: string; }
            //
            // @get
            // @route("/get-user")
            // op getUser(...UserOptions): User;
            // }
            //
            // // customization in client.tsp
            // @useDependency(Contoso.Versions.v1)
            // namespace Customization {
            // op getUserCustomization(options?: Contoso.UserOptions): Contoso.User;
            // @@override(Contoso.getUser, Customization.getUserCustomization);
            // }
            //
            // The service query parameters 'userid' and 'zipcode' are grouped by 'UserOptions'.
            // The SDK Method takes an object argument with model type 'UserOptions', composing two properties.
            //
            // public User getUser(UserOptions options) { ... }
            //
            // The 'parameter' here is one of the parameters (e.g., 'userid') belongs to such a group and
            // 'parameter.getGroupedBy()' provide access to the group (e.g., 'UserOptions') it belongs to.
            //
            // i.e., This method inspect and process "INPUT" (group-by) model that SDK Method takes.
            //
            inParameter = Mappers.getClientParameterMapper().map(parameter.getGroupedBy(), false);
            final ObjectSchema groupBySchema = (ObjectSchema) parameter.getGroupedBy().getSchema();
            final ClientModel groupByModel = Mappers.getModelMapper().map(groupBySchema);
            //
            // Finds the property in the groupByModel corresponding to the 'parameter'.
            //
            // The property lookup happens using the parameter name and, as a fallback, the serialized-name. The reason
            // for using the serialized-name as a fallback is, for parameter of reserved name, on parameter, the name
            // would be renamed to "#Parameter", but on property it would be renamed to "#Property". Transformer.java
            // have handled above case, but we don't know if there is any other case.
            //
            final String name = parameter.getLanguage().getJava().getName();
            final Optional<ClientModelProperty> opt0 = findProperty(groupByModel, p -> name.equals(p.getName()));
            if (opt0.isPresent()) {
                inParameterProperty = opt0.get();
            } else {
                final String serializedName = parameter.getLanguage().getDefault().getSerializedName();
                final Optional<ClientModelProperty> opt1
                    = findProperty(groupByModel, p -> serializedName.equals(p.getSerializedName()));
                assert opt1.isPresent();
                inParameterProperty = opt1.get();
            }
            return new InMapping(inParameter, inParameterProperty);
        }
        final ClientMethodParameter inParameter = clientMethodParameter;
        return new InMapping(inParameter, null);
    }

    private static OutMapping processOutputMapping(ClientMethodParameter clientMethodParameter, Parameter parameter) {
        if (parameter.getOriginalParameter() != null) {
            final ClientMethodParameter outParameter;
            final ClientModelProperty outParameterProperty;
            final String outParameterPropertyName;
            // Consider the following example spec:
            //
            // op add(...User): void
            // model User {
            // name: string;
            // age: uint8;
            // }
            //
            // The spread operator (...) says the SDK-Method should fatten 'User' model properties into method
            // arguments,
            //
            // public void add(String name, int age) { ... }
            //
            // but, the service call requires the wire representation to be adhered to the original 'User' model.
            //
            // The 'parameter' is one of the SDK-Method parameters (e.g., 'name') that is derived from the original
            // parameter, and 'parameter.getOriginalParameter()' provides access to the original out parameter, 'User'.
            //
            // i.e., This method inspect and process "OUTPUT" (original-parameter) model send to the service.
            //
            outParameter = Mappers.getClientParameterMapper().map(parameter.getOriginalParameter());
            outParameterProperty = Mappers.getModelPropertyMapper().map(parameter.getTargetProperty());
            outParameterPropertyName = parameter.getTargetProperty().getLanguage().getJava().getName();
            return new OutMapping(outParameter, outParameterProperty, outParameterPropertyName);
        }
        final ClientMethodParameter outParameter = clientMethodParameter;
        return new OutMapping(outParameter, null, null);
    }

    private List<Parameter> flattenedParameters(Request request) {
        // build a list of original-parameters those were already been accounted for by process(..) while
        // processing 'this.parameters'.
        final List<Parameter> originalParameters = parameters.stream()
            .map(t -> t.parameter)
            .map(Parameter::getOriginalParameter)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        // create and return list of flattened parameters in Request::parameters those were not processed by
        // process(..).
        // These are the flattened model parameters with all its properties read-only.
        return request.getParameters()
            .stream()
            .filter(p -> p.isFlattened() && p.getProtocol() != null && p.getProtocol().getHttp() != null)
            .filter(p -> !originalParameters.contains(p))
            .collect(Collectors.toList());
    }

    /**
     * Finds a property in the model that matches the given predicate.
     *
     * @param model the model to search in.
     * @param predicate the predicate to match the property against.
     * @return an optional containing the property if found, or empty if not found.
     */
    private static Optional<ClientModelProperty> findProperty(ClientModel model,
        Predicate<ClientModelProperty> predicate) {
        return model.getProperties().stream().filter(predicate).findFirst();
    }

    /**
     * A tuple of parameters to be processed as a unit by the {@link #process(Request)} method.
     */
    private static final class ParametersTuple {
        final ClientMethodParameter clientMethodParameter;
        final Parameter parameter;

        ParametersTuple(ClientMethodParameter clientMethodParameter, Parameter parameter) {
            this.clientMethodParameter = clientMethodParameter;
            this.parameter = parameter;
        }
    }

    /**
     * A private mutable carrier type to hold transformation details during processing.
     */
    private static final class Transformation {
        private final ClientMethodParameter key;
        private final List<ParameterMapping> mappings = new ArrayList<>();

        private Transformation(ClientMethodParameter key) {
            this.key = Objects.requireNonNull(key, "'key' cannot be null");
        }

        /**
         * Checks if this transformation represents the transformation mappings for the given key parameter.
         *
         * @param key the key parameter to check.
         * @return true if this transformation matches the key, false otherwise.
         */
        private boolean matchesKey(ClientMethodParameter key) {
            return this.key.getName().equals(key.getName());
        }

        /**
         * Obtain an immutable {@link ParameterTransformation} version of this transformation.
         *
         * @return the transformation details.
         */
        private ParameterTransformation toImmutable() {
            return new ParameterTransformation(key, CollectionUtil.toImmutableList(this.mappings));
        }

        /**
         * Inspects the list of transformations to see if a transformation already exists for the given key,
         * if it does, add {@code mapping} to it, otherwise create a new transformation, add it to the list
         * and add {@code mapping} to it.
         *
         * @param transformations the list of transformations.
         * @param key the key parameter to get or add a transformation for.
         * @param mapping the mapping to add to the transformation.
         */
        private static void createOrUpdate(List<Transformation> transformations, ClientMethodParameter key,
            ParameterMapping mapping) {
            final Transformation transformation = transformations.stream()
                .filter(t -> t.matchesKey(key))
                .findAny()
                .orElseGet(() -> create(transformations, key));
            transformation.mappings.add(mapping);
        }

        /**
         * Adds a transformation for the given key to the list of transformations.
         *
         * @param transformations the list of transformations.
         * @param key the key parameter create transformation for.
         *
         * @return a new transformation object with the key.
         */
        private static Transformation create(List<Transformation> transformations, ClientMethodParameter key) {
            final Transformation transformation = new Transformation(key);
            transformations.add(transformation);
            return transformation;
        }
    }

    /**
     * Describes mapping of an SDK method "input parameter".
     */
    private static final class InMapping {
        private final ClientMethodParameter parameter;
        private final ClientModelProperty parameterProperty;

        /**
         * Creates InMapping.
         *
         * @param parameter describes the "input" parameter that SDK Method takes.
         * @param parameterProperty when not null, describes the property within the {@code parameter} model, where its
         * value is sent to the service.
         */
        private InMapping(ClientMethodParameter parameter, ClientModelProperty parameterProperty) {
            this.parameter = Objects.requireNonNull(parameter, "parameter cannot be null");
            this.parameterProperty = parameterProperty;
        }
    }

    /**
     * Describes mapping of an "output parameter" sent to the service.
     */
    private static final class OutMapping {
        private final ClientMethodParameter parameter;
        private final ClientModelProperty parameterProperty;
        private final String parameterPropertyName;

        /**
         * Creates OutMapping.
         *
         * @param parameter describes the "output" parameter that is sent to the service.
         * @param parameterProperty describes the property within the {@code parameter} model, where its value is
         * populated from an SDK Method argument.
         * @param parameterPropertyName name of the {@code parameterProperty} as it appears in the {@code parameter}
         * model.
         */
        private OutMapping(ClientMethodParameter parameter, ClientModelProperty parameterProperty,
            String parameterPropertyName) {
            this.parameter = Objects.requireNonNull(parameter, "parameter cannot be null");
            this.parameterProperty = parameterProperty;
            this.parameterPropertyName = parameterPropertyName;
        }
    }
}
