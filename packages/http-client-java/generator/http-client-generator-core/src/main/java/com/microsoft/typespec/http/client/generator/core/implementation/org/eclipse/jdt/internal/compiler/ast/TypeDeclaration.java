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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.ReferenceContext;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.ClassScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.CompilationUnitScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Parser;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortMethod;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortType;
import java.util.HashSet;
import java.util.Set;

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

    public MethodScope staticInitializerScope;
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

    // 16 Records support
    public RecordComponent[] recordComponents = NO_RECORD_COMPONENTS;
    public static Set<String> disallowedComponentNames;

    // 17 Sealed Type support
    public TypeReference[] permittedTypes;

    static {
        disallowedComponentNames = new HashSet<>(9);
        disallowedComponentNames.add("clone"); //$NON-NLS-1$
        disallowedComponentNames.add("finalize"); //$NON-NLS-1$
        disallowedComponentNames.add("getClass"); //$NON-NLS-1$
        disallowedComponentNames.add("hashCode"); //$NON-NLS-1$
        disallowedComponentNames.add("notify");   //$NON-NLS-1$
        disallowedComponentNames.add("notifyAll");//$NON-NLS-1$
        disallowedComponentNames.add("toString"); //$NON-NLS-1$
        disallowedComponentNames.add("wait"); //$NON-NLS-1$
        disallowedComponentNames.add("this"); //$NON-NLS-1$
    }

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
                throw new AbortCompilation(this.compilationResult, problem);

            case 4:
                throw new AbortCompilationUnit(this.compilationResult, problem);

            case 16:
                throw new AbortMethod(this.compilationResult, problem);

            default:
                throw new AbortType(this.compilationResult, problem);
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
                length = 0;
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
    public CompilationUnitDeclaration getCompilationUnitDeclaration() {

        return null;
    }

    @Override
    public boolean hasErrors() {
        return this.ignoreFurtherInvestigation;
    }

    public final static int kind(int flags) {
        switch (flags & (512 | 8192 | 16384 | 16777216)) {
            case 512:
                return 2;

            case 512 | 8192:
                return 4;

            case 16384:
                return 3;

            case 16777216:
                return 5;

            default:
                return 1;
        }
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
        // connect method bodies
        if (unit.ignoreMethodBodies)
            return;

        // members
        if (this.memberTypes != null) {
            int length = this.memberTypes.length;
            for (int i = 0; i < length; i++) {
                TypeDeclaration typeDeclaration = this.memberTypes[i];
                typeDeclaration.parseMethods(parser, unit);
                this.bits |= (typeDeclaration.bits & 524288);
            }
        }

        // methods
        if (this.methods != null) {
            int length = this.methods.length;
            for (int i = 0; i < length; i++) {
                AbstractMethodDeclaration abstractMethodDeclaration = this.methods[i];
                abstractMethodDeclaration.parseStatements(parser, unit);
                this.bits |= (abstractMethodDeclaration.bits & 524288);
            }
        }

        // initializers
        if (this.fields != null) {
            int length = this.fields.length;
            for (int i = 0; i < length; i++) {
                final FieldDeclaration fieldDeclaration = this.fields[i];
                switch (fieldDeclaration.getKind()) {
                    case 2:
                        ((Initializer) fieldDeclaration).parseStatements(parser, this, unit);
                        this.bits |= (fieldDeclaration.bits & 524288);
                        break;
                }
            }
        }
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        if (this.javadoc != null) {
            this.javadoc.print(indent, output);
        }
        if ((this.bits & 512) == 0) {
            printIndent(indent, output);
            printHeader(output);
        }
        return printBody(indent, output);
    }

    public StringBuilder printBody(int indent, StringBuilder output) {
        output.append(" {"); //$NON-NLS-1$
        if (this.memberTypes != null) {
            for (TypeDeclaration memberType : this.memberTypes) {
                if (memberType != null) {
                    output.append('\n');
                    memberType.print(indent + 1, output);
                }
            }
        }
        if (this.fields != null) {
            for (FieldDeclaration field : this.fields) {
                if (field != null) {
                    output.append('\n');
                    field.print(indent + 1, output);
                }
            }
        }
        if (this.methods != null) {
            for (AbstractMethodDeclaration method : this.methods) {
                if (method != null) {
                    output.append('\n');
                    method.print(indent + 1, output);
                }
            }
        }
        output.append('\n');
        return printIndent(indent, output).append('}');
    }

    public StringBuilder printHeader(StringBuilder output) {

        printModifiers(this.modifiers, output);
        if (this.annotations != null) {
            printAnnotations(this.annotations, output);
            output.append(' ');
        }

        switch (kind(this.modifiers)) {
            case 1:
                output.append("class "); //$NON-NLS-1$
                break;

            case 2:
                output.append("interface "); //$NON-NLS-1$
                break;

            case 3:
                output.append("enum "); //$NON-NLS-1$
                break;

            case 4:
                output.append("@interface "); //$NON-NLS-1$
                break;

            case 5:
                output.append("record "); //$NON-NLS-1$
                break;
        }
        output.append(this.name);
        if (this.isRecord()) {
            output.append('(');
            for (int i = 0, length = this.recordComponents.length; i < length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.recordComponents[i].print(0, output);
            }
            output.append(')');
        }
        if (this.typeParameters != null) {
            output.append("<");//$NON-NLS-1$
            for (int i = 0; i < this.typeParameters.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.typeParameters[i].print(0, output);
            }
            output.append(">");//$NON-NLS-1$
        }

        if (!this.isRecord() && this.superclass != null) {
            output.append(" extends ");  //$NON-NLS-1$
            this.superclass.print(0, output);
        }
        if (this.superInterfaces != null && this.superInterfaces.length > 0) {
            switch (kind(this.modifiers)) {
                case 1:
                case 3:
                case 5:
                    output.append(" implements "); //$NON-NLS-1$
                    break;

                case 2:
                case 4:
                    output.append(" extends "); //$NON-NLS-1$
                    break;
            }
            for (int i = 0; i < this.superInterfaces.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.superInterfaces[i].print(0, output);
            }
        }
        if (this.permittedTypes != null && this.permittedTypes.length > 0) {
            output.append(" permits "); //$NON-NLS-1$
            for (int i = 0; i < this.permittedTypes.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.permittedTypes[i].print(0, output);
            }
        }
        return output;
    }

    @Override
    public StringBuilder printStatement(int tab, StringBuilder output) {
        return print(tab, output);
    }

    @Override
    public void tagAsHavingErrors() {
        this.ignoreFurtherInvestigation = true;
    }

    /**
     * Iteration for a package member type
     */
    public void traverse(ASTVisitor visitor) {
        try {
            if (visitor.visit(this, ((CompilationUnitScope) null))) {
                if (this.javadoc != null) {
                    this.javadoc.traverse(visitor);
                }
                if (this.annotations != null) {
                    int annotationsLength = this.annotations.length;
                    for (int i = 0; i < annotationsLength; i++)
                        this.annotations[i].traverse(visitor, this.staticInitializerScope);
                }
                if (this.superclass != null)
                    this.superclass.traverse(visitor);
                if (this.superInterfaces != null) {
                    int length = this.superInterfaces.length;
                    for (int i = 0; i < length; i++)
                        this.superInterfaces[i].traverse(visitor);
                }
                if (this.permittedTypes != null) {
                    int length = this.permittedTypes.length;
                    for (int i = 0; i < length; i++)
                        this.permittedTypes[i].traverse(visitor);
                }
                if (this.typeParameters != null) {
                    int length = this.typeParameters.length;
                    for (int i = 0; i < length; i++) {
                        this.typeParameters[i].traverse(visitor);
                    }
                }

                for (RecordComponent component : this.recordComponents)
                    component.traverse(visitor, ((MethodScope) null));

                if (this.memberTypes != null) {
                    int length = this.memberTypes.length;
                    for (int i = 0; i < length; i++)
                        this.memberTypes[i].traverse(visitor, ((ClassScope) null));
                }
                if (this.fields != null) {
                    int length = this.fields.length;
                    for (int i = 0; i < length; i++) {
                        FieldDeclaration field;
                        if ((field = this.fields[i]).isStatic()) {
                            field.traverse(visitor);
                        } else {
                            field.traverse(visitor);
                        }
                    }
                }
                if (this.methods != null) {
                    int length = this.methods.length;
                    for (int i = 0; i < length; i++)
                        this.methods[i].traverse(visitor);
                }
            }
            java.util.Objects.requireNonNull(visitor);
        } catch (AbortType e) {
            // silent abort
        }
    }

    /**
     * Iteration for a local inner type
     */
    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        try {
            if (visitor.visit(this, blockScope)) {
                if (this.javadoc != null) {
                    this.javadoc.traverse(visitor);
                }
                if (this.annotations != null) {
                    int annotationsLength = this.annotations.length;
                    for (int i = 0; i < annotationsLength; i++)
                        this.annotations[i].traverse(visitor, this.staticInitializerScope);
                }
                if (this.superclass != null)
                    this.superclass.traverse(visitor);
                if (this.superInterfaces != null) {
                    int length = this.superInterfaces.length;
                    for (int i = 0; i < length; i++)
                        this.superInterfaces[i].traverse(visitor);
                }
                if (this.permittedTypes != null) {
                    int length = this.permittedTypes.length;
                    for (int i = 0; i < length; i++)
                        this.permittedTypes[i].traverse(visitor);
                }
                if (this.typeParameters != null) {
                    int length = this.typeParameters.length;
                    for (int i = 0; i < length; i++) {
                        this.typeParameters[i].traverse(visitor);
                    }
                }

                for (RecordComponent component : this.recordComponents)
                    component.traverse(visitor, ((MethodScope) null));

                if (this.memberTypes != null) {
                    int length = this.memberTypes.length;
                    for (int i = 0; i < length; i++)
                        this.memberTypes[i].traverse(visitor, ((ClassScope) null));
                }
                if (this.fields != null) {
                    int length = this.fields.length;
                    for (int i = 0; i < length; i++) {
                        FieldDeclaration field = this.fields[i];
                        if (field.isStatic() && !field.isFinal()) {
                            // local type cannot have static fields that are not final,
                            // https://bugs.eclipse.org/bugs/show_bug.cgi?id=244544
                        } else {
                            field.traverse(visitor);
                        }
                    }
                }
                if (this.methods != null) {
                    int length = this.methods.length;
                    for (int i = 0; i < length; i++)
                        this.methods[i].traverse(visitor);
                }
            }
            visitor.endVisit();
        } catch (AbortType e) {
            // silent abort
        }
    }

    /**
     * Iteration for a member innertype
     */
    public void traverse(ASTVisitor visitor, ClassScope classScope) {
        try {
            if (visitor.visit(this, classScope)) {
                if (this.javadoc != null) {
                    this.javadoc.traverse(visitor);
                }
                if (this.annotations != null) {
                    int annotationsLength = this.annotations.length;
                    for (int i = 0; i < annotationsLength; i++)
                        this.annotations[i].traverse(visitor, this.staticInitializerScope);
                }
                if (this.superclass != null)
                    this.superclass.traverse(visitor);
                if (this.superInterfaces != null) {
                    int length = this.superInterfaces.length;
                    for (int i = 0; i < length; i++)
                        this.superInterfaces[i].traverse(visitor);
                }
                if (this.permittedTypes != null) {
                    int length = this.permittedTypes.length;
                    for (int i = 0; i < length; i++)
                        this.permittedTypes[i].traverse(visitor);
                }
                if (this.typeParameters != null) {
                    int length = this.typeParameters.length;
                    for (int i = 0; i < length; i++) {
                        this.typeParameters[i].traverse(visitor);
                    }
                }

                for (RecordComponent component : this.recordComponents)
                    component.traverse(visitor, ((MethodScope) null));

                if (this.memberTypes != null) {
                    int length = this.memberTypes.length;
                    for (int i = 0; i < length; i++)
                        this.memberTypes[i].traverse(visitor, ((ClassScope) null));
                }
                if (this.fields != null) {
                    int length = this.fields.length;
                    for (int i = 0; i < length; i++) {
                        FieldDeclaration field;
                        if ((field = this.fields[i]).isStatic()) {
                            field.traverse(visitor);
                        } else {
                            field.traverse(visitor);
                        }
                    }
                }
                if (this.methods != null) {
                    int length = this.methods.length;
                    for (int i = 0; i < length; i++)
                        this.methods[i].traverse(visitor);
                }
            }
            visitor.endVisit(this, classScope);
        } catch (AbortType e) {
            // silent abort
        }
    }

}
