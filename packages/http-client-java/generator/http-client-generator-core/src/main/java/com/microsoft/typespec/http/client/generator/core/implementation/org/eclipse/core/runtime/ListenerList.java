// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2016 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *     Mikael Barbero (Eclipse Foundation) - Bug 509234
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.core.runtime;

import java.util.*;

/**
 * This class is a thread safe list that is designed for storing lists of listeners. The implementation is optimized for
 * minimal memory footprint, frequent reads and infrequent writes. Modification of the list is synchronized and
 * relatively expensive, while accessing the listeners is very fast. For legacy code, readers are given access to the
 * underlying array data structure for reading, with the trust that they will not modify the underlying array. <p> A
 * listener list handles the <i>same</i> listener being added multiple times, and tolerates removal of listeners that
 * are the same as other listeners in the list. For this purpose, listeners can be compared with each other using either
 * equality or identity, as specified in the list constructor. </p> <p> Use an enhanced 'for' loop to notify listeners.
 * The recommended code sequence for notifying all registered listeners of say,
 * <code>FooListener#eventHappened(Event)</code>, is: </p>
 *
 * <pre>
 * ListenerList&lt;FooListener&gt; fooListeners = new ListenerList&lt;&gt;();
 * //...
 * for (FooListener listener : fooListeners) {
 *     listener.eventHappened(event);
 * }
 * </pre>
 *
 * <p> This class can be used without OSGi running. </p>
 *
 * @param <E> the type of listeners in this list
 * @since org.eclipse.equinox.common 3.2
 */
public class ListenerList<E> implements Iterable<E> {

    /**
     * The empty array singleton instance.
     */
    private static final Object[] EmptyArray = new Object[0];

    /**
     * The list of listeners. Initially empty but initialized to an array of size capacity the first time a listener is
     * added. Maintains invariant: listeners != null
     */
    private volatile Object[] listeners = EmptyArray;

    /**
     * Creates a listener list using the provided comparison mode.
     *
     */
    public ListenerList() {
    }

    /**
     * Adds a listener to this list. This method has no effect if the <a href="ListenerList.html#same">same</a> listener
     * is already registered.
     *
     * @param listener the non-<code>null</code> listener to add
     */
    public synchronized void add(E listener) {
        // This method is synchronized to protect against multiple threads adding
        // or removing listeners concurrently. This does not block concurrent readers.
        if (listener == null) {
            throw new IllegalArgumentException();
        }
        // check for duplicates
        final int oldSize = listeners.length;
        for (Object listener2 : listeners) {
            if (listener == listener2) {
                return;
            }
        }
        // Thread safety: create new array to avoid affecting concurrent readers
        Object[] newListeners = new Object[oldSize + 1];
        System.arraycopy(listeners, 0, newListeners, 0, oldSize);
        newListeners[oldSize] = listener;
        // atomic assignment
        this.listeners = newListeners;
    }

    /**
     * Returns an iterator over all the registered listeners. The resulting iterator is unaffected by subsequent adds or
     * removes. Use this method when notifying listeners, so that any modifications to the listener list during the
     * notification will have no effect on the notification itself.
     *
     * @return an iterator
     * @since org.eclipse.equinox.common 3.8
     */
    @Override
    public Iterator<E> iterator() {
        return new ListenerListIterator<>(listeners);
    }

    private static class ListenerListIterator<E> implements Iterator<E> {
        private final Object[] listeners;
        private int i;

        public ListenerListIterator(Object[] listeners) {
            this.listeners = listeners;
        }

        @Override
        public boolean hasNext() {
            return i < listeners.length;
        }

        @Override
        public E next() {
            if (i >= listeners.length) {
                throw new NoSuchElementException();
            }
            @SuppressWarnings("unchecked") // (E) is safe, because #add(E) only accepts Es
            E next = (E) listeners[i++];
            return next;
        }

        @Override
        public void remove() {
            throw new UnsupportedOperationException();
        }
    }

    /**
     * Removes a listener from this list. Has no effect if the <a href="ListenerList.html#same">same</a> listener was
     * not already registered.
     *
     * @param listener the non-<code>null</code> listener to remove
     */
    public synchronized void remove(Object listener) {
        // This method is synchronized to protect against multiple threads adding
        // or removing listeners concurrently. This does not block concurrent readers.
        if (listener == null) {
            throw new IllegalArgumentException();
        }
        int oldSize = listeners.length;
        for (int i = 0; i < oldSize; ++i) {
            Object listener2 = listeners[i];
            if (listener == listener2) {
                if (oldSize == 1) {
                    listeners = EmptyArray;
                } else {
                    // Thread safety: create new array to avoid affecting concurrent readers
                    Object[] newListeners = new Object[oldSize - 1];
                    System.arraycopy(listeners, 0, newListeners, 0, i);
                    System.arraycopy(listeners, i + 1, newListeners, i, oldSize - i - 1);
                    // atomic assignment to field
                    this.listeners = newListeners;
                }
                return;
            }
        }
    }

    /**
     * Returns a Spliterator covering the registered listeners. <p> The spliterator reports Spliterator.SIZED,
     * Spliterator.SUBSIZED, Spliterator.ORDERED, and Spliterator.IMMUTABLE
     *
     * @return a spliterator for listeners
     * @since org.eclipse.equinox.common 3.9
     */
    @Override
    @SuppressWarnings("unchecked")
    public Spliterator<E> spliterator() {
        return (Spliterator<E>) Arrays.spliterator(listeners);
    }

    @Override
    public String toString() {
        return Arrays.toString(listeners);
    }
}
