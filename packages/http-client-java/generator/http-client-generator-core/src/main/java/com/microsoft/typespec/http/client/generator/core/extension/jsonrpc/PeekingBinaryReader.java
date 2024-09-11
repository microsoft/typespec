// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.jsonrpc;

import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;

class PeekingBinaryReader implements Closeable {
    Integer lastByte;
    InputStream input;

    PeekingBinaryReader(InputStream input) {
        this.lastByte = null;
        this.input = input;
    }

    int readByte() throws IOException {
        if (lastByte != null) {
            int result = lastByte;
            lastByte = null;
            return result;
        }
        return input.read();
    }

    int peekByte() throws IOException {
        if (lastByte != null) {
            return lastByte;
        }
        int result = readByte();
        if (result != -1) {
            lastByte = result;
        }
        return result;
    }

    byte[] readBytes(int count) throws IOException {
        byte[] buffer = new byte[count];
        int read = 0;
        if (count > 0 && lastByte != null) {
            buffer[read++] = (byte) (int) lastByte;
            lastByte = null;
        }
        while (read < count) {
            read += input.read(buffer, read, count - read);
        }
        return buffer;
    }

    String readAsciiLine() throws IOException {
        StringBuilder result = new StringBuilder();
        int c = readByte();
        while (c != '\r' && c != '\n' && c != -1) {
            result.append((char) c);
            c = readByte();
        }
        if (c == '\r' && peekByte() == '\n') {
            readByte();
        }
        if (c == -1 && result.length() == 0) {
            return null;
        }
        return result.toString();
    }

    public void close() throws IOException {
        input.close();
    }
}
