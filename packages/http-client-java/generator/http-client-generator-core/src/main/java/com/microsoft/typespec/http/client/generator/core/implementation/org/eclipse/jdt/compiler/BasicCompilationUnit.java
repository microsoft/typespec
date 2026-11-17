// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2017 IBM Corporation and others.
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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

/**
 * A compilation unit, providing its name and content.
 */
public class BasicCompilationUnit {
    protected final char[] contents;

    protected final char[] fileName;

    protected char[] mainTypeName;

    public BasicCompilationUnit(char[] contents, String fileName) {
        this.contents = contents;
        this.fileName = fileName.toCharArray();

    }

    public char[] getContents() {
        return this.contents;
    }

    public char[] getFileName() {
        return this.fileName;
    }

    public char[] getMainTypeName() {
        if (this.mainTypeName == null) {
            int start = CharOperation.lastIndexOf('/', this.fileName) + 1;
            if (start == 0 || start < CharOperation.lastIndexOf('\\', this.fileName))
                start = CharOperation.lastIndexOf('\\', this.fileName) + 1;
            int separator = CharOperation.lastIndexOf('|', this.fileName) + 1;
            if (separator > start) // case of a .class file in a default package in a jar
                start = separator;

            int end = CharOperation.lastIndexOf('$', this.fileName);
            if (end == -1 || !Util.isClassFileName(this.fileName)) {
                end = CharOperation.lastIndexOf('.', this.fileName);
                if (end == -1)
                    end = this.fileName.length;
            }

            this.mainTypeName = CharOperation.subarray(this.fileName, start, end);
        }
        return this.mainTypeName;
    }

}
