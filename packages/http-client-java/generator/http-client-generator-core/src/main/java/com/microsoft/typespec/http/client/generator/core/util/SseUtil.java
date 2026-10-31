// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SchemaContext;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseEventMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.SseSchemaMetadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientException;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientResponse;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.SseModelMetadata;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utilities for server-sent event generation.
 */
public final class SseUtil {
    public static final String SERVER_SENT_EVENT_STREAM_HELPER = "ServerSentEventStreamHelper";
    private static final String STREAM_EVENT_SUFFIX = "StreamEvent";

    private SseUtil() {
    }

    public static boolean isSseOperation(Operation operation) {
        JavaSettings settings = JavaSettings.getInstance();
        return operation.getSseMetadata() != null
            && settings.isAzureV1()
            && settings.isDataPlaneClient()
            && !operation.isPageable()
            && !(operation.isLro() && (settings.isFluent() || settings.getPollingSettings("default") != null));
    }

    public static boolean isSseModelConsumer(Operation operation) {
        JavaSettings settings = JavaSettings.getInstance();
        if (!isSseOperation(operation)
            || !settings.isGenerateSyncAsyncClients()
            || operation.getConvenienceApi() == null
            || !(settings.isGenerateAsyncMethods()
                || (settings.isGenerateSyncMethods() && settings.isSyncStackEnabled()))) {
            return false;
        }
        if (operation.getSseMetadata().getBaseSchema() == null) {
            throw invalidSseMetadata(operation, "the base schema is missing");
        }
        var usage = operation.getSseMetadata().getBaseSchema().getUsage();
        if (usage == null || !(usage.contains(SchemaContext.PUBLIC) || usage.contains(SchemaContext.INTERNAL))) {
            return false;
        }
        var requests = operation.getConvenienceApi().getRequests() == null
            ? operation.getRequests()
            : operation.getConvenienceApi().getRequests();
        boolean consumer = !requests.isEmpty()
            && Mappers.getProxyMethodMapper()
                .map(operation)
                .values()
                .stream()
                .flatMap(List::stream)
                .anyMatch(proxy -> proxy.getImplementation() == null
                    && (proxy.isSync() ? settings.isGenerateSyncMethods() : settings.isGenerateAsyncMethods()));
        if (consumer) {
            validateSseMetadata(operation);
        }
        return consumer;
    }

    private static void validateSseMetadata(Operation operation) {
        SseMetadata metadata = operation.getSseMetadata();
        SseSchemaMetadata base = metadata.getBaseSchema().getSseMetadata();
        if (metadata.getStreamName() == null
            || metadata.getStreamName().isEmpty()
            || base == null
            || !Objects.equals(base.getStreamName(), metadata.getStreamName())
            || base.getEventName() != null
            || base.isTerminal()) {
            throw invalidSseMetadata(operation, "the base schema rendering metadata does not match the stream");
        }
        if (metadata.getEvents() == null || metadata.getEvents().isEmpty()) {
            throw invalidSseMetadata(operation, "the event list is null or empty");
        }
        for (SseEventMetadata event : metadata.getEvents()) {
            if (event == null
                || event.getName() == null
                || event.getName().isEmpty()
                || event.getEventSchema() == null) {
                throw invalidSseMetadata(operation, "an event is missing its name or schema");
            }
            SseSchemaMetadata rendering = event.getEventSchema().getSseMetadata();
            if (rendering == null
                || !Objects.equals(rendering.getStreamName(), metadata.getStreamName())
                || !Objects.equals(rendering.getEventName(), event.getName())
                || rendering.isTerminal() != event.isTerminal()) {
                throw invalidSseMetadata(operation,
                    "event '" + event.getName() + "' schema rendering metadata does not match the event");
            }
            var parents = event.getEventSchema().getParents();
            if (parents == null
                || parents.getImmediate() == null
                || parents.getImmediate().size() != 1
                || parents.getImmediate().get(0) != metadata.getBaseSchema()) {
                throw invalidSseMetadata(operation,
                    "event '" + event.getName() + "' schema does not inherit from the operation's base schema");
            }
        }
    }

