// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2024 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation  - initial API and implementation
 *     Brock Janiczak   - Contribution for bug 150741
 *     Ray V. (voidstar@gmail.com) - Contribution for bug 282988
 *     Jesper S Moller - Contribution for bug 402173
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Formatter does not format Java code correctly, especially when max line width is set - https://bugs.eclipse.org/303519
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.formatter;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.formatter.DefaultCodeFormatterOptions;
import java.util.Map;

/**
 * Constants used to set up the options of the code formatter.
 *
 * @since 3.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 * @noextend This class is not intended to be subclassed by clients.
 */
public abstract class DefaultCodeFormatterConstants {

    /**
     * <pre>
     * FORMATTER / Option to specify whether the formatter can join text lines in comments or not
     *
     * For example, the following comment:
     * //$NON-NLS-1$
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     *
     * /**
     * Returns the settings according to the Java conventions.
     *
     * @return the settings according to the Java conventions
     * @since 3.0
     */
    public static Map<String, String> getJavaConventionsSettings() {
        return DefaultCodeFormatterOptions.getJavaConventionsSettings().getMap();
    }
}
