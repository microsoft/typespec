// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.implementation;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Manages the structure of JSON flattened {@link ClientModelProperty ClientModelProperties} in a {@link ClientModel}.
 * <p>
 * This structure determines how model types are generated when handling JSON flattened stream-style serialization in
 * regard to where properties are stored.
 */
public final class JsonFlattenedPropertiesTree {
    // A property being set indicates that this is a terminal value.
    private final ClientModelPropertyWithMetadata property;
    private final String nodeName;
    private final Map<String, JsonFlattenedPropertiesTree> nodes;

    /**
     * Creates a base node for a JSON flattened tree.
     *
     * @return A new base node for a JSON flattened tree.
     */
    public static JsonFlattenedPropertiesTree createBaseNode() {
        return new JsonFlattenedPropertiesTree(null, null);
    }

    /**
     * Creates an intermediate node for a JSON flattened tree.
     * <p>
     * Intermediate nodes manage steps in JSON flattened structures, for example {@code a.flattened.json}
     * would have two intermediate nodes in {@code a} and {@code flattened} where {@code json} would be a terminal
     * node.
     *
     * @param nodeName Name of the node, correlates to the JSON property name.
     * @return A new intermediate node for a JSON flattened tree.
     */
    public static JsonFlattenedPropertiesTree createIntermediateNode(String nodeName) {
        return new JsonFlattenedPropertiesTree(null, nodeName);
    }

    /**
     * Creates a terminal node for a JSON flattened tree.
     * <p>
     * Terminal nodes manage end points in JSON flattened structures, for example {@code a.flattened.json}
     * would have two intermediate nodes in {@code a} and {@code flattened} where {@code json} would be a terminal
     * node.
     *
     * @param nodeName Name of the node, correlates to the JSON property name.
     * @param property The {@link ClientModelProperty} which contains information about the JSON property.
     * @return A new terminal node for a JSON flattened tree.
     */
    public static JsonFlattenedPropertiesTree createTerminalNode(String nodeName,
        ClientModelPropertyWithMetadata property) {
        return new JsonFlattenedPropertiesTree(property, nodeName);
    }

    /**
     * Adds a new child node into the JSON flattened tree.
     * <p>
     * An exception will be thrown if the node having the child node added is a terminal node. Terminal nodes cannot
     * have children otherwise the JSON structure would be invalid.
     *
     * @param childNode The child node.
     * @throws IllegalStateException If the node having the child node added is a terminal node.
     */
    public void addChildNode(JsonFlattenedPropertiesTree childNode) {
        if (property != null) {
            throw new IllegalStateException("JSON flatten structure contains a terminal node and intermediate "
                + "node with the same JSON property. This isn't valid as it would require the JSON property "
                + "to be both a sub-object and a value node.");
        }

        nodes.put(childNode.nodeName, childNode);
    }

    /**
     * Whether this node has a child node with the specified name.
     *
     * @param childNodeName The child node name.
     * @return Whether this node has a child node with the specified name.
     */
    public boolean hasChildNode(String childNodeName) {
        return nodes.containsKey(childNodeName);
    }

    /**
     * Gets the child not with the specified name.
     * <p>
     * If this node doesn't contain a child node with the specified name null will be returned.
     *
     * @param childNodeName The child node name.
     * @return The child name with the specified name, or null if it doesn't exist.
     */
    public JsonFlattenedPropertiesTree getChildNode(String childNodeName) {
        return nodes.get(childNodeName);
    }

    /**
     * Gets the children nodes for this node.
     *
     * @return The children nodes for this node.
     */
    public Map<String, JsonFlattenedPropertiesTree> getChildrenNodes() {
        return nodes;
    }

    /**
     * Gets the name of this node.
     * <p>
     * If this is the root node this will be null.
     *
     * @return The name of this node, or null if it's the root node.
     */
    public String getNodeName() {
        return nodeName;
    }

    /**
     * Gets the {@link ClientModelProperty} associated to this node.
     * <p>
     * If this is the root or an intermediate node this will be null.
     *
     * @return The {@link ClientModelProperty} associated to this node, or null if this is the root or an intermediate
     * node.
     */
    public ClientModelPropertyWithMetadata getProperty() {
        return property;
    }

    private JsonFlattenedPropertiesTree(ClientModelPropertyWithMetadata property, String nodeName) {
        this.property = property;
        this.nodeName = nodeName;
        this.nodes = new LinkedHashMap<>();
    }
}
