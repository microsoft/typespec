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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.env.ICompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;
import java.io.File;
import java.io.IOException;

/**
 * A basic implementation of <code>ICompilationUnit</code> for use in the <code>SourceMapper</code>.
 *
 * @see ICompilationUnit
 */
public class BasicCompilationUnit implements ICompilationUnit {
    protected final char[] contents;

    // Note that if this compiler ICompilationUnit's content is known in advance, the fileName is not used to retrieve
    // this content.
    protected final char[] fileName;

    protected char[] mainTypeName;

    public BasicCompilationUnit(char[] contents, String fileName) {
        this.contents = contents;
        this.fileName = fileName.toCharArray();

    }

    @Override
    public char[] getContents() {
        if (this.contents != null)
            return this.contents;   // answer the cached source

        // otherwise retrieve it
        try {
            return Util.getFileCharContent(new File(new String(this.fileName)), ((String) null));
        } catch (IOException e) {
            // could not read file: returns an empty array
        }
        return CharOperation.NO_CHAR;
    }

    /**
     */
    @Override
    public char[] getFileName() {
        return this.fileName;
    }

    @Override
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

    @Override
    public String toString() {
        return "CompilationUnit: " + new String(this.fileName); //$NON-NLS-1$
    }

}
