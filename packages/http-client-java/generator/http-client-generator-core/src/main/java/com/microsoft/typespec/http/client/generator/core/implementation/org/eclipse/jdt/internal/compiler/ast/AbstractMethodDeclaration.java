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
 *     IBM Corporation - initial API and implementation
 *     Stephan Herrmann - Contributions for
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 367203 - [compiler][null] detect assigning null to nonnull argument
 *								bug 365519 - editorial cleanup after bug 186342 and bug 365387
 *								bug 365531 - [compiler][null] investigate alternative strategy for internally encoding nullness defaults
 *								bug 382353 - [1.8][compiler] Implementation property modifiers should be accepted on default methods.
 *								bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								bug 388281 - [compiler][null] inheritance of null annotations as an option
 *								bug 401030 - [1.8][null] Null analysis support for lambda methods.
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 403216 - [1.8][null] TypeReference#captureTypeAnnotations treats type annotations as type argument annotations
 *								Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 435570 - [1.8][null] @NonNullByDefault illegally tries to affect "throws E"
 *								Bug 435805 - [1.8][compiler][null] Java 8 compiler does not recognize declaration style null annotations
 *								Bug 466713 - Null Annotations: NullPointerException using <int @Nullable []> as Type Param
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.ReferenceContext;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Parser;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortMethod;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortType;

@SuppressWarnings({ "rawtypes" })
public abstract class AbstractMethodDeclaration extends ASTNode implements ReferenceContext {

    // it is not relevent for constructor but it helps to have the name of the constructor here
    // which is always the name of the class.....parsing do extra work to fill it up while it do not have to....
    public char[] selector;
    public int declarationSourceStart;
    public int declarationSourceEnd;
    public int modifiers;
    public Annotation[] annotations;
    // jsr 308
    public Receiver receiver;
    public Argument[] arguments;
    public TypeReference[] thrownExceptions;
    public Statement[] statements;
    public int explicitDeclarations;

    public boolean ignoreFurtherInvestigation = false;

    public Javadoc javadoc;

    public int bodyStart;
    public int bodyEnd = -1;
    public CompilationResult compilationResult;

    AbstractMethodDeclaration(CompilationResult compilationResult) {
        this.compilationResult = compilationResult;
    }

    /*
     * We cause the compilation task to abort to a given extent.
     */
    @Override
    public void abort(int abortLevel, IProblem problem) {
        switch (abortLevel) {
            case 2:
                throw new AbortCompilation(this.compilationResult, problem);

            case 4:
                throw new AbortCompilationUnit(this.compilationResult, problem);

            case 8:
                throw new AbortType(this.compilationResult, problem);

            default:
                throw new AbortMethod(this.compilationResult, problem);
        }
    }

    @Override
    public CompilationResult compilationResult() {
        return this.compilationResult;
    }

    @Override
    public CompilationUnitDeclaration getCompilationUnitDeclaration() {

        return null;
    }

    @Override
    public boolean hasErrors() {
        return this.ignoreFurtherInvestigation;
    }

    public boolean isAbstract() {

        return (this.modifiers & 1024) != 0;
    }

    public boolean isAnnotationMethod() {
        return false;
    }

    public boolean isClinit() {
        return false;
    }

    public boolean isConstructor() {
        return false;
    }

    public boolean isCompactConstructor() {
        return false;
    }

    public boolean isDefaultConstructor() {
        return false;
    }

    public boolean isNative() {

        return (this.modifiers & 256) != 0;
    }

    public boolean isStatic() {

        return (this.modifiers & 8) != 0;
    }

    /**
     * Fill up the method body with statement
     */
    public abstract void parseStatements(Parser parser, CompilationUnitDeclaration unit);

    @Override
    public StringBuilder print(int tab, StringBuilder output) {
        if (this.javadoc != null) {
            this.javadoc.print(tab, output);
        }
        printIndent(tab, output);
        printModifiers(this.modifiers, output);
        if (this.annotations != null) {
            printAnnotations(this.annotations, output);
            output.append(' ');
        }

        TypeParameter[] typeParams = typeParameters();
        if (typeParams != null) {
            output.append('<');
            int max = typeParams.length - 1;
            for (int j = 0; j < max; j++) {
                typeParams[j].print(0, output);
                output.append(", ");//$NON-NLS-1$
            }
            typeParams[max].print(0, output);
            output.append('>');
        }

        printReturnType(output).append(this.selector);
        if (!this.isCompactConstructor())
            output.append('(');
        if (this.receiver != null) {
            this.receiver.print(0, output);
        }
        if (this.arguments != null) {
            for (int i = 0; i < this.arguments.length; i++) {
                if (i > 0 || this.receiver != null)
                    output.append(", "); //$NON-NLS-1$
                this.arguments[i].print(0, output);
            }
        }
        if (!this.isCompactConstructor())
            output.append(')');
        if (this.thrownExceptions != null) {
            output.append(" throws "); //$NON-NLS-1$
            for (int i = 0; i < this.thrownExceptions.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.thrownExceptions[i].print(0, output);
            }
        }
        printBody(tab + 1, output);
        return output;
    }

    public StringBuilder printBody(int indent, StringBuilder output) {
        if (isAbstract() || (this.modifiers & 16777216) != 0)
            return output.append(';');

        output.append(" {"); //$NON-NLS-1$
        if (this.statements != null) {
            for (Statement statement : this.statements) {
                output.append('\n');
                statement.printStatement(indent, output);
            }
        }
        output.append('\n');
        printIndent(indent == 0 ? 0 : indent - 1, output).append('}');
        return output;
    }

    public StringBuilder printReturnType(StringBuilder output) {
        return output;
    }

    @Override
    public void tagAsHavingErrors() {
        this.ignoreFurtherInvestigation = true;
    }

    public abstract void traverse(ASTVisitor visitor);

    public TypeParameter[] typeParameters() {
        return null;
    }
}
