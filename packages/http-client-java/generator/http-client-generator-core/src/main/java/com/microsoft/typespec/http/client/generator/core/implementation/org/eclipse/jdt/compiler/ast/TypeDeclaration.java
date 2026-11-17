// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
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
 *     Stephan Herrmann - Contributions for
 *								Bug 360328 - [compiler][null] detect null problems in nested code (local class inside a loop)
 *								Bug 388630 - @NonNull diagnostics at line 0
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 416176 - [1.8][compiler][null] null type annotations cause grief on type variables
 *								Bug 424727 - [compiler][null] NullPointerException in nullAnnotationUnsupportedLocation(ProblemHandler.java:5708)
 *								Bug 457210 - [1.8][compiler][null] Wrong Nullness errors given on full build build but not on incremental build?
 *     Keigo Imai - Contribution for  bug 388903 - Cannot extend inner class as an anonymous class when it extends the outer class
 *    Pierre-Yves B. <pyvesdev@gmail.com> - Contributions for
 *                              Bug 542520 - [JUnit 5] Warning The method xxx from the type X is never used locally is shown when using MethodSource
 *                              Bug 546084 - Using Junit 5s MethodSource leads to ClassCastException
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.AbortCompilation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.AbortCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.AbortMethod;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.AbortType;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ReferenceContext;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Parser;

public class TypeDeclaration extends Statement implements ReferenceContext {

    public int modifiers = 0;
    public int modifiersSourceStart;

    public Annotation[] annotations;
    public char[] name;
    public TypeReference superclass;
    public TypeReference[] superInterfaces;
    public FieldDeclaration[] fields;
    public AbstractMethodDeclaration[] methods;
    public TypeDeclaration[] memberTypes;

    public boolean ignoreFurtherInvestigation = false;

    public int declarationSourceStart;
    public int declarationSourceEnd;
    public int restrictedIdentifierStart = -1; // used only for record and permits restricted keywords.
    public int bodyStart;
    public int bodyEnd; // doesn't include the trailing comment if any.
    public CompilationResult compilationResult;

    public Javadoc javadoc;

    public QualifiedAllocationExpression allocation; // for anonymous only

    // 1.5 support
    public TypeParameter[] typeParameters;

    // 17 Sealed Type support
    public TypeReference[] permittedTypes;

    public TypeDeclaration(CompilationResult compilationResult) {
        this.compilationResult = compilationResult;
    }

    /*
     * We cause the compilation task to abort to a given extent.
     */
    @Override
    public void abort(int abortLevel, IProblem problem) {
        switch (abortLevel) {
            case 2:
                throw new AbortCompilation(problem);

            case 4:
                throw new AbortCompilationUnit(problem);

            case 16:
                throw new AbortMethod(problem);

            default:
                throw new AbortType(problem);
        }
    }

    /**
     * This method is responsible for adding a {@code <clinit>} method declaration to the type method collections. Note
     * that this implementation is inserting it in first place (as VAJ or javac).
     *
     */
    public final void addClinit() {
        // see comment on needClassInitMethod
        if (needClassInitMethod()) {
            int length;
            AbstractMethodDeclaration[] methodDeclarations;
            if ((methodDeclarations = this.methods) == null) {
                methodDeclarations = new AbstractMethodDeclaration[1];
            } else {
                length = methodDeclarations.length;
                System.arraycopy(methodDeclarations, 0,
                    (methodDeclarations = new AbstractMethodDeclaration[length + 1]), 1, length);
            }
            Clinit clinit = new Clinit(this.compilationResult);
            methodDeclarations[0] = clinit;
            // clinit is added in first location, so as to minimize the use of ldcw (big consumer of constant inits)
            clinit.declarationSourceStart = clinit.sourceStart = this.sourceStart;
            clinit.declarationSourceEnd = clinit.sourceEnd = this.sourceEnd;
            clinit.bodyEnd = this.sourceEnd;
            this.methods = methodDeclarations;
        }
    }

    /**
     * Check for constructor vs. method with no return type. Answers true if at least one constructor is defined
     */
    public boolean checkConstructors(Parser parser) {
        // if a constructor has not the name of the type,
        // convert it into a method with 'null' as its return type
        boolean hasConstructor = false;
        if (this.methods != null) {
            for (int i = this.methods.length; --i >= 0;) {
                AbstractMethodDeclaration am;
                if ((am = this.methods[i]).isConstructor()) {
                    if (!CharOperation.equals(am.selector, this.name)) {
                        // the constructor was in fact a method with no return type
                        // unless an explicit constructor call was supplied
                        ConstructorDeclaration c = (ConstructorDeclaration) am;
                        if (c.constructorCall == null || c.constructorCall.isImplicitSuper()) { // changed to a method
                            MethodDeclaration m = parser.convertToMethodDeclaration(c, this.compilationResult);
                            this.methods[i] = m;
                        }
                    } else {
                        switch (kind(this.modifiers)) {
                            case 2:
                                // report the problem and continue the parsing
                                parser.problemReporter().interfaceCannotHaveConstructors((ConstructorDeclaration) am);
                                break;

                            case 4:
                                // report the problem and continue the parsing
                                parser.problemReporter()
                                    .annotationTypeDeclarationCannotHaveConstructor((ConstructorDeclaration) am);
                                break;

                        }
                        hasConstructor = true;
                    }
                }
            }
        }
        return hasConstructor;
    }

