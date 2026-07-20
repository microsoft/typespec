// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package payload.xml.implementation;

import com.azure.core.util.serializer.ObjectSerializer;
import com.azure.core.util.serializer.TypeReference;
import com.azure.xml.XmlReader;
import com.azure.xml.XmlSerializable;
import com.azure.xml.XmlWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.concurrent.ConcurrentHashMap;
import javax.xml.stream.XMLStreamException;
import reactor.core.publisher.Mono;

/**
 * An {@link ObjectSerializer} implementation that serializes and deserializes {@link XmlSerializable} types using
 * {@code azure-xml}. Deserialization relies on the generated static {@code fromXml(XmlReader)} factory method on the
 * target type.
 */
public final class XmlSerializer implements ObjectSerializer {

    private static final ConcurrentHashMap<Class<?>, Method> FROM_XML_CACHE = new ConcurrentHashMap<>();

    @Override
    @SuppressWarnings("unchecked")
    public <T> T deserialize(InputStream stream, TypeReference<T> typeReference) {
        Class<T> clazz = (Class<T>) typeReference.getJavaClass();
        Method fromXml = FROM_XML_CACHE.computeIfAbsent(clazz, c -> {
            try {
                return c.getDeclaredMethod("fromXml", XmlReader.class);
            } catch (NoSuchMethodException e) {
                throw new IllegalStateException(
                    "Type " + c.getName() + " does not have a static fromXml(XmlReader) method.", e);
            }
        });
        try (XmlReader xmlReader = XmlReader.fromStream(stream)) {
            return (T) fromXml.invoke(null, xmlReader);
        } catch (XMLStreamException | IllegalAccessException e) {
            throw new IllegalStateException(e);
        } catch (InvocationTargetException e) {
            throw new IllegalStateException(e.getCause() == null ? e : e.getCause());
        }
    }

    @Override
    public <T> Mono<T> deserializeAsync(InputStream stream, TypeReference<T> typeReference) {
        return Mono.fromCallable(() -> deserialize(stream, typeReference));
    }

    @Override
    public void serialize(OutputStream stream, Object value) {
        if (!(value instanceof XmlSerializable<?>)) {
            throw new IllegalArgumentException("Value must implement XmlSerializable to be serialized as XML, but was: "
                + (value == null ? "null" : value.getClass().getName()));
        }
        try (XmlWriter xmlWriter = XmlWriter.toStream(stream)) {
            xmlWriter.writeStartDocument();
            xmlWriter.writeXml((XmlSerializable<?>) value);
            xmlWriter.flush();
        } catch (XMLStreamException e) {
            throw new UncheckedIOException(new IOException(e));
        }
    }

    @Override
    public Mono<Void> serializeAsync(OutputStream stream, Object value) {
        return Mono.fromRunnable(() -> serialize(stream, value));
    }
}
