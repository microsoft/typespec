// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
 *     Harry Terkelsen (het@google.com) - Bug 449262 - Allow the use of third-party Java formatters
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.formatter.CodeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Factory for creating various compiler tools, such as scanners, parsers and compilers. <p> This class provides static
 * methods only. </p>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 * @noextend This class is not intended to be subclassed by clients.
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public abstract class ToolFactory {

    /**
     * Create an instance of the built-in code formatter. <p>The given options should at least provide the source level
     * (<code>org.eclipse.jdt.core.compiler.source</code>), the compiler compliance level
     * (<code>org.eclipse.jdt.core.compiler.compliance</code>) and the target platform
     * (<code>org.eclipse.jdt.core.compiler.codegen.targetPlatform</code>). Without these options, it is not possible
     * for the code formatter to know what kind of source it needs to format. </p><p> Formatting newly generated code
     * always indents first-column comments. </p>
     *
     * @param options - the options map to use for formatting with the default code formatter. Recognized options are
     * the standard Eclipse JDT formatter and compiler option keys. The generator supplies a non-null profile.
     * @return an instance of the built-in code formatter
     * @see CodeFormatter
     * @since 3.0
     */
    public static CodeFormatter createCodeFormatter(Map<String, String> options) {
        Map<String, String> currentOptions = new HashMap<>(options);
        currentOptions.put("org.eclipse.jdt.core.formatter.format_line_comment_starting_on_first_column", "true");
        currentOptions.put("org.eclipse.jdt.core.formatter.never_indent_block_comments_on_first_column", "false");
        currentOptions.put("org.eclipse.jdt.core.formatter.never_indent_line_comments_on_first_column", "false");
        return new CodeFormatter(currentOptions);
    }

}
