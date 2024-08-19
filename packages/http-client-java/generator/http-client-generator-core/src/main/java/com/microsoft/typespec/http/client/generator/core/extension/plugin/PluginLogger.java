// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.plugin;

import com.microsoft.typespec.http.client.generator.core.extension.model.MessageChannel;
import org.slf4j.helpers.FormattingTuple;
import org.slf4j.helpers.MarkerIgnoringBase;
import org.slf4j.helpers.MessageFormatter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * A logger for AutoRest plugins.
 */
public final class PluginLogger extends MarkerIgnoringBase {
    /**
     * The AutoRest plugin.
     */
    private final NewPlugin plugin;

    /**
     * The keys for logging.
     */
    private final List<String> keys;

    /**
     * Whether tracing is enabled.
     */
    private final boolean isTracingEnabled;

    /**
     * Whether debugging is enabled.
     */
    private final boolean isDebugEnabled;

    /**
     * Construct DefaultLogger for the given class.
     *
     * @param plugin the AutoRest plugin
     * @param clazz the class
     * @param labels the labels for logging
     */
    public PluginLogger(NewPlugin plugin, Class<?> clazz, String... labels) {
        this.plugin = plugin;
        this.isTracingEnabled = plugin.getBooleanValue("verbose", false);
        this.isDebugEnabled = plugin.getBooleanValue("debug", false) || plugin.getBooleanValue("debugger", false);

        this.keys = new ArrayList<>();
        if (clazz != null) {
            keys.add(clazz.getSimpleName());
        }

        if (labels != null && labels.length > 0) {
            this.keys.addAll(Arrays.asList(labels));
        }
    }

    /**
     * Construct DefaultLogger for the given class name.
     *
     * @param plugin the AutoRest plugin
     * @param labels the labels for logging
     */
    public PluginLogger(NewPlugin plugin, String... labels) {
        this(plugin, null, labels);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String getName() {
        return String.join("/", keys);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean isTraceEnabled() {
        return isTracingEnabled;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void trace(final String msg) {
        logMessageWithFormat(MessageChannel.VERBOSE, msg);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void trace(final String format, final Object arg1) {
        logMessageWithFormat(MessageChannel.VERBOSE, format, arg1);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void trace(final String format, final Object arg1, final Object arg2) {
        logMessageWithFormat(MessageChannel.VERBOSE, format, arg1, arg2);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void trace(final String format, final Object... arguments) {
        logMessageWithFormat(MessageChannel.VERBOSE, format, arguments);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void trace(final String msg, final Throwable t) {
        log(MessageChannel.VERBOSE, msg, t);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean isDebugEnabled() {
        return isDebugEnabled;
    }

    @Override
    public void debug(final String msg) {
        logMessageWithFormat(MessageChannel.DEBUG, msg);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void debug(String format, Object arg) {
        logMessageWithFormat(MessageChannel.DEBUG, format, arg);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void debug(final String format, final Object arg1, final Object arg2) {
        logMessageWithFormat(MessageChannel.DEBUG, format, arg1, arg2);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void debug(String format, Object... args) {
        logMessageWithFormat(MessageChannel.DEBUG, format, args);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void debug(final String msg, final Throwable t) {
        log(MessageChannel.DEBUG, msg, t);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean isInfoEnabled() {
        return true;
    }


    /**
     * {@inheritDoc}
     */
    @Override
    public void info(final String msg) {
        logMessageWithFormat(MessageChannel.INFORMATION, msg);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void info(String format, Object arg) {
        logMessageWithFormat(MessageChannel.INFORMATION, format, arg);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void info(final String format, final Object arg1, final Object arg2) {
        logMessageWithFormat(MessageChannel.INFORMATION, format, arg1, arg2);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void info(String format, Object... args) {
        logMessageWithFormat(MessageChannel.INFORMATION, format, args);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void info(final String msg, final Throwable t) {
        log(MessageChannel.INFORMATION, msg, t);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean isWarnEnabled() {
        return true;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void warn(final String msg) {
        logMessageWithFormat(MessageChannel.WARNING, msg);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void warn(String format, Object arg) {
        logMessageWithFormat(MessageChannel.WARNING, format, arg);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void warn(final String format, final Object arg1, final Object arg2) {
        logMessageWithFormat(MessageChannel.WARNING, format, arg1, arg2);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void warn(String format, Object... args) {
        logMessageWithFormat(MessageChannel.WARNING, format, args);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void warn(final String msg, final Throwable t) {
        log(MessageChannel.WARNING, msg, t);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean isErrorEnabled() {
        return true;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void error(String format, Object arg) {
        logMessageWithFormat(MessageChannel.ERROR, format, arg);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void error(final String msg) {
        logMessageWithFormat(MessageChannel.ERROR, msg);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void error(final String format, final Object arg1, final Object arg2) {
        logMessageWithFormat(MessageChannel.ERROR, format, arg1, arg2);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void error(String format, Object... args) {
        logMessageWithFormat(MessageChannel.ERROR, format, args);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void error(final String msg, final Throwable t) {
        log(MessageChannel.ERROR, msg, t);
    }

    /**
     * Format and write the message according to the {@code MESSAGE_TEMPLATE}.
     *
     * @param messageChannel The level to log.
     * @param format The log message format.
     * @param arguments a list of arbitrary arguments taken in by format.
     */
    private void logMessageWithFormat(MessageChannel messageChannel, String format, Object... arguments) {
        FormattingTuple tp = MessageFormatter.arrayFormat(format, arguments);
        log(messageChannel, tp.getMessage(), tp.getThrowable());
    }

    /**
     * Format and write the message according to the {@code MESSAGE_TEMPLATE}.
     *
     * @param messageChannel log level
     * @param message The message itself
     * @param t The exception whose stack trace should be logged
     */
    private void log(MessageChannel messageChannel, String message, Throwable t) {
        plugin.message(messageChannel, message, t, keys);
    }
}
