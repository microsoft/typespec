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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.ScannerHelper;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.core.dom.util.DOMASTUtil;
import java.util.Iterator;
import java.util.List;

/**
 * Internal AST visitor for serializing an AST in a quick and dirty fashion. For various reasons the resulting string is
 * not necessarily legal Java code; and even if it is legal Java code, it is not necessarily the string that corresponds
 * to the given AST. Although useless for most purposes, it's fine for generating debug print strings. <p> Example
 * usage:
 *
 * <pre>
 * {
 *     &#64;code
 *     NaiveASTFlattener p = new NaiveASTFlattener();
 *     node.accept(p);
 *     String result = p.getResult();
 * }
 * </pre>
 *
 * Call the <code>reset</code> method to clear the previous result before reusing an existing instance.
 *
 * @since 2.0
 */
@SuppressWarnings("rawtypes")
public class NaiveASTFlattener extends ASTVisitor {

    /**
     * The string buffer into which the serialized representation of the AST is written.
     */
    protected StringBuilder buffer;

    private int indent = 0;

    /**
     * Creates a new AST printer.
     */
    public NaiveASTFlattener() {
        this.buffer = new StringBuilder();
    }

    /**
     * Internal synonym for {@link ClassInstanceCreation#getName()}. Use to alleviate deprecation warnings.
     *
     * @deprecated
     * @since 3.4
     */
    private Name getName(ClassInstanceCreation node) {
        return node.getName();
    }

    /**
     * Returns the string accumulated in the visit.
     *
     * @return the serialized
     */
    public String getResult() {
        return this.buffer.toString();
    }

    /**
     * Internal synonym for {@link MethodDeclaration#getReturnType()}. Use to alleviate deprecation warnings.
     *
     * @deprecated
     * @since 3.4
     */
    private static Type getReturnType(MethodDeclaration node) {
        return node.getReturnType();
    }

    /**
     * Internal synonym for {@link TypeDeclaration#getSuperclass()}. Use to alleviate deprecation warnings.
     *
     * @deprecated
     * @since 3.4
     */
    private static Name getSuperclass(TypeDeclaration node) {
        return node.getSuperclass();
    }

    /**
     * Internal synonym for {@link TypeDeclarationStatement#getTypeDeclaration()}. Use to alleviate deprecation
     * warnings.
     *
     * @deprecated
     * @since 3.4
     */
    private static TypeDeclaration getTypeDeclaration(TypeDeclarationStatement node) {
        return node.getTypeDeclaration();
    }

    /**
     * Internal synonym for {@link MethodDeclaration#thrownExceptions()}. Use to alleviate deprecation warnings.
     *
     * @deprecated
     * @since 3.10
     */
    private static List thrownExceptions(MethodDeclaration node) {
        return node.thrownExceptions();
    }

    void printIndent() {
        for (int i = 0; i < this.indent; i++)
            this.buffer.append("  "); //$NON-NLS-1$
    }

    /**
     * Appends the text representation of the given modifier flags, followed by a single space. Used for JLS2 modifiers.
     *
     * @param modifiers the modifier flags
     */
    void printModifiers(int modifiers) {
        if (Modifier.isPublic(modifiers)) {
            this.buffer.append("public ");//$NON-NLS-1$
        }
        if (Modifier.isProtected(modifiers)) {
            this.buffer.append("protected ");//$NON-NLS-1$
        }
        if (Modifier.isPrivate(modifiers)) {
            this.buffer.append("private ");//$NON-NLS-1$
        }
        if (Modifier.isStatic(modifiers)) {
            this.buffer.append("static ");//$NON-NLS-1$
        }
        if (Modifier.isAbstract(modifiers)) {
            this.buffer.append("abstract ");//$NON-NLS-1$
        }
        if (Modifier.isFinal(modifiers)) {
            this.buffer.append("final ");//$NON-NLS-1$
        }
        if (Modifier.isSynchronized(modifiers)) {
            this.buffer.append("synchronized ");//$NON-NLS-1$
        }
        if (Modifier.isVolatile(modifiers)) {
            this.buffer.append("volatile ");//$NON-NLS-1$
        }
        if (Modifier.isNative(modifiers)) {
            this.buffer.append("native ");//$NON-NLS-1$
        }
        if (Modifier.isStrictfp(modifiers)) {
            this.buffer.append("strictfp ");//$NON-NLS-1$
        }
        if (Modifier.isTransient(modifiers)) {
            this.buffer.append("transient ");//$NON-NLS-1$
        }
        if (Modifier.isSealed(modifiers)) {
            this.buffer.append("sealed ");//$NON-NLS-1$
        }
        if (Modifier.isNonSealed(modifiers)) {
            this.buffer.append("non-sealed ");//$NON-NLS-1$
        }
    }

    /**
     * Appends the text representation of the given modifier flags, followed by a single space. Used for 3.0 modifiers
     * and annotations.
     *
     * @param ext the list of modifier and annotation nodes (element type: <code>IExtendedModifier</code>)
     */
    void printModifiers(List ext) {
        for (Object element : ext) {
            ASTNode p = (ASTNode) element;
            p.accept(this);
            this.buffer.append(" ");//$NON-NLS-1$
        }
    }

    /**
     * reference node helper function that is common to all the difference reference nodes.
     *
     * @param typeArguments list of type arguments
     */
    private void visitReferenceTypeArguments(List typeArguments) {
        this.buffer.append("::");//$NON-NLS-1$
        if (!typeArguments.isEmpty()) {
            this.buffer.append('<');
            for (Iterator it = typeArguments.iterator(); it.hasNext();) {
                Type t = (Type) it.next();
                t.accept(this);
                if (it.hasNext()) {
                    this.buffer.append(',');
                }
            }
            this.buffer.append('>');
        }
    }

    private void visitTypeAnnotations(AnnotatableType node) {
        if (node.getAST().apiLevel() >= 8) {
            visitAnnotationsList(node.annotations());
        }
    }

    private void visitAnnotationsList(List annotations) {
        for (Object a : annotations) {
            Annotation annotation = (Annotation) a;
            annotation.accept(this);
            this.buffer.append(' ');
        }
    }

    /**
     * Internal synonym for {@link TypeDeclaration#superInterfaces()}. Use to alleviate deprecation warnings.
     *
     * @deprecated
     * @since 3.4
     */
    private List superInterfaces(TypeDeclaration node) {
        return node.superInterfaces();
    }

