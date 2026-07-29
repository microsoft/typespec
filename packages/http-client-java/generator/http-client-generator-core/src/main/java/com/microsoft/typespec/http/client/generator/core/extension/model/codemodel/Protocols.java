// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.codemodel;

import java.util.Objects;

/**
 * Represents custom extensible metadata for individual protocols (ie, HTTP, etc),
 */
public class Protocols {
    private Protocol http;
    private Protocol amqp;
    private Protocol mqtt;
    private Protocol jsonrpc;

    /**
     * Creates a new instance of the Protocols class.
     */
    public Protocols() {
    }

    /**
     * Gets the HTTP protocol.
     *
     * @return The HTTP protocol.
     */
    public Protocol getHttp() {
        return http;
    }

    /**
     * Sets the HTTP protocol.
     *
     * @param http The HTTP protocol.
     */
    public void setHttp(Protocol http) {
        this.http = http;
    }

    /**
     * Gets the AMQP protocol.
     *
     * @return The AMQP protocol.
     */
    public Protocol getAmqp() {
        return amqp;
    }

    /**
     * Sets the AMQP protocol.
     *
     * @param amqp The AMQP protocol.
     */
    public void setAmqp(Protocol amqp) {
        this.amqp = amqp;
    }

    /**
     * Gets the MQTT protocol.
     *
     * @return The MQTT protocol.
     */
    public Protocol getMqtt() {
        return mqtt;
    }

    /**
     * Sets the MQTT protocol.
     *
     * @param mqtt The MQTT protocol.
     */
    public void setMqtt(Protocol mqtt) {
        this.mqtt = mqtt;
    }

    /**
     * Gets the JSON-RPC protocol.
     *
     * @return The JSON-RPC protocol.
     */
    public Protocol getJsonrpc() {
        return jsonrpc;
    }

    /**
     * Sets the JSON-RPC protocol.
     *
     * @param jsonrpc The JSON-RPC protocol.
     */
    public void setJsonrpc(Protocol jsonrpc) {
        this.jsonrpc = jsonrpc;
    }

    @Override
    public String toString() {
        return Protocols.class.getName() + "@" + Integer.toHexString(System.identityHashCode(this)) + "[http="
            + Objects.toString(http, "<null>") + ",amqp=" + Objects.toString(amqp, "<null>") + ",mqtt="
            + Objects.toString(mqtt, "<null>") + ",jsonrpc=" + Objects.toString(jsonrpc, "<null>") + "]";
    }

    @Override
    public int hashCode() {
        return Objects.hash(http, jsonrpc, amqp, mqtt);
    }

    @Override
    public boolean equals(Object other) {
        if (other == this) {
            return true;
        }

        if (!(other instanceof Protocols)) {
            return false;
        }

        Protocols rhs = ((Protocols) other);
        return Objects.equals(http, rhs.http)
            && Objects.equals(jsonrpc, rhs.jsonrpc)
            && Objects.equals(amqp, rhs.amqp)
            && Objects.equals(mqtt, rhs.mqtt);
    }
}