    private static IllegalStateException invalidSseMetadata(Operation operation, String reason) {
        return new IllegalStateException("Invalid SSE metadata for operation '" + operation.getOperationId()
            + "' with stream ID '" + operation.getSseMetadata().getSseStreamId() + "': " + reason + ".");
    }

    public static String getSerializerPackage() {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackage(settings.getImplementationSubpackage());
    }

    public static Set<ObjectSchema> getSseSchemas(Collection<Client> clients, List<EnumType> enums,
        List<ClientResponse> responses, List<ClientException> exceptions) {
        List<SseMetadata> streams = clients.stream()
            .flatMap(client -> client.getOperationGroups().stream())
            .flatMap(group -> group.getOperations().stream())
            .filter(SseUtil::isSseModelConsumer)
            .map(Operation::getSseMetadata)
            .collect(Collectors.toList());
        Set<ObjectSchema> schemas = Collections.newSetFromMap(new IdentityHashMap<>());
        if (streams.isEmpty()) {
            return schemas;
        }
        Set<String> sourcePaths = new LinkedHashSet<>();
        enums.forEach(type -> sourcePaths.add(sourcePath(type.getPackage(), type.getName())));
        responses.forEach(type -> sourcePaths.add(sourcePath(type.getPackage(), type.getName())));
        exceptions.forEach(type -> sourcePaths.add(sourcePath(type.getPackage(), type.getName())));
        Set<String> simpleNames = new LinkedHashSet<>();
        for (ClientModel model : ClientModels.getInstance().getModels()) {
            simpleNames.add(model.getName());
            sourcePaths.add(sourcePath(model.getPackage(), model.getName()));
        }
        Set<ObjectSchema> bases = Collections.newSetFromMap(new IdentityHashMap<>());
        for (SseMetadata stream : streams) {
            if (!bases.add(stream.getBaseSchema())) {
                continue;
            }
            validateEventFactoryNames(stream);
            List<ObjectSchema> eventSchemas = new ArrayList<>();
            eventSchemas.add(stream.getBaseSchema());
            stream.getEvents().forEach(event -> eventSchemas.add(event.getEventSchema()));
            ClassType baseEventType = Mappers.getObjectMapper().map(stream.getBaseSchema());
            for (ObjectSchema schema : eventSchemas) {
                ClassType type = Mappers.getObjectMapper().map(schema);
                if (!Objects.equals(type.getPackage(), baseEventType.getPackage())) {
                    throw new IllegalStateException("SSE schema '" + type.getFullName() + "' must share package '"
                        + baseEventType.getPackage() + "' with base event type '" + baseEventType.getFullName()
                        + "' for package-private constructors.");
                }
                if (!simpleNames.add(type.getName())) {
                    throw new IllegalStateException("SSE schema '" + type.getFullName()
                        + "' conflicts with the existing ModelMapper simple-name cache.");
                }
                if (!sourcePaths.add(sourcePath(type.getPackage(), type.getName()))) {
                    throw new IllegalStateException("SSE generated source file '"
                        + sourcePath(type.getPackage(), type.getName()) + "' conflicts with another source file.");
                }
                schemas.add(schema);
            }
            ClassType serializer = getSerializerType(baseEventType);
            if (!sourcePaths.add(sourcePath(serializer.getPackage(), serializer.getName()))) {
                throw new IllegalStateException(
                    "SSE generated source file '" + sourcePath(serializer.getPackage(), serializer.getName())
                        + "' conflicts with another source file.");
            }
        }
        return schemas;
    }

    private static String sourcePath(String packageName, String name) {
        return "src/main/java/" + packageName.replace('.', '/') + "/" + name + ".java";
    }

    public static String getRuntimePackage() {
        JavaSettings settings = JavaSettings.getInstance();
        return settings.getPackage(settings.getModelsSubpackage(), settings.getImplementationSubpackage(), "sse");
    }