    @Override
    public boolean visit(AnnotationTypeDeclaration node) {
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }
        printIndent();
        printModifiers(node.modifiers());
        this.buffer.append("@interface ");//$NON-NLS-1$
        node.getName().accept(this);
        this.buffer.append(" {");//$NON-NLS-1$
        for (Object element : node.bodyDeclarations()) {
            BodyDeclaration d = (BodyDeclaration) element;
            d.accept(this);
        }
        this.buffer.append("}\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(AnnotationTypeMemberDeclaration node) {
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }
        printIndent();
        printModifiers(node.modifiers());
        node.getType().accept(this);
        this.buffer.append(" ");//$NON-NLS-1$
        node.getName().accept(this);
        this.buffer.append("()");//$NON-NLS-1$
        if (node.getDefault() != null) {
            this.buffer.append(" default ");//$NON-NLS-1$
            node.getDefault().accept(this);
        }
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(AnonymousClassDeclaration node) {
        this.buffer.append("{\n");//$NON-NLS-1$
        this.indent++;
        for (Object element : node.bodyDeclarations()) {
            BodyDeclaration b = (BodyDeclaration) element;
            b.accept(this);
        }
        this.indent--;
        printIndent();
        this.buffer.append("}\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ArrayAccess node) {
        node.getArray().accept(this);
        this.buffer.append("[");//$NON-NLS-1$
        node.getIndex().accept(this);
        this.buffer.append("]");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ArrayCreation node) {
        this.buffer.append("new ");//$NON-NLS-1$
        ArrayType at = node.getType();
        int dims = at.getDimensions();
        Type elementType = at.getElementType();
        elementType.accept(this);
        for (Object element : node.dimensions()) {
            this.buffer.append("[");//$NON-NLS-1$
            Expression e = (Expression) element;
            e.accept(this);
            this.buffer.append("]");//$NON-NLS-1$
            dims--;
        }
        // add empty "[]" for each extra array dimension
        for (int i = 0; i < dims; i++) {
            this.buffer.append("[]");//$NON-NLS-1$
        }
        if (node.getInitializer() != null) {
            node.getInitializer().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(ArrayInitializer node) {
        this.buffer.append("{");//$NON-NLS-1$
        for (Iterator it = node.expressions().iterator(); it.hasNext();) {
            Expression e = (Expression) it.next();
            e.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        this.buffer.append("}");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ArrayType node) {
        if (node.getAST().apiLevel() < 8) {
            visitComponentType(node);
            this.buffer.append("[]");//$NON-NLS-1$
        } else {
            node.getElementType().accept(this);
            List dimensions = node.dimensions();
            int size = dimensions.size();
            for (int i = 0; i < size; i++) {
                Dimension aDimension = (Dimension) dimensions.get(i);
                aDimension.accept(this);
            }
        }
        return false;
    }

    @Override
    public boolean visit(AssertStatement node) {
        printIndent();
        this.buffer.append("assert ");//$NON-NLS-1$
        node.getExpression().accept(this);
        if (node.getMessage() != null) {
            this.buffer.append(" : ");//$NON-NLS-1$
            node.getMessage().accept(this);
        }
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(Assignment node) {
        node.getLeftHandSide().accept(this);
        this.buffer.append(node.getOperator().toString());
        node.getRightHandSide().accept(this);
        return false;
    }

    @Override
    public boolean visit(Block node) {
        this.buffer.append("{\n");//$NON-NLS-1$
        this.indent++;
        for (Object element : node.statements()) {
            Statement s = (Statement) element;
            s.accept(this);
        }
        this.indent--;
        printIndent();
        this.buffer.append("}\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(BlockComment node) {
        printIndent();
        this.buffer.append("/* */");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(BooleanLiteral node) {
        if (node.booleanValue() == true) {
            this.buffer.append("true");//$NON-NLS-1$
        } else {
            this.buffer.append("false");//$NON-NLS-1$
        }
        return false;
    }

    @Override
    public boolean visit(BreakStatement node) {
        printIndent();
        this.buffer.append("break");//$NON-NLS-1$
        if (node.getLabel() != null) {
            this.buffer.append(" ");//$NON-NLS-1$
            node.getLabel().accept(this);
        }
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(CaseDefaultExpression node) {
        if (DOMASTUtil.isPatternSupported(node.getAST())) {
            this.buffer.append("default");//$NON-NLS-1$
        }
        return false;
    }

    @Override
    public boolean visit(CastExpression node) {
        this.buffer.append("(");//$NON-NLS-1$
        node.getType().accept(this);
        this.buffer.append(")");//$NON-NLS-1$
        node.getExpression().accept(this);
        return false;
    }

    @Override
    public boolean visit(CatchClause node) {
        this.buffer.append("catch (");//$NON-NLS-1$
        node.getException().accept(this);
        this.buffer.append(") ");//$NON-NLS-1$
        node.getBody().accept(this);
        return false;
    }

    @Override
    public boolean visit(CharacterLiteral node) {
        this.buffer.append(node.getEscapedValue());
        return false;
    }

    @Override
    public boolean visit(ClassInstanceCreation node) {
        if (node.getExpression() != null) {
            node.getExpression().accept(this);
            this.buffer.append(".");//$NON-NLS-1$
        }
        this.buffer.append("new ");//$NON-NLS-1$
        if (node.getAST().apiLevel() == 2) {
            getName(node).accept(this);
        }
        if (node.getAST().apiLevel() >= 3) {
            if (!node.typeArguments().isEmpty()) {
                this.buffer.append("<");//$NON-NLS-1$
                for (Iterator it = node.typeArguments().iterator(); it.hasNext();) {
                    Type t = (Type) it.next();
                    t.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(",");//$NON-NLS-1$
                    }
                }
                this.buffer.append(">");//$NON-NLS-1$
            }
            node.getType().accept(this);
        }
        this.buffer.append("(");//$NON-NLS-1$
        for (Iterator it = node.arguments().iterator(); it.hasNext();) {
            Expression e = (Expression) it.next();
            e.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        this.buffer.append(")");//$NON-NLS-1$
        if (node.getAnonymousClassDeclaration() != null) {
            node.getAnonymousClassDeclaration().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(CompilationUnit node) {
        if (node.getAST().apiLevel() >= 9) {
            if (node.getModule() != null) {
                node.getModule().accept(this);
            }
        }
        if (node.getPackage() != null) {
            node.getPackage().accept(this);
        }
        for (Object element : node.imports()) {
            ImportDeclaration d = (ImportDeclaration) element;
            d.accept(this);
        }
        for (Object element : node.types()) {
            AbstractTypeDeclaration d = (AbstractTypeDeclaration) element;
            d.accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(ConditionalExpression node) {
        node.getExpression().accept(this);
        this.buffer.append(" ? ");//$NON-NLS-1$
        node.getThenExpression().accept(this);
        this.buffer.append(" : ");//$NON-NLS-1$
        node.getElseExpression().accept(this);
        return false;
    }

    @Override
    public boolean visit(ConstructorInvocation node) {
        printIndent();
        if (node.getAST().apiLevel() >= 3) {
            if (!node.typeArguments().isEmpty()) {
                this.buffer.append("<");//$NON-NLS-1$
                for (Iterator it = node.typeArguments().iterator(); it.hasNext();) {
                    Type t = (Type) it.next();
                    t.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(",");//$NON-NLS-1$
                    }
                }
                this.buffer.append(">");//$NON-NLS-1$
            }
        }
        this.buffer.append("this(");//$NON-NLS-1$
        for (Iterator it = node.arguments().iterator(); it.hasNext();) {
            Expression e = (Expression) it.next();
            e.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        this.buffer.append(");\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ContinueStatement node) {
        printIndent();
        this.buffer.append("continue");//$NON-NLS-1$
        if (node.getLabel() != null) {
            this.buffer.append(" ");//$NON-NLS-1$
            node.getLabel().accept(this);
        }
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(CreationReference node) {
        node.getType().accept(this);
        visitReferenceTypeArguments(node.typeArguments());
        this.buffer.append("new");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(Dimension node) {
        List annotations = node.annotations();
        if (annotations.size() > 0)
            this.buffer.append(' ');
        visitAnnotationsList(annotations);
        this.buffer.append("[]"); //$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(DoStatement node) {
        printIndent();
        this.buffer.append("do ");//$NON-NLS-1$
        node.getBody().accept(this);
        this.buffer.append(" while (");//$NON-NLS-1$
        node.getExpression().accept(this);
        this.buffer.append(");\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(EmptyStatement node) {
        printIndent();
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(EnhancedForStatement node) {
        printIndent();
        this.buffer.append("for (");//$NON-NLS-1$
        node.getParameter().accept(this);
        this.buffer.append(" : ");//$NON-NLS-1$
        node.getExpression().accept(this);
        this.buffer.append(") ");//$NON-NLS-1$
        node.getBody().accept(this);
        return false;
    }

    @Override
    public boolean visit(EnumConstantDeclaration node) {
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }
        printIndent();
        printModifiers(node.modifiers());
        node.getName().accept(this);
        if (!node.arguments().isEmpty()) {
            this.buffer.append("(");//$NON-NLS-1$
            for (Iterator it = node.arguments().iterator(); it.hasNext();) {
                Expression e = (Expression) it.next();
                e.accept(this);
                if (it.hasNext()) {
                    this.buffer.append(",");//$NON-NLS-1$
                }
            }
            this.buffer.append(")");//$NON-NLS-1$
        }
        if (node.getAnonymousClassDeclaration() != null) {
            node.getAnonymousClassDeclaration().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(EnumDeclaration node) {
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }
        printIndent();
        printModifiers(node.modifiers());
        this.buffer.append("enum ");//$NON-NLS-1$
        node.getName().accept(this);
        this.buffer.append(" ");//$NON-NLS-1$
        if (!node.superInterfaceTypes().isEmpty()) {
            this.buffer.append("implements ");//$NON-NLS-1$
            for (Iterator it = node.superInterfaceTypes().iterator(); it.hasNext();) {
                Type t = (Type) it.next();
                t.accept(this);
                if (it.hasNext()) {
                    this.buffer.append(", ");//$NON-NLS-1$
                }
            }
            this.buffer.append(" ");//$NON-NLS-1$
        }
        this.buffer.append("{");//$NON-NLS-1$
        for (Iterator it = node.enumConstants().iterator(); it.hasNext();) {
            EnumConstantDeclaration d = (EnumConstantDeclaration) it.next();
            d.accept(this);
            // enum constant declarations do not include punctuation
            if (it.hasNext()) {
                // enum constant declarations are separated by commas
                this.buffer.append(", ");//$NON-NLS-1$
            }
        }
        if (!node.bodyDeclarations().isEmpty()) {
            this.buffer.append("; ");//$NON-NLS-1$
            for (Object element : node.bodyDeclarations()) {
                BodyDeclaration d = (BodyDeclaration) element;
                d.accept(this);
                // other body declarations include trailing punctuation
            }
        }
        this.buffer.append("}\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ExportsDirective node) {
        return visit(node, "exports"); //$NON-NLS-1$
    }

    @Override
    public boolean visit(ExpressionMethodReference node) {
        node.getExpression().accept(this);
        visitReferenceTypeArguments(node.typeArguments());
        node.getName().accept(this);
        return false;
    }

    @Override
    public boolean visit(ExpressionStatement node) {
        printIndent();
        node.getExpression().accept(this);
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(FieldAccess node) {
        node.getExpression().accept(this);
        this.buffer.append(".");//$NON-NLS-1$
        node.getName().accept(this);
        return false;
    }

    @Override
    public boolean visit(FieldDeclaration node) {
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }
        printIndent();
        if (node.getAST().apiLevel() == 2) {
            printModifiers(node.getModifiers());
        }
        if (node.getAST().apiLevel() >= 3) {
            printModifiers(node.modifiers());
        }
        node.getType().accept(this);
        this.buffer.append(" ");//$NON-NLS-1$
        for (Iterator it = node.fragments().iterator(); it.hasNext();) {
            VariableDeclarationFragment f = (VariableDeclarationFragment) it.next();
            f.accept(this);
            if (it.hasNext()) {
                this.buffer.append(", ");//$NON-NLS-1$
            }
        }
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ForStatement node) {
        printIndent();
        this.buffer.append("for (");//$NON-NLS-1$
        for (Iterator it = node.initializers().iterator(); it.hasNext();) {
            Expression e = (Expression) it.next();
            e.accept(this);
            if (it.hasNext())
                this.buffer.append(", ");//$NON-NLS-1$
        }
        this.buffer.append("; ");//$NON-NLS-1$
        if (node.getExpression() != null) {
            node.getExpression().accept(this);
        }
        this.buffer.append("; ");//$NON-NLS-1$
        for (Iterator it = node.updaters().iterator(); it.hasNext();) {
            Expression e = (Expression) it.next();
            e.accept(this);
            if (it.hasNext())
                this.buffer.append(", ");//$NON-NLS-1$
        }
        this.buffer.append(") ");//$NON-NLS-1$
        node.getBody().accept(this);
        return false;
    }

    @Override
    public boolean visit(GuardedPattern node) {
        if (DOMASTUtil.isPatternSupported(node.getAST())) {
            node.getPattern().accept(this);
            this.buffer.append(" when ");//$NON-NLS-1$
            node.getExpression().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(IfStatement node) {
        printIndent();
        this.buffer.append("if (");//$NON-NLS-1$
        node.getExpression().accept(this);
        this.buffer.append(") ");//$NON-NLS-1$
        node.getThenStatement().accept(this);
        if (node.getElseStatement() != null) {
            this.buffer.append(" else ");//$NON-NLS-1$
            node.getElseStatement().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(ImportDeclaration node) {
        printIndent();
        this.buffer.append("import ");//$NON-NLS-1$
        if (node.getAST().apiLevel() >= 23) {
            if (node.modifiers().size() == 1) {
                this.buffer.append(((Modifier) node.modifiers().get(0)).getKeyword().toString()).append(' ');
            }
        } else if (node.getAST().apiLevel() >= 3) {
            if (node.isStatic()) {
                this.buffer.append("static ");//$NON-NLS-1$
            }
        }
        node.getName().accept(this);
        if (node.isOnDemand()) {
            this.buffer.append(".*");//$NON-NLS-1$
        }
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(InfixExpression node) {
        node.getLeftOperand().accept(this);
        this.buffer.append(' ');  // for cases like x= i - -1; or x= i++ + ++i;
        this.buffer.append(node.getOperator().toString());
        this.buffer.append(' ');
        node.getRightOperand().accept(this);
        final List extendedOperands = node.extendedOperands();
        if (extendedOperands.size() != 0) {
            this.buffer.append(' ');
            for (Object extendedOperand : extendedOperands) {
                this.buffer.append(node.getOperator().toString()).append(' ');
                Expression e = (Expression) extendedOperand;
                e.accept(this);
            }
        }
        return false;
    }

    @Override
    public boolean visit(Initializer node) {
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }
        if (node.getAST().apiLevel() == 2) {
            printModifiers(node.getModifiers());
        }
        if (node.getAST().apiLevel() >= 3) {
            printModifiers(node.modifiers());
        }
        node.getBody().accept(this);
        return false;
    }

    @Override
    public boolean visit(InstanceofExpression node) {
        node.getLeftOperand().accept(this);
        this.buffer.append(" instanceof ");//$NON-NLS-1$
        node.getRightOperand().accept(this);
        return false;
    }

    @SuppressWarnings("deprecation")
    @Override
    public boolean visit(PatternInstanceofExpression node) {
        node.getLeftOperand().accept(this);
        this.buffer.append(" instanceof ");//$NON-NLS-1$
        if (node.getAST().apiLevel() >= 21) {
            node.getPattern().accept(this);
        } else {
            node.getRightOperand().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(IntersectionType node) {
        for (Iterator it = node.types().iterator(); it.hasNext();) {
            Type t = (Type) it.next();
            t.accept(this);
            if (it.hasNext()) {
                this.buffer.append(" & "); //$NON-NLS-1$
            }
        }
        return false;
    }

    @Override
    public boolean visit(Javadoc node) {
        printIndent();
        this.buffer.append("/** ");//$NON-NLS-1$
        for (Object element : node.tags()) {
            ASTNode e = (ASTNode) element;
            e.accept(this);
        }
        this.buffer.append("\n */\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(JavaDocRegion node) {
        // ToDO
        return false;
    }

    @Override
    public boolean visit(JavaDocTextElement node) {
        this.buffer.append(node.getText());
        return false;
    }

    @Override
    public boolean visit(LabeledStatement node) {
        printIndent();
        node.getLabel().accept(this);
        this.buffer.append(": ");//$NON-NLS-1$
        node.getBody().accept(this);
        return false;
    }

    @Override
    public boolean visit(LambdaExpression node) {
        boolean hasParentheses = node.hasParentheses();
        if (hasParentheses)
            this.buffer.append('(');
        for (Iterator it = node.parameters().iterator(); it.hasNext();) {
            VariableDeclaration v = (VariableDeclaration) it.next();
            v.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        if (hasParentheses)
            this.buffer.append(')');
        this.buffer.append(" -> "); //$NON-NLS-1$
        node.getBody().accept(this);
        return false;
    }

    @Override
    public boolean visit(LineComment node) {
        this.buffer.append("//\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(MarkerAnnotation node) {
        this.buffer.append("@");//$NON-NLS-1$
        node.getTypeName().accept(this);
        return false;
    }

    @Override
    public boolean visit(MemberRef node) {
        if (node.getQualifier() != null) {
            node.getQualifier().accept(this);
        }
        this.buffer.append("#");//$NON-NLS-1$
        node.getName().accept(this);
        return false;
    }

    @Override
    public boolean visit(MemberValuePair node) {
        node.getName().accept(this);
        this.buffer.append("=");//$NON-NLS-1$
        node.getValue().accept(this);
        return false;
    }

    @Override
    public boolean visit(MethodDeclaration node) {
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }
        printIndent();
        if (node.getAST().apiLevel() == 2) {
            printModifiers(node.getModifiers());
        }
        if (node.getAST().apiLevel() >= 3) {
            printModifiers(node.modifiers());
            if (!node.typeParameters().isEmpty()) {
                this.buffer.append("<");//$NON-NLS-1$
                for (Iterator it = node.typeParameters().iterator(); it.hasNext();) {
                    TypeParameter t = (TypeParameter) it.next();
                    t.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(",");//$NON-NLS-1$
                    }
                }
                this.buffer.append(">");//$NON-NLS-1$
            }
        }
        if (!node.isConstructor()) {
            if (node.getAST().apiLevel() == 2) {
                getReturnType(node).accept(this);
            } else {
                if (node.getReturnType2() != null) {
                    node.getReturnType2().accept(this);
                } else {
                    // methods really ought to have a return type
                    this.buffer.append("void");//$NON-NLS-1$
                }
            }
            this.buffer.append(" ");//$NON-NLS-1$
        }
        node.getName().accept(this);
        if (!(DOMASTUtil.isRecordDeclarationSupported(node.getAST()) && node.isCompactConstructor())) {
            this.buffer.append("(");//$NON-NLS-1$
            if (node.getAST().apiLevel() >= 8) {
                Type receiverType = node.getReceiverType();
                if (receiverType != null) {
                    receiverType.accept(this);
                    this.buffer.append(' ');
                    SimpleName qualifier = node.getReceiverQualifier();
                    if (qualifier != null) {
                        qualifier.accept(this);
                        this.buffer.append('.');
                    }
                    this.buffer.append("this"); //$NON-NLS-1$
                    if (node.parameters().size() > 0) {
                        this.buffer.append(',');
                    }
                }
            }
            for (Iterator it = node.parameters().iterator(); it.hasNext();) {
                SingleVariableDeclaration v = (SingleVariableDeclaration) it.next();
                v.accept(this);
                if (it.hasNext()) {
                    this.buffer.append(",");//$NON-NLS-1$
                }
            }
            this.buffer.append(")");//$NON-NLS-1$
        }
        int size = node.getExtraDimensions();
        if (node.getAST().apiLevel() >= 8) {
            List dimensions = node.extraDimensions();
            for (int i = 0; i < size; i++) {
                visit((Dimension) dimensions.get(i));
            }
        } else {
            for (int i = 0; i < size; i++) {
                this.buffer.append("[]"); //$NON-NLS-1$
            }
        }
        if (node.getAST().apiLevel() < 8) {
            if (!thrownExceptions(node).isEmpty()) {
                this.buffer.append(" throws ");//$NON-NLS-1$
                for (Iterator it = thrownExceptions(node).iterator(); it.hasNext();) {
                    Name n = (Name) it.next();
                    n.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(", ");//$NON-NLS-1$
                    }
                }
                this.buffer.append(" ");//$NON-NLS-1$
            }
        } else {
            if (!node.thrownExceptionTypes().isEmpty()) {
                this.buffer.append(" throws ");//$NON-NLS-1$
                for (Iterator it = node.thrownExceptionTypes().iterator(); it.hasNext();) {
                    Type n = (Type) it.next();
                    n.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(", ");//$NON-NLS-1$
                    }
                }
                this.buffer.append(" ");//$NON-NLS-1$
            }
        }
        if (node.getBody() == null) {
            this.buffer.append(";\n");//$NON-NLS-1$
        } else {
            node.getBody().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(MethodInvocation node) {
        if (node.getExpression() != null) {
            node.getExpression().accept(this);
            this.buffer.append(".");//$NON-NLS-1$
        }
        if (node.getAST().apiLevel() >= 3) {
            if (!node.typeArguments().isEmpty()) {
                this.buffer.append("<");//$NON-NLS-1$
                for (Iterator it = node.typeArguments().iterator(); it.hasNext();) {
                    Type t = (Type) it.next();
                    t.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(",");//$NON-NLS-1$
                    }
                }
                this.buffer.append(">");//$NON-NLS-1$
            }
        }
        node.getName().accept(this);
        this.buffer.append("(");//$NON-NLS-1$
        for (Iterator it = node.arguments().iterator(); it.hasNext();) {
            Expression e = (Expression) it.next();
            e.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        this.buffer.append(")");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(MethodRef node) {
        if (node.getQualifier() != null) {
            node.getQualifier().accept(this);
        }
        this.buffer.append("#");//$NON-NLS-1$
        node.getName().accept(this);
        this.buffer.append("(");//$NON-NLS-1$
        for (Iterator it = node.parameters().iterator(); it.hasNext();) {
            MethodRefParameter e = (MethodRefParameter) it.next();
            e.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        this.buffer.append(")");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(MethodRefParameter node) {
        node.getType().accept(this);
        if (node.getAST().apiLevel() >= 3) {
            if (node.isVarargs()) {
                this.buffer.append("...");//$NON-NLS-1$
            }
        }
        if (node.getName() != null) {
            this.buffer.append(" ");//$NON-NLS-1$
            node.getName().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(Modifier node) {
        this.buffer.append(node.getKeyword().toString());
        return false;
    }

    @Override
    public boolean visit(ModuleDeclaration node) {
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }
        printModifiers(node.annotations());
        if (node.isOpen())
            this.buffer.append("open "); //$NON-NLS-1$
        this.buffer.append("module"); //$NON-NLS-1$
        this.buffer.append(" "); //$NON-NLS-1$
        node.getName().accept(this);
        this.buffer.append(" {\n"); //$NON-NLS-1$
        this.indent++;
        for (ModuleDirective stmt : (List<ModuleDirective>) node.moduleStatements()) {
            stmt.accept(this);
        }
        this.indent--;
        this.buffer.append("}"); //$NON-NLS-1$
        return false;
    }

    @Override
    /*
     * @see ASTVisitor#visit(ModuleModifier)
     *
     * @since 3.14
     */
    public boolean visit(ModuleModifier node) {
        this.buffer.append(node.getKeyword().toString());
        return false;
    }

    private boolean visit(ModulePackageAccess node, String keyword) {
        this.buffer.append(keyword);
        if (node.getName() != null) {
            this.buffer.append(' ');
            node.getName().accept(this);
        }
        // Handle target modules as Names instead of Types
        if (!node.modules().isEmpty()) {
            this.buffer.append(" to "); //$NON-NLS-1$
            for (Iterator it = node.modules().iterator(); it.hasNext();) {
                Name moduleName = (Name) it.next();
                moduleName.accept(this);
                if (it.hasNext()) {
                    this.buffer.append(","); //$NON-NLS-1$
                }
            }
            this.buffer.append(";\n"); //$NON-NLS-1$
        }
        return false;
    }

    @Override
    public boolean visit(NameQualifiedType node) {
        node.getQualifier().accept(this);
        this.buffer.append('.');
        visitTypeAnnotations(node);
        node.getName().accept(this);
        return false;
    }

    @Override
    public boolean visit(NormalAnnotation node) {
        this.buffer.append("@");//$NON-NLS-1$
        node.getTypeName().accept(this);
        this.buffer.append("(");//$NON-NLS-1$
        for (Iterator it = node.values().iterator(); it.hasNext();) {
            MemberValuePair p = (MemberValuePair) it.next();
            p.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        this.buffer.append(")");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(NullLiteral node) {
        this.buffer.append("null");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(NullPattern node) {
        if (DOMASTUtil.isPatternSupported(node.getAST())) {
            this.buffer.append("null");//$NON-NLS-1$
        }
        return false;
    }

    @Override
    public boolean visit(NumberLiteral node) {
        this.buffer.append(node.getToken());
        return false;
    }

    @Override
    public boolean visit(OpensDirective node) {
        return visit(node, "opens"); //$NON-NLS-1$
    }

    @Override
    public boolean visit(PackageDeclaration node) {
        if (node.getAST().apiLevel() >= 3) {
            if (node.getJavadoc() != null) {
                node.getJavadoc().accept(this);
            }
            for (Object element : node.annotations()) {
                Annotation p = (Annotation) element;
                p.accept(this);
                this.buffer.append(" ");//$NON-NLS-1$
            }
        }
        printIndent();
        this.buffer.append("package ");//$NON-NLS-1$
        node.getName().accept(this);
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ParameterizedType node) {
        node.getType().accept(this);
        this.buffer.append("<");//$NON-NLS-1$
        for (Iterator it = node.typeArguments().iterator(); it.hasNext();) {
            Type t = (Type) it.next();
            t.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        this.buffer.append(">");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ParenthesizedExpression node) {
        this.buffer.append("(");//$NON-NLS-1$
        node.getExpression().accept(this);
        this.buffer.append(")");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(PostfixExpression node) {
        node.getOperand().accept(this);
        this.buffer.append(node.getOperator().toString());
        return false;
    }

    @Override
    public boolean visit(PrefixExpression node) {
        this.buffer.append(node.getOperator().toString());
        node.getOperand().accept(this);
        return false;
    }

    @Override
    public boolean visit(PrimitiveType node) {
        visitTypeAnnotations(node);
        this.buffer.append(node.getPrimitiveTypeCode().toString());
        return false;
    }

    @Override
    public boolean visit(ProvidesDirective node) {
        printIndent();
        this.buffer.append("provides");//$NON-NLS-1$
        this.buffer.append(" ");//$NON-NLS-1$
        node.getName().accept(this);

        // Replace printTypes() with proper Name handling
        List implementations = node.implementations();
        if (!implementations.isEmpty()) {
            this.buffer.append(" with ");//$NON-NLS-1$
            for (Iterator it = implementations.iterator(); it.hasNext();) {
                Name implName = (Name) it.next();
                implName.accept(this);
                if (it.hasNext()) {
                    this.buffer.append(", ");//$NON-NLS-1$
                }
            }
        }

        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ModuleQualifiedName node) {
        node.getModuleQualifier().accept(this);
        this.buffer.append("/");//$NON-NLS-1$
        ASTNode cNode = node.getName();
        if (cNode != null) {
            cNode.accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(QualifiedName node) {
        node.getQualifier().accept(this);
        this.buffer.append(".");//$NON-NLS-1$
        node.getName().accept(this);
        return false;
    }

    @Override
    public boolean visit(QualifiedType node) {
        node.getQualifier().accept(this);
        this.buffer.append(".");//$NON-NLS-1$
        visitTypeAnnotations(node);
        node.getName().accept(this);
        return false;
    }

    @Override
    public boolean visit(RecordDeclaration node) {
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }
        printIndent();
        printModifiers(node.modifiers());
        this.buffer.append("record ");//$NON-NLS-1$
        node.getName().accept(this);
        this.buffer.append(" ");//$NON-NLS-1$

        if (!node.typeParameters().isEmpty()) {
            this.buffer.append("<");//$NON-NLS-1$
            for (Iterator it = node.typeParameters().iterator(); it.hasNext();) {
                TypeParameter t = (TypeParameter) it.next();
                t.accept(this);
                if (it.hasNext()) {
                    this.buffer.append(",");//$NON-NLS-1$
                }
            }
            this.buffer.append(">");//$NON-NLS-1$
        }
        this.buffer.append(" ");//$NON-NLS-1$
        this.buffer.append("(");//$NON-NLS-1$
        for (Iterator it = node.recordComponents().iterator(); it.hasNext();) {
            SingleVariableDeclaration v = (SingleVariableDeclaration) it.next();
            v.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        this.buffer.append(")");//$NON-NLS-1$
        if (!node.superInterfaceTypes().isEmpty()) {
            this.buffer.append(" implements ");//$NON-NLS-1$
            for (Iterator it = node.superInterfaceTypes().iterator(); it.hasNext();) {
                Type t = (Type) it.next();
                t.accept(this);
                if (it.hasNext()) {
                    this.buffer.append(", ");//$NON-NLS-1$
                }
            }
            this.buffer.append(" ");//$NON-NLS-1$
        }
        this.buffer.append("{");//$NON-NLS-1$
        if (!node.bodyDeclarations().isEmpty()) {
            this.buffer.append("\n");//$NON-NLS-1$
            for (Object element : node.bodyDeclarations()) {
                BodyDeclaration d = (BodyDeclaration) element;
                d.accept(this);
                // other body declarations include trailing punctuation
            }
        }
        this.buffer.append("}\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(RecordPattern node) {
        if (DOMASTUtil.isPatternSupported(node.getAST())) {
            if (node.getPatternType() != null) {
                node.getPatternType().accept(this);
            }
            boolean addBraces = node.patterns().size() >= 1;
            if (addBraces) {
                this.buffer.append("(");//$NON-NLS-1$
            }
            int size = 1;
            for (Pattern pattern : node.patterns()) {
                visitPattern(pattern);
                if (addBraces && size < node.patterns().size()) {
                    this.buffer.append(", ");//$NON-NLS-1$
                }
                size++;
            }
            if (addBraces) {
                this.buffer.append(")");//$NON-NLS-1$
            }
        }
        return false;
    }

    @Override
    public boolean visit(EitherOrMultiPattern node) {
        if (DOMASTUtil.isEitherOrMultiPatternSupported(node.getAST())) {
            int size = 1;
            for (Pattern pattern : node.patterns()) {
                visitPattern(pattern);
                if (size < node.patterns().size()) {
                    this.buffer.append(", ");//$NON-NLS-1$
                }
                size++;
            }
        }
        return false;
    }

    private boolean visitPattern(Pattern node) {
        if (!DOMASTUtil.isPatternSupported(node.getAST())) {
            return false;
        }
        if (node instanceof RecordPattern) {
            return visit((RecordPattern) node);
        }
        if (node instanceof GuardedPattern) {
            return visit((GuardedPattern) node);
        }
        if (node instanceof TypePattern) {
            return visit((TypePattern) node);
        }
        if (node instanceof EitherOrMultiPattern) {
            return visit((EitherOrMultiPattern) node);
        }
        return false;
    }

    @Override
    public boolean visit(RequiresDirective node) {
        printIndent();
        this.buffer.append("requires");//$NON-NLS-1$
        this.buffer.append(" ");//$NON-NLS-1$
        printModifiers(node.modifiers());
        node.getName().accept(this);
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ReturnStatement node) {
        printIndent();
        this.buffer.append("return");//$NON-NLS-1$
        if (node.getExpression() != null) {
            this.buffer.append(" ");//$NON-NLS-1$
            node.getExpression().accept(this);
        }
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(SimpleName node) {
        this.buffer.append(node.getIdentifier());
        return false;
    }

    @Override
    public boolean visit(SimpleType node) {
        visitTypeAnnotations(node);
        node.getName().accept(this);
        return false;
    }

    @Override
    public boolean visit(SingleMemberAnnotation node) {
        this.buffer.append("@");//$NON-NLS-1$
        node.getTypeName().accept(this);
        this.buffer.append("(");//$NON-NLS-1$
        node.getValue().accept(this);
        this.buffer.append(")");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(SingleVariableDeclaration node) {
        printIndent();
        if (node.getAST().apiLevel() == 2) {
            printModifiers(node.getModifiers());
        }
        if (node.getAST().apiLevel() >= 3) {
            printModifiers(node.modifiers());
        }
        node.getType().accept(this);
        if (node.getAST().apiLevel() >= 3) {
            if (node.isVarargs()) {
                if (node.getAST().apiLevel() >= 8) {
                    List annotations = node.varargsAnnotations();
                    if (annotations.size() > 0) {
                        this.buffer.append(' ');
                    }
                    visitAnnotationsList(annotations);
                }
                this.buffer.append("...");//$NON-NLS-1$
            }
        }
        this.buffer.append(" ");//$NON-NLS-1$
        node.getName().accept(this);
        int size = node.getExtraDimensions();
        if (node.getAST().apiLevel() >= 8) {
            List dimensions = node.extraDimensions();
            for (int i = 0; i < size; i++) {
                visit((Dimension) dimensions.get(i));
            }
        } else {
            for (int i = 0; i < size; i++) {
                this.buffer.append("[]"); //$NON-NLS-1$
            }
        }
        if (node.getInitializer() != null) {
            this.buffer.append("=");//$NON-NLS-1$
            node.getInitializer().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(StringLiteral node) {
        this.buffer.append(node.getEscapedValue());
        return false;
    }

    @Override
    public boolean visit(SuperConstructorInvocation node) {
        printIndent();
        if (node.getExpression() != null) {
            node.getExpression().accept(this);
            this.buffer.append(".");//$NON-NLS-1$
        }
        if (node.getAST().apiLevel() >= 3) {
            if (!node.typeArguments().isEmpty()) {
                this.buffer.append("<");//$NON-NLS-1$
                for (Iterator it = node.typeArguments().iterator(); it.hasNext();) {
                    Type t = (Type) it.next();
                    t.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(",");//$NON-NLS-1$
                    }
                }
                this.buffer.append(">");//$NON-NLS-1$
            }
        }
        this.buffer.append("super(");//$NON-NLS-1$
        for (Iterator it = node.arguments().iterator(); it.hasNext();) {
            Expression e = (Expression) it.next();
            e.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        this.buffer.append(");\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(SuperFieldAccess node) {
        if (node.getQualifier() != null) {
            node.getQualifier().accept(this);
            this.buffer.append(".");//$NON-NLS-1$
        }
        this.buffer.append("super.");//$NON-NLS-1$
        node.getName().accept(this);
        return false;
    }

    @Override
    public boolean visit(SuperMethodInvocation node) {
        if (node.getQualifier() != null) {
            node.getQualifier().accept(this);
            this.buffer.append(".");//$NON-NLS-1$
        }
        this.buffer.append("super.");//$NON-NLS-1$
        if (node.getAST().apiLevel() >= 3) {
            if (!node.typeArguments().isEmpty()) {
                this.buffer.append("<");//$NON-NLS-1$
                for (Iterator it = node.typeArguments().iterator(); it.hasNext();) {
                    Type t = (Type) it.next();
                    t.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(",");//$NON-NLS-1$
                    }
                }
                this.buffer.append(">");//$NON-NLS-1$
            }
        }
        node.getName().accept(this);
        this.buffer.append("(");//$NON-NLS-1$
        for (Iterator it = node.arguments().iterator(); it.hasNext();) {
            Expression e = (Expression) it.next();
            e.accept(this);
            if (it.hasNext()) {
                this.buffer.append(",");//$NON-NLS-1$
            }
        }
        this.buffer.append(")");//$NON-NLS-1$
        return false;
    }

    /*
     * @see ASTVisitor#visit(SuperMethodReference)
     *
     * @since 3.10
     */
    @Override
    public boolean visit(SuperMethodReference node) {
        if (node.getQualifier() != null) {
            node.getQualifier().accept(this);
            this.buffer.append('.');
        }
        this.buffer.append("super");//$NON-NLS-1$
        visitReferenceTypeArguments(node.typeArguments());
        node.getName().accept(this);
        return false;
    }

    @Override
    public boolean visit(SwitchCase node) {
        if ((node.getAST().apiLevel() >= 14)) {
            if (node.isDefault() && !isCaseDefaultExpression(node)) {
                this.buffer.append("default");//$NON-NLS-1$
                this.buffer.append(node.isSwitchLabeledRule() ? " ->" : ":");//$NON-NLS-1$ //$NON-NLS-2$
            } else {
                this.buffer.append("case ");//$NON-NLS-1$
                for (Iterator it = node.expressions().iterator(); it.hasNext();) {
                    Expression t = (Expression) it.next();
                    t.accept(this);
                    this.buffer.append(it.hasNext() ? ", " : //$NON-NLS-1$
                        node.isSwitchLabeledRule() ? " ->" : ":");//$NON-NLS-1$ //$NON-NLS-2$
                }
            }
        } else {
            if (node.isDefault() && !isCaseDefaultExpression(node)) {
                this.buffer.append("default :\n");//$NON-NLS-1$
            } else {
                this.buffer.append("case ");//$NON-NLS-1$
                getSwitchExpression(node).accept(this);
                this.buffer.append(":\n");//$NON-NLS-1$
            }
        }
        this.indent++; // decremented in visit(SwitchStatement)
        return false;
    }

    private boolean isCaseDefaultExpression(SwitchCase node) {
        if (node.expressions() != null
            && node.expressions().size() == 1
            && node.expressions().get(0) instanceof CaseDefaultExpression) {
            return true;
        }
        return false;
    }

    /**
     * @deprecated
     */
    private Expression getSwitchExpression(SwitchCase node) {
        return node.getExpression();
    }

    private void visitSwitchNode(ASTNode node) {
        this.buffer.append("switch (");//$NON-NLS-1$
        if (node instanceof SwitchExpression) {
            ((SwitchExpression) node).getExpression().accept(this);
        } else if (node instanceof SwitchStatement) {
            ((SwitchStatement) node).getExpression().accept(this);
        }
        this.buffer.append(") ");//$NON-NLS-1$
        this.buffer.append("{\n");//$NON-NLS-1$
        this.indent++;
        if (node instanceof SwitchExpression) {
            for (Object element : ((SwitchExpression) node).statements()) {
                Statement s = (Statement) element;
                s.accept(this);
                this.indent--; // incremented in visit(SwitchCase)
            }
        } else if (node instanceof SwitchStatement) {
            for (Object element : ((SwitchStatement) node).statements()) {
                Statement s = (Statement) element;
                s.accept(this);
                this.indent--; // incremented in visit(SwitchCase)
            }
        }
        this.indent--;
        printIndent();
        this.buffer.append("}\n");//$NON-NLS-1$

    }

    @Override
    public boolean visit(SwitchExpression node) {
        visitSwitchNode(node);
        return false;
    }

    @Override
    public boolean visit(SwitchStatement node) {
        visitSwitchNode(node);
        return false;
    }

    @Override
    public boolean visit(SynchronizedStatement node) {
        this.buffer.append("synchronized (");//$NON-NLS-1$
        node.getExpression().accept(this);
        this.buffer.append(") ");//$NON-NLS-1$
        node.getBody().accept(this);
        return false;
    }

    @Override
    public boolean visit(TagElement node) {
        if (node.isNested()) {
            // nested tags are always enclosed in braces
            this.buffer.append("{");//$NON-NLS-1$
        } else {
            // top-level tags always begin on a new line
            this.buffer.append("\n * ");//$NON-NLS-1$
        }
        boolean previousRequiresWhiteSpace = false;
        if (node.getTagName() != null) {
            this.buffer.append(node.getTagName());
            previousRequiresWhiteSpace = true;
        }
        boolean previousRequiresNewLine = false;
        for (Object element : node.fragments()) {
            ASTNode e = (ASTNode) element;
            // Name, MemberRef, MethodRef, and nested TagElement do not include white space.
            // TextElements don't always include whitespace, see <https://bugs.eclipse.org/206518>.
            boolean currentIncludesWhiteSpace = false;
            if (e instanceof TextElement) {
                String text = ((TextElement) e).getText();
                if (text.length() > 0 && ScannerHelper.isWhitespace(text.charAt(0))) {
                    currentIncludesWhiteSpace = true; // workaround for https://bugs.eclipse.org/403735
                }
            }
            if (previousRequiresNewLine && currentIncludesWhiteSpace) {
                this.buffer.append("\n * ");//$NON-NLS-1$
            }
            previousRequiresNewLine = currentIncludesWhiteSpace;
            // add space if required to separate
            if (previousRequiresWhiteSpace && !currentIncludesWhiteSpace) {
                this.buffer.append(" "); //$NON-NLS-1$
            }
            e.accept(this);
            previousRequiresWhiteSpace = !currentIncludesWhiteSpace && !(e instanceof TagElement);
        }
        if (DOMASTUtil.isJavaDocCodeSnippetSupported(node.getAST().apiLevel())) {
            for (Object element : node.tagProperties()) {
                TagProperty tagProperty = (TagProperty) element;
                tagProperty.accept(this);
            }
        }
        if (node.isNested()) {
            this.buffer.append("}");//$NON-NLS-1$
        }
        return false;
    }

    @Override
    public boolean visit(TagProperty node) {
        this.buffer.append("\n{"); //$NON-NLS-1$
        this.buffer.append(node.getName());
        this.buffer.append(" = "); //$NON-NLS-1$
        this.buffer.append(node.getStringValue());
        node.getNodeValue().accept(this);
        this.buffer.append("}"); //$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(TextBlock node) {
        this.buffer.append(node.getEscapedValue());
        return false;
    }

    @Override
    public boolean visit(TextElement node) {
        this.buffer.append(node.getText());
        return false;
    }

    @Override
    public boolean visit(ThisExpression node) {
        if (node.getQualifier() != null) {
            node.getQualifier().accept(this);
            this.buffer.append(".");//$NON-NLS-1$
        }
        this.buffer.append("this");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(ThrowStatement node) {
        printIndent();
        this.buffer.append("throw ");//$NON-NLS-1$
        node.getExpression().accept(this);
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(TryStatement node) {
        printIndent();
        this.buffer.append("try ");//$NON-NLS-1$
        if (node.getAST().apiLevel() >= 4) {
            List resources = node.resources();
            if (!resources.isEmpty()) {
                this.buffer.append('(');
                for (Iterator it = resources.iterator(); it.hasNext();) {
                    Expression variable = (Expression) it.next();
                    variable.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(';');
                    }
                }
                this.buffer.append(')');
            }
        }
        node.getBody().accept(this);
        this.buffer.append(" ");//$NON-NLS-1$
        for (Object element : node.catchClauses()) {
            CatchClause cc = (CatchClause) element;
            cc.accept(this);
        }
        if (node.getFinally() != null) {
            this.buffer.append(" finally ");//$NON-NLS-1$
            node.getFinally().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(ImplicitTypeDeclaration node) {
        // javaDoc
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }

        // bodyDeclaration
        this.indent++;
        for (Object element : node.bodyDeclarations()) {
            BodyDeclaration d = (BodyDeclaration) element;
            d.accept(this);
        }
        this.indent--;
        printIndent();

        return false;
    }

    @Override
    public boolean visit(TypeDeclaration node) {
        if (node.getJavadoc() != null) {
            node.getJavadoc().accept(this);
        }
        if (node.getAST().apiLevel() == 2) {
            printModifiers(node.getModifiers());
        }
        if (node.getAST().apiLevel() >= 3) {
            printModifiers(node.modifiers());
        }
        this.buffer.append(node.isInterface() ? "interface " : "class ");//$NON-NLS-2$//$NON-NLS-1$
        node.getName().accept(this);
        if (node.getAST().apiLevel() >= 3) {
            if (!node.typeParameters().isEmpty()) {
                this.buffer.append("<");//$NON-NLS-1$
                for (Iterator it = node.typeParameters().iterator(); it.hasNext();) {
                    TypeParameter t = (TypeParameter) it.next();
                    t.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(",");//$NON-NLS-1$
                    }
                }
                this.buffer.append(">");//$NON-NLS-1$
            }
        }
        this.buffer.append(" ");//$NON-NLS-1$
        if (node.getAST().apiLevel() == 2) {
            if (getSuperclass(node) != null) {
                this.buffer.append("extends ");//$NON-NLS-1$
                getSuperclass(node).accept(this);
                this.buffer.append(" ");//$NON-NLS-1$
            }
            if (!superInterfaces(node).isEmpty()) {
                this.buffer.append(node.isInterface() ? "extends " : "implements ");//$NON-NLS-2$//$NON-NLS-1$
                for (Iterator it = superInterfaces(node).iterator(); it.hasNext();) {
                    Name n = (Name) it.next();
                    n.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(", ");//$NON-NLS-1$
                    }
                }
                this.buffer.append(" ");//$NON-NLS-1$
            }
        }
        if (node.getAST().apiLevel() >= 3) {
            if (node.getSuperclassType() != null) {
                this.buffer.append("extends ");//$NON-NLS-1$
                node.getSuperclassType().accept(this);
                this.buffer.append(" ");//$NON-NLS-1$
            }
            if (!node.superInterfaceTypes().isEmpty()) {
                this.buffer.append(node.isInterface() ? "extends " : "implements ");//$NON-NLS-2$//$NON-NLS-1$
                for (Iterator it = node.superInterfaceTypes().iterator(); it.hasNext();) {
                    Type t = (Type) it.next();
                    t.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(", ");//$NON-NLS-1$
                    }
                }
                this.buffer.append(" ");//$NON-NLS-1$
            }
        }
        if (DOMASTUtil.isFeatureSupportedinAST(node.getAST())) {
            if (!node.permittedTypes().isEmpty()) {
                this.buffer.append("permits ");//$NON-NLS-1$
                for (Iterator it = node.permittedTypes().iterator(); it.hasNext();) {
                    Type t = (Type) it.next();
                    t.accept(this);
                    if (it.hasNext()) {
                        this.buffer.append(", ");//$NON-NLS-1$
                    }
                }
                this.buffer.append(" ");//$NON-NLS-1$
            }
        }
        this.buffer.append("{\n");//$NON-NLS-1$
        this.indent++;
        for (Object element : node.bodyDeclarations()) {
            BodyDeclaration d = (BodyDeclaration) element;
            d.accept(this);
        }
        this.indent--;
        printIndent();
        this.buffer.append("}\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(TypeDeclarationStatement node) {
        if (node.getAST().apiLevel() == 2) {
            getTypeDeclaration(node).accept(this);
        }
        if (node.getAST().apiLevel() >= 3) {
            node.getDeclaration().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(TypeLiteral node) {
        node.getType().accept(this);
        this.buffer.append(".class");//$NON-NLS-1$
        return false;
    }

    /*
     * @see ASTVisitor#visit(TypeMethodReference)
     *
     * @since 3.10
     */
    @Override
    public boolean visit(TypeMethodReference node) {
        node.getType().accept(this);
        visitReferenceTypeArguments(node.typeArguments());
        node.getName().accept(this);
        return false;
    }

    @Override
    public boolean visit(TypeParameter node) {
        if (node.getAST().apiLevel() >= 8) {
            printModifiers(node.modifiers());
        }
        node.getName().accept(this);
        if (!node.typeBounds().isEmpty()) {
            this.buffer.append(" extends ");//$NON-NLS-1$
            for (Iterator it = node.typeBounds().iterator(); it.hasNext();) {
                Type t = (Type) it.next();
                t.accept(this);
                if (it.hasNext()) {
                    this.buffer.append(" & ");//$NON-NLS-1$
                }
            }
        }
        return false;
    }

    @Override
    public boolean visit(TypePattern node) {
        if (DOMASTUtil.isPatternSupported(node.getAST())) {
            if (node.getAST().apiLevel() < 22) {
                node.getPatternVariable().accept(this);
            } else {
                node.getPatternVariable2().accept(this);
            }
        }
        return false;
    }

    @Override
    public boolean visit(UnionType node) {
        for (Iterator it = node.types().iterator(); it.hasNext();) {
            Type t = (Type) it.next();
            t.accept(this);
            if (it.hasNext()) {
                this.buffer.append('|');
            }
        }
        return false;
    }

    @Override
    public boolean visit(UsesDirective node) {
        printIndent();
        this.buffer.append("uses");//$NON-NLS-1$
        this.buffer.append(" ");//$NON-NLS-1$
        node.getName().accept(this);
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(VariableDeclarationExpression node) {
        if (node.getAST().apiLevel() == 2) {
            printModifiers(node.getModifiers());
        }
        if (node.getAST().apiLevel() >= 3) {
            printModifiers(node.modifiers());
        }
        node.getType().accept(this);
        this.buffer.append(" ");//$NON-NLS-1$
        for (Iterator it = node.fragments().iterator(); it.hasNext();) {
            VariableDeclarationFragment f = (VariableDeclarationFragment) it.next();
            f.accept(this);
            if (it.hasNext()) {
                this.buffer.append(", ");//$NON-NLS-1$
            }
        }
        return false;
    }

    @Override
    public boolean visit(VariableDeclarationFragment node) {
        node.getName().accept(this);
        int size = node.getExtraDimensions();
        if (node.getAST().apiLevel() >= 8) {
            List dimensions = node.extraDimensions();
            for (int i = 0; i < size; i++) {
                visit((Dimension) dimensions.get(i));
            }
        } else {
            for (int i = 0; i < size; i++) {
                this.buffer.append("[]");//$NON-NLS-1$
            }
        }
        if (node.getInitializer() != null) {
            this.buffer.append("=");//$NON-NLS-1$
            node.getInitializer().accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(VariableDeclarationStatement node) {
        printIndent();
        if (node.getAST().apiLevel() == 2) {
            printModifiers(node.getModifiers());
        }
        if (node.getAST().apiLevel() >= 3) {
            printModifiers(node.modifiers());
        }
        node.getType().accept(this);
        this.buffer.append(" ");//$NON-NLS-1$
        for (Iterator it = node.fragments().iterator(); it.hasNext();) {
            VariableDeclarationFragment f = (VariableDeclarationFragment) it.next();
            f.accept(this);
            if (it.hasNext()) {
                this.buffer.append(", ");//$NON-NLS-1$
            }
        }
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    @Override
    public boolean visit(WhileStatement node) {
        printIndent();
        this.buffer.append("while (");//$NON-NLS-1$
        node.getExpression().accept(this);
        this.buffer.append(") ");//$NON-NLS-1$
        node.getBody().accept(this);
        return false;
    }

    @Override
    public boolean visit(WildcardType node) {
        visitTypeAnnotations(node);
        this.buffer.append("?");//$NON-NLS-1$
        Type bound = node.getBound();
        if (bound != null) {
            if (node.isUpperBound()) {
                this.buffer.append(" extends ");//$NON-NLS-1$
            } else {
                this.buffer.append(" super ");//$NON-NLS-1$
            }
            bound.accept(this);
        }
        return false;
    }

    @Override
    public boolean visit(YieldStatement node) {
        if ((node.getAST().apiLevel() >= 14) && node.isImplicit() && node.getExpression() == null) {
            return false;
        }
        printIndent();
        this.buffer.append("yield"); //$NON-NLS-1$
        if (node.getExpression() != null) {
            this.buffer.append(" ");//$NON-NLS-1$
            node.getExpression().accept(this);
        }
        this.buffer.append(";\n");//$NON-NLS-1$
        return false;
    }

    /**
     * @deprecated
     */
    private void visitComponentType(ArrayType node) {
        node.getComponentType().accept(this);
    }
}