    @Override
    public CompilationResult compilationResult() {
        return this.compilationResult;
    }

    public ConstructorDeclaration createDefaultConstructor(boolean needExplicitConstructorCall) {
        // Add to method'set, the default constuctor that just recall the
        // super constructor with no arguments
        // The arguments' type will be positionned by the TC so just use
        // the default int instead of just null (consistency purpose)

        // the constructor
        ConstructorDeclaration constructor = new ConstructorDeclaration(this.compilationResult);
        constructor.bits |= 128;
        constructor.selector = this.name;
        constructor.modifiers = this.modifiers & 7;

        constructor.declarationSourceStart = constructor.sourceStart = this.sourceStart;
        constructor.declarationSourceEnd = constructor.sourceEnd = constructor.bodyEnd = this.sourceEnd;

        // the super call inside the constructor
        if (needExplicitConstructorCall) {
            constructor.constructorCall = SuperReference.implicitSuperConstructorCall();
            constructor.constructorCall.sourceStart = this.sourceStart;
            constructor.constructorCall.sourceEnd = this.sourceEnd;
        }

        // adding the constructor in the methods list: rank is not critical since bindings will be sorted
        if (this.methods == null) {
            this.methods = new AbstractMethodDeclaration[] { constructor };
        } else {
            AbstractMethodDeclaration[] newMethods;
            System.arraycopy(this.methods, 0, newMethods = new AbstractMethodDeclaration[this.methods.length + 1], 1,
                this.methods.length);
            newMethods[0] = constructor;
            this.methods = newMethods;
        }
        return constructor;
    }

    @Override
    public boolean hasErrors() {
        return this.ignoreFurtherInvestigation;
    }

    public static int kind(int flags) {
        return switch (flags & (512 | 8192 | 16384 | 16777216)) {
            case 512 -> 2;
            case 512 | 8192 -> 4;
            case 16384 -> 3;
            case 16777216 -> 5;
            default -> 1;
        };
    }

    public boolean isRecord() {
        return (this.modifiers & 16777216) != 0;
    }

    /**
     * A {@code <clinit>} will be requested as soon as static fields or assertions are present. It will be eliminated
     * during classfile creation if no bytecode was actually produced based on some optimizations/compiler settings.
     */
    public final boolean needClassInitMethod() {
        // always need a <clinit> when assertions are present
        if ((this.bits & 1) != 0)
            return true;

        switch (kind(this.modifiers)) {
            case 2:
            case 4:
                return this.fields != null; // fields are implicitly statics

            case 3:
                return true; // even if no enum constants, need to set $VALUES array
        }
        if (this.fields != null) {
            for (int i = this.fields.length; --i >= 0;) {
                FieldDeclaration field = this.fields[i];
                // need to test the modifier directly while there is no binding yet
                if ((field.modifiers & 8) != 0)
                    return true; // TODO (philippe) shouldn't it check whether field is initializer or has some initial
                // value ?
            }
        }
        return false;
    }

    public void parseMethods(Parser parser, CompilationUnitDeclaration unit) {
        // members
        if (this.memberTypes != null) {
            for (TypeDeclaration typeDeclaration : this.memberTypes) {
                typeDeclaration.parseMethods(parser, unit);
                this.bits |= (typeDeclaration.bits & 524288);
            }
        }

        // methods
        if (this.methods != null) {
            for (AbstractMethodDeclaration abstractMethodDeclaration : this.methods) {
                abstractMethodDeclaration.parseStatements(parser, unit);
                this.bits |= (abstractMethodDeclaration.bits & 524288);
            }
        }

        // initializers
        if (this.fields != null) {
            for (final FieldDeclaration fieldDeclaration : this.fields) {
                if (fieldDeclaration.getKind() == 2) {
                    ((Initializer) fieldDeclaration).parseStatements(parser, this, unit);
                    this.bits |= (fieldDeclaration.bits & 524288);
                }
            }
        }
    }

    @Override
    public void tagAsHavingErrors() {
        this.ignoreFurtherInvestigation = true;
    }

}
