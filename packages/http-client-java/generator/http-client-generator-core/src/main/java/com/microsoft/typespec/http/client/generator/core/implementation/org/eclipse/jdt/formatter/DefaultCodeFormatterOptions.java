// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2023 IBM Corporation and others.
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
 *     Brock Janiczak - Contribution for bug 150741
 *     Ray V. (voidstar@gmail.com) - Contribution for bug 282988
 *     Jesper S Moller - Contribution for bug 402173
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Formatter does not format Java code correctly, especially when max line width is set - https://bugs.eclipse.org/303519
 *     Lars Vogel <Lars.Vogel@vogella.com> - Contributions for
 *     						Bug 473178
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

/**
 * Formatter options that are not fixed. The formatter applies the Azure SDK for Java formatter profile,
 * {@code generator/eclipse-format-azure-sdk-for-java.xml}, with its option values written directly into the code; only
 * the line widths change, for code formatted inside comments.
 *
 * @since 3.0
 */
public class DefaultCodeFormatterOptions implements Cloneable {

    public int comment_line_length = 120;
    public int page_width = 120;

    /**
     * Returns a copy of these options, used to format code nested in comments.
     */
    @Override
    public DefaultCodeFormatterOptions clone() {
        try {
            return (DefaultCodeFormatterOptions) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError(e);
        }
    }
}