    public static ClassType getSerializerType(ClassType baseEventType) {
        return new ClassType.Builder().packageName(getSerializerPackage())
            .name(baseEventType.getName() + "Serializer")
            .build();
    }

    public static ClassType getRuntimeType() {
        return new ClassType.Builder().packageName(getRuntimePackage()).name(SERVER_SENT_EVENT_STREAM_HELPER).build();
    }

    public static String getClientTerminalPredicate(ClientMethod method) {
        return method.getSseMetadata().getEventType().getName() + "::isTerminal";
    }

    public static String getEventFactoryMethodName(String eventName) {
        return "create" + normalizeEventName(eventName);
    }

    public static void validateEventFactoryNames(SseMetadata metadata) {
        Map<String, String> wireNamesByFactoryName = new LinkedHashMap<>();
        for (SseEventMetadata event : metadata.getEvents()) {
            String factoryName = getEventFactoryMethodName(event.getName());
            String collidingWireName = wireNamesByFactoryName.putIfAbsent(factoryName, event.getName());
            if (collidingWireName != null) {
                throw new IllegalStateException("SSE event names '" + collidingWireName + "' and '" + event.getName()
                    + "' resolve to duplicate Java factory method '" + factoryName + "'.");
            }
        }
    }

    public static List<String> getTerminalEventNames(SseMetadata metadata) {
        return metadata.getEvents()
            .stream()
            .filter(SseEventMetadata::isTerminal)
            .map(SseEventMetadata::getName)
            .collect(Collectors.toList());
    }

    public static String getStreamDescription(ClientMethod method) {
        return getStreamDescription(method.getSseMetadata().getEventType());
    }

    public static String getStreamDescription(ClientModel model) {
        SseModelMetadata metadata = requireSseMetadata(model);
        return getStreamDescription(metadata.getStreamName());
    }

    private static String getStreamDescription(ClassType eventType) {
        String baseName = eventType.getName();
        String baseStem = baseName.endsWith(STREAM_EVENT_SUFFIX)
            ? baseName.substring(0, baseName.length() - STREAM_EVENT_SUFFIX.length())
            : baseName;
        return baseStem.isEmpty() ? "SSE" : toLowerCaseWords(baseStem);
    }

    private static String getStreamDescription(String sourceStreamName) {
        String streamName = CodeNamer.toPascalCase(sourceStreamName);
        String baseEventName
            = streamName.endsWith("Events") ? streamName.substring(0, streamName.length() - 1) : streamName + "Event";
        baseEventName = CodeNamer.toPascalCase(CodeNamer.removeInvalidCharacters(baseEventName));
        String baseStem = baseEventName.endsWith(STREAM_EVENT_SUFFIX)
            ? baseEventName.substring(0, baseEventName.length() - STREAM_EVENT_SUFFIX.length())
            : baseEventName;
        return baseStem.isEmpty() ? "SSE" : toLowerCaseWords(baseStem);
    }

    public static String getStreamKindDescription(ClientModel model) {
        return getStreamKindDescription(getStreamDescription(model));
    }

    private static String getStreamKindDescription(String description) {
        int lastSpace = description.lastIndexOf(' ');
        return lastSpace < 0 ? description : description.substring(lastSpace + 1);
    }

    public static SseModelMetadata requireSseMetadata(ClientModel model) {
        if (model.getSseMetadata() == null) {
            throw new IllegalStateException(
                "Client model '" + model.getFullName() + "' has no SSE rendering metadata.");
        }
        return model.getSseMetadata();
    }

    private static String normalizeEventName(String eventName) {
        StringBuilder normalizedName = new StringBuilder();
        for (String segment : eventName.split("[^A-Za-z0-9]+")) {
            if (!segment.isEmpty()) {
                normalizedName.append(CodeNamer.toPascalCase(segment));
            }
        }
        return normalizedName.toString();
    }

    private static String toLowerCaseWords(String value) {
        return value.replaceAll("(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])", " ").toLowerCase(Locale.ROOT);
    }

}
