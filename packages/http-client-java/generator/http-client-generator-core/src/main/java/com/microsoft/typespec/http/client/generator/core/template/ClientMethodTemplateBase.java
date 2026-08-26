// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IterableType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModelPropertySegment;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterSynthesizedOrigin;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodResponseHeader;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaType;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import io.clientcore.core.utils.CoreUtils;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public abstract class ClientMethodTemplateBase implements IJavaTemplate<ClientMethod, JavaType> {

    protected static void generateProtocolMethodJavadoc(ClientMethod clientMethod, JavaJavadocComment commentBlock) {
        commentBlock.description(clientMethod.getDescription());

        if (clientMethod.getProxyMethod() != null) {
            List<ProxyMethodParameter> queryParameters = clientMethod.getProxyMethod()
                .getAllParameters()
                .stream()
                .filter(p -> RequestParameterLocation.QUERY.equals(p.getRequestParameterLocation())
                    // ignore if synthesized by modelerfour, i.e. api-version
                    && p.getOrigin() == ParameterSynthesizedOrigin.NONE)
                .collect(Collectors.toList());
            if (!queryParameters.isEmpty() && hasParametersToPrintInJavadoc(queryParameters)) {
                optionalParametersJavadoc("Query Parameters", queryParameters, commentBlock);
                commentBlock.line("You can add these to a request with {@link RequestOptions#addQueryParam}");
            }

            List<ProxyMethodParameter> headerParameters = clientMethod.getProxyMethod()
                .getAllParameters()
                .stream()
                .filter(p -> RequestParameterLocation.HEADER.equals(p.getRequestParameterLocation()))
                // ignore if synthesized by modelerfour and is constant
                // we would want user to provide a correct "content-type" if it is not a constant
                .filter(p -> p.getOrigin() == ParameterSynthesizedOrigin.NONE || !p.isConstant())
                .collect(Collectors.toList());
            if (!headerParameters.isEmpty() && hasParametersToPrintInJavadoc(headerParameters)) {
                optionalParametersJavadoc("Header Parameters", headerParameters, commentBlock);
                commentBlock.line("You can add these to a request with {@link RequestOptions#addHeader}");
            }

            // Request body
            Set<IType> typesInJavadoc = new LinkedHashSet<>();

            Optional<ProxyMethodParameter> bodyParameter = clientMethod.getProxyMethod()
                .getAllParameters()
                .stream()
                .filter(p -> RequestParameterLocation.BODY.equals(p.getRequestParameterLocation()))
                .findFirst();

            if (bodyParameter.isPresent()) {
                ClientModel model = ClientModelUtil.getClientModel(bodyParameter.get().getRawType().toString());
                if (model == null || !ClientModelUtil.isMultipartModel(model)) {
                    // do not generate JSON schema for Multipart request body
                    boolean isBodyParamRequired = bodyParameter.map(ProxyMethodParameter::isRequired).orElse(false);
                    bodyParameter.map(ProxyMethodParameter::getRawType)
                        .ifPresent(
                            type -> requestBodySchemaJavadoc(type, commentBlock, typesInJavadoc, isBodyParamRequired));
                }
            }

            // Response body
            IType responseBodyType;
            if (JavaSettings.getInstance().isDataPlaneClient() && JavaSettings.getInstance().isAzureV1()) {
                // special handling for paging method
                if (clientMethod.getType().isPaging()) {
                    List<ModelPropertySegment> pageItemsPropertyReference
                        = clientMethod.getMethodPageDetails().getPageItemsPropertyReference();
                    IType valueListType = pageItemsPropertyReference.get(pageItemsPropertyReference.size() - 1)
                        .getProperty()
                        .getClientType();
                    if (!(valueListType instanceof IterableType)) {
                        throw new IllegalStateException(
                            "Page items property must be List or Iterable. ResponseType = " + valueListType);
                    }
                    IType[] listTypeArgs = ((IterableType) valueListType).getTypeArguments();
                    if (listTypeArgs.length == 0) {
                        throw new IllegalStateException(
                            "Page items List or Iterable does not have a template argument. ResponseType = "
                                + valueListType);
                    }
                    responseBodyType = listTypeArgs[0];
                } else {
                    responseBodyType = clientMethod.getProxyMethod().getRawResponseBodyType();
                }
            } else {
                responseBodyType = clientMethod.getProxyMethod().getResponseBodyType();
            }
            if (responseBodyType != null && !responseBodyType.equals(PrimitiveType.VOID)) {
                responseBodySchemaJavadoc(responseBodyType, commentBlock, typesInJavadoc);
            }

            if (clientMethod.getParameters()
                .stream()
                .anyMatch(parameter -> ClassType.REQUEST_OPTIONS.equals(parameter.getClientType()))
                && !CoreUtils.isNullOrEmpty(clientMethod.getProxyMethod().getResponseHeaders())) {
                responseHeadersJavadoc(clientMethod.getProxyMethod().getResponseHeaders(), commentBlock);
            }
        }

        clientMethod.getParameters()
            .forEach(p -> commentBlock.param(p.getName(), MethodUtil.methodParameterDescriptionOrDefault(p)));
        if (clientMethod.getProxyMethod() != null) {
            generateJavadocExceptions(clientMethod, commentBlock, false);
        }
        commentBlock.methodReturns(clientMethod.getReturnValue().getDescription());

        // add external documentation
        if (clientMethod.getMethodDocumentation() != null) {
            commentBlock.line("@see <a href=" + clientMethod.getMethodDocumentation().getUrl() + ">"
                + clientMethod.getMethodDocumentation().getDescription() + "</a>");
        }
    }

    protected static void generateJavadocExceptions(ClientMethod clientMethod, JavaJavadocComment commentBlock,
        boolean useFullClassName) {
        ProxyMethod restAPIMethod = clientMethod.getProxyMethod();
        if (JavaSettings.getInstance().isAzureV1()) {
            if (restAPIMethod != null && restAPIMethod.getUnexpectedResponseExceptionType() != null) {
                commentBlock.methodThrows(
                    useFullClassName
                        ? restAPIMethod.getUnexpectedResponseExceptionType().getFullName()
                        : restAPIMethod.getUnexpectedResponseExceptionType().getName(),
                    "thrown if the request is rejected by server");
            }
            if (restAPIMethod != null && restAPIMethod.getUnexpectedResponseExceptionTypes() != null) {
                for (Map.Entry<ClassType, List<Integer>> exception : restAPIMethod.getUnexpectedResponseExceptionTypes()
                    .entrySet()) {
                    commentBlock.methodThrows(
                        useFullClassName ? exception.getKey().getFullName() : exception.getKey().getName(),
                        String.format("thrown if the request is rejected by server on status code %s",
                            exception.getValue().stream().map(String::valueOf).collect(Collectors.joining(", "))));
                }
            }
        } else {
            if (restAPIMethod != null
                && (restAPIMethod.getUnexpectedResponseExceptionType() != null
                    || restAPIMethod.getUnexpectedResponseExceptionTypes() != null)) {
                commentBlock.methodThrows("HttpResponseException", "thrown if the service returns an error");
            }
        }
    }

    private static void optionalParametersJavadoc(String title, List<ProxyMethodParameter> parameters,
        JavaJavadocComment commentBlock) {
        List<List<String>> rows = parameters.stream().filter(parameter -> {
            boolean parameterIsConstantOrFromClient = parameter.isConstant() || parameter.isFromClient();
            return !parameter.isRequired() && !parameterIsConstantOrFromClient;
        })
            .map(parameter -> List.of(parameter.getRequestParameterName(),
                CodeNamer.escapeXmlComment(parameter.getClientType().toString()), "No",
                parameterDescriptionOrDefault(parameter)))
            .collect(Collectors.toList());
        javadocTable(title, List.of("Name", "Type", "Required", "Description"), rows, commentBlock);
    }

    private static void responseHeadersJavadoc(List<ProxyMethodResponseHeader> responseHeaders,
        JavaJavadocComment commentBlock) {
        List<List<String>> rows = responseHeaders.stream()
            .map(header -> List.of(CodeNamer.escapeXmlComment(header.getSerializedName()),
                CodeNamer.escapeXmlComment(header.getClientType().toString()),
                CodeNamer.escapeXmlComment(header.getDescription())))
            .collect(Collectors.toList());
        javadocTable("Response Headers", List.of("Name", "Type", "Description"), rows, commentBlock);
    }

    private static void javadocTable(String title, List<String> columns, List<List<String>> rows,
        JavaJavadocComment commentBlock) {
        commentBlock.line(String.format("<p><strong>%s</strong></p>", title));
        commentBlock.line("<table border=\"1\">");
        commentBlock.line(String.format("    <caption>%s</caption>", title));
        commentBlock.line("    <tr>"
            + columns.stream().map(column -> "<th>" + column + "</th>").collect(Collectors.joining()) + "</tr>");
        for (List<String> row : rows) {
            commentBlock.line("    <tr>"
                + row.stream().map(value -> "<td>" + value + "</td>").collect(Collectors.joining()) + "</tr>");
        }
        commentBlock.line("</table>");
    }

    private static boolean hasParametersToPrintInJavadoc(List<ProxyMethodParameter> parameters) {
        return parameters.stream().anyMatch(parameter -> {
            boolean parameterIsConstantOrFromClient = parameter.isConstant() || parameter.isFromClient();
            boolean parameterIsRequired = parameter.isRequired();
            return !parameterIsRequired && !parameterIsConstantOrFromClient;
        });
    }

    private static void requestBodySchemaJavadoc(IType requestBodyType, JavaJavadocComment commentBlock,
        Set<IType> typesInJavadoc, boolean isBodyParamRequired) {
        typesInJavadoc.clear();

        if (requestBodyType == null) {
            return;
        }
        commentBlock.line("<p><strong>Request Body Schema</strong></p>");
        commentBlock.line("<pre>{@code");
        bodySchemaJavadoc(requestBodyType, commentBlock, "", null, typesInJavadoc, isBodyParamRequired,
            isBodyParamRequired, true);
        commentBlock.line("}</pre>");
    }

    private static void responseBodySchemaJavadoc(IType responseBodyType, JavaJavadocComment commentBlock,
        Set<IType> typesInJavadoc) {
        typesInJavadoc.clear();

        if (responseBodyType == null) {
            return;
        }
        commentBlock.line("<p><strong>Response Body Schema</strong></p>");
        commentBlock.line("<pre>{@code");
        bodySchemaJavadoc(responseBodyType, commentBlock, "", null, typesInJavadoc, true, true, true);
        commentBlock.line("}</pre>");
    }

    private static void bodySchemaJavadoc(IType type, JavaJavadocComment commentBlock, String indent, String name,
        Set<IType> typesInJavadoc, boolean isRequired, boolean isRequiredForCreate, boolean isRootSchema) {
        String nextIndent = indent + "    ";
        if ((ClientModelUtil.isClientModel(type) || ClientModelUtil.isExternalModel(type))
            && !typesInJavadoc.contains(type)) {
            typesInJavadoc.add(type);
            ClientModel model = ClientModelUtil.getClientModel(((ClassType) type).getName());
            if (name != null) {
                commentBlock.line(indent + name
                    + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema) + ": {");
            } else {
                commentBlock.line(
                    indent + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema) + "{");
            }
            Map<String, ClientModelProperty> properties = new LinkedHashMap<>();
            traverseProperties(model, properties);
            for (ClientModelProperty property : properties.values()) {
                bodySchemaJavadoc(property.getWireType(), commentBlock, nextIndent, property.getSerializedName(),
                    typesInJavadoc, property.isRequired() || property.isPolymorphicDiscriminator(),
                    property.isRequiredForCreate(), false);
            }
            commentBlock.line(indent + "}");
        } else if (typesInJavadoc.contains(type)) {
            if (name != null) {
                commentBlock.line(
                    indent + name + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema)
                        + ": (recursive schema, see " + name + " above)");
            } else {
                commentBlock.line(indent + "(recursive schema, see above)");
            }
        } else if (type instanceof IterableType) {
            if (name != null) {
                commentBlock.line(indent + name
                    + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema) + ": [");
            } else {
                commentBlock.line(
                    indent + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema) + "[");
            }
            bodySchemaJavadoc(((IterableType) type).getElementType(), commentBlock, nextIndent, null, typesInJavadoc,
                isRequired, isRequiredForCreate, false);
            commentBlock.line(indent + "]");
        } else if (type instanceof EnumType) {
            String values = ((EnumType) type).getValues()
                .stream()
                .map(ClientEnumValue::getValue)
                .collect(Collectors.joining("/"));
            if (name != null) {
                commentBlock.line(indent + name + ": String(" + values + ")"
                    + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema));
            } else {
                commentBlock.line(indent + "String(" + values + ")"
                    + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema));
            }
        } else if (type instanceof MapType) {
            if (name != null) {
                commentBlock.line(indent + name
                    + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema) + ": {");
            } else {
                commentBlock.line(
                    indent + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema) + "{");
            }
            final boolean valueRequired = !((MapType) type).isValueNullable();
            bodySchemaJavadoc(((MapType) type).getValueType(), commentBlock, nextIndent, "String", typesInJavadoc,
                valueRequired, valueRequired, false);
            commentBlock.line(indent + "}");
        } else {
            String javadoc = type.toString();
            if (name != null) {
                commentBlock.line(indent + name + ": " + javadoc
                    + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema));
            } else {
                commentBlock.line(indent + javadoc
                    + appendOptionalOrRequiredAttribute(isRequired, isRequiredForCreate, isRootSchema));
            }
        }
    }

    private static void traverseProperties(ClientModel model, Map<String, ClientModelProperty> properties) {
        if (model.getParentModelName() != null) {
            traverseProperties(ClientModelUtil.getClientModel(model.getParentModelName()), properties);
        }

        model.getProperties().forEach(p -> properties.put(p.getSerializedName(), p));
    }

    private static String parameterDescriptionOrDefault(ProxyMethodParameter parameter) {
        String paramJavadoc = parameter.getDescription();
        if (CoreUtils.isNullOrEmpty(paramJavadoc)) {
            paramJavadoc = String.format("The %1$s parameter", parameter.getName());
        }
        String description = CodeNamer.escapeComment(CodeNamer.escapeXmlComment(paramJavadoc));
        // query with array, add additional description
        if (parameter.getRequestParameterLocation() == RequestParameterLocation.QUERY
            && parameter.getCollectionFormat() != null) {
            description = (CoreUtils.isNullOrEmpty(description) || description.endsWith("."))
                ? description
                : (description + ".");
            if (parameter.getExplode()) {
                // collectionFormat: multi
                description += " Call {@link RequestOptions#addQueryParam} to add string to array.";
            } else {
                // collectionFormat: csv, ssv, tsv, pipes
                description += String.format(" In the form of %s separated string.",
                    ClassType.STRING.defaultValueExpression(parameter.getCollectionFormat().getDelimiter()));
            }
        }
        return description;
    }

    private static String appendOptionalOrRequiredAttribute(boolean isRequired, boolean isRequiredForCreate,
        boolean isRootSchema) {
        if (isRootSchema) {
            return "";
        } else if (isRequired) {
            return " (Required)";
        } else if (isRequiredForCreate) {
            return " (Optional, Required on create)";
        } else {
            return " (Optional)";
        }
    }
}
