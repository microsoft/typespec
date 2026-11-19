// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2014, 2025 Mateusz Matela and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Formatter does not format Java code correctly, especially when max line width is set - https://bugs.eclipse.org/303519
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] follow up bug for comments - https://bugs.eclipse.org/458208
 *     IBM Corporation - Markdown support
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOLON;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOMMA;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOMMENT_BLOCK;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOMMENT_JAVADOC;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOMMENT_LINE;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameDOT;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameEQUAL;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameIdentifier;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameLBRACE;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameLESS;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameLPAREN;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameOR;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameQUESTION;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameRBRACE;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameRPAREN;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameSEMICOLON;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameStringLiteral;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNamecase;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameenum;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameextends;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameimplements;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNamenew;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNamesuper;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNamethis;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNamethrows;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameto;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNamewith;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.Annotation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.AnnotationTypeDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.AnnotationTypeMemberDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.AnonymousClassDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ArrayInitializer;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.AssertStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.Assignment;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.Block;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ClassInstanceCreation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ConditionalExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ConstructorInvocation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.CreationReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.DoStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.EnhancedForStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.EnumConstantDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.EnumDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ExportsDirective;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.Expression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ExpressionMethodReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.FieldAccess;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.FieldDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ForStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.IExtendedModifier;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.IfStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.InfixExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.InfixExpression.Operator;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.LambdaExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.MethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.MethodInvocation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.Name;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.NormalAnnotation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.OpensDirective;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.PackageDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ParameterizedType;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ProvidesDirective;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.QualifiedName;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.SingleVariableDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.Statement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.SuperConstructorInvocation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.SuperFieldAccess;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.SuperMethodInvocation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.SuperMethodReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.SwitchCase;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ThisExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.TryStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.Type;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.TypeDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.TypeMethodReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.TypeParameter;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.UnionType;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.VariableDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.VariableDeclarationExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.VariableDeclarationFragment;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.VariableDeclarationStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.WhileStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter.Token.WrapMode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter.Token.WrapPolicy;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class WrapPreparator extends ASTVisitor {

    /**
     * Helper for common handling of all expressions that should be treated the same as {@link FieldAccess}
     */
    private record FieldAccessAdapter(Expression accessExpression) {
        public static boolean isFieldAccess(ASTNode expr) {
            return expr instanceof FieldAccess
                || expr instanceof QualifiedName
                || expr instanceof ThisExpression
                || expr instanceof SuperFieldAccess;
        }

        public Expression getExpression() {
            if (this.accessExpression instanceof FieldAccess)
                return ((FieldAccess) this.accessExpression).getExpression();
            if (this.accessExpression instanceof QualifiedName)
                return ((QualifiedName) this.accessExpression).getQualifier();
            if (this.accessExpression instanceof ThisExpression)
                return ((ThisExpression) this.accessExpression).getQualifier();
            if (this.accessExpression instanceof SuperFieldAccess)
                return ((SuperFieldAccess) this.accessExpression).getQualifier();
            throw new AssertionError();
        }

        public int getIdentifierIndex(TokenManager tm) {
            if (this.accessExpression instanceof FieldAccess)
                return tm.firstIndexIn(((FieldAccess) this.accessExpression).getName(), TokenNameIdentifier);
            if (this.accessExpression instanceof QualifiedName)
                return tm.firstIndexIn(((QualifiedName) this.accessExpression).getName(), TokenNameIdentifier);
            if (this.accessExpression instanceof ThisExpression)
                return tm.lastIndexIn(this.accessExpression, TokenNamethis);
            if (this.accessExpression instanceof SuperFieldAccess)
                return tm.lastIndexIn(this.accessExpression, TokenNamesuper);
            throw new AssertionError();
        }
    }

    final TokenManager tm;
    final DefaultCodeFormatterOptions options;
    final int kind;

    /*
     * temporary values used when calling {@link #handleWrap(int)} to avoid ArrayList initialization and long lists of
     * parameters
     */
    private final List<Integer> wrapIndexes = new ArrayList<>();
    /** Indexes for wraps that shouldn't happen but should be indented if cannot be removed */
    private final List<Integer> secondaryWrapIndexes = new ArrayList<>();
    private final List<Float> wrapPenalties = new ArrayList<>();
    private int wrapParentIndex = -1;
    private int wrapGroupEnd = -1;

    private int currentDepth = 0;

    public WrapPreparator(TokenManager tokenManager, DefaultCodeFormatterOptions options, int kind) {
        this.tm = tokenManager;
        this.options = options;
        this.kind = kind;
    }

    @Override
    public boolean preVisit2(ASTNode node) {
        this.currentDepth++;

        assert this.wrapIndexes.isEmpty() && this.secondaryWrapIndexes.isEmpty() && this.wrapPenalties.isEmpty();
        assert this.wrapParentIndex == -1 && this.wrapGroupEnd == -1;

        boolean isMalformed = (node.getFlags() & 1) != 0;
        if (isMalformed) {
            this.tm.addDisableFormatTokenPair(this.tm.firstTokenIn(node, TerminalToken.TokenNameInvalid),
                this.tm.lastTokenIn(node, TerminalToken.TokenNameInvalid));
        }
        return !isMalformed;
    }

    @Override
    public void postVisit() {
        this.currentDepth--;
    }

    @Override
    public boolean visit(PackageDeclaration node) {
        handleAnnotations(node.annotations(), 49);
        return true;
    }

    @Override
    public boolean visit(NormalAnnotation node) {
        handleArguments(node.values(), 48);
        return true;
    }

    @Override
    public boolean visit(TypeDeclaration node) {
        handleAnnotations(node.modifiers(), 49);

        Type superclassType = node.getSuperclassType();
        if (superclassType != null) {
            this.wrapParentIndex = this.tm.lastIndexIn(node.getName(), TerminalToken.TokenNameInvalid);
            this.wrapGroupEnd = this.tm.lastIndexIn(superclassType, TerminalToken.TokenNameInvalid);
            this.wrapIndexes.add(this.tm.firstIndexBefore(superclassType, TokenNameextends));
            this.wrapIndexes.add(this.tm.firstIndexIn(superclassType, TerminalToken.TokenNameInvalid));
            handleWrap(0.875f);
        }

        List<Type> superInterfaceTypes = node.superInterfaceTypes();
        if (!superInterfaceTypes.isEmpty()) {
            int implementsToken = node.isInterface() ? TokenNameextends : TokenNameimplements;
            this.wrapParentIndex = this.tm.lastIndexIn(node.getName(), TerminalToken.TokenNameInvalid);
            this.wrapIndexes.add(this.tm.firstIndexBefore(superInterfaceTypes.get(0), implementsToken));
            prepareElementsList(superInterfaceTypes, TokenNameCOMMA, TerminalToken.TokenNameInvalid);
            handleWrap(0.875f);
        }

        prepareElementsList(node.typeParameters(), TokenNameCOMMA, TokenNameLESS);
        handleWrap(0);

        return true;
    }

    @Override
    public boolean visit(AnnotationTypeDeclaration node) {
        handleAnnotations(node.modifiers(), 49);
        return true;
    }

    @Override
    public boolean visit(AnnotationTypeMemberDeclaration node) {
        handleAnnotations(node.modifiers(), 49);
        return true;
    }

    @Override
    public boolean visit(MethodDeclaration node) {
        handleAnnotations(node.modifiers(), 49);

        List<SingleVariableDeclaration> parameters = node.parameters();
        Type receiverType = node.getReceiverType();
        if (!parameters.isEmpty() || receiverType != null) {
            if (receiverType != null)
                this.wrapIndexes.add(this.tm.firstIndexIn(receiverType, TerminalToken.TokenNameInvalid));
            this.wrapGroupEnd
                = this.tm.lastIndexIn(parameters.isEmpty() ? receiverType : parameters.get(parameters.size() - 1),
                    TerminalToken.TokenNameInvalid);
            handleArguments(parameters, 16);
        }

        List<Type> exceptionTypes = node.thrownExceptionTypes();
        if (!exceptionTypes.isEmpty()) {
            this.wrapParentIndex = this.tm.firstIndexAfter(node.getName(), TokenNameLPAREN);
            prepareElementsList(exceptionTypes, TokenNameCOMMA, TokenNameRPAREN);
            // instead of the first exception type, wrap the "throws" token
            this.wrapIndexes.set(0, this.tm.firstIndexBefore(exceptionTypes.get(0), TokenNamethrows));
            handleWrap(0.5f);
        }

        if (!node.isConstructor()) {
            List<TypeParameter> typeParameters = node.typeParameters();
            if (!typeParameters.isEmpty())
                this.wrapIndexes.add(this.tm.firstIndexIn(typeParameters.get(0), TerminalToken.TokenNameInvalid));
            if (node.getReturnType2() != null) {
                int returTypeIndex = this.tm.firstIndexIn(node.getReturnType2(), TerminalToken.TokenNameInvalid);
                if (returTypeIndex != this.wrapParentIndex)
                    this.wrapIndexes.add(returTypeIndex);
            }
            this.wrapIndexes.add(this.tm.firstIndexIn(node.getName(), TerminalToken.TokenNameInvalid));
            this.wrapGroupEnd = this.tm.lastIndexIn(node.getName(), TerminalToken.TokenNameInvalid);
            this.wrapParentIndex = this.tm.findFirstTokenInLine(this.wrapIndexes.get(0));
            while (this.tm.get(this.wrapParentIndex).isComment())
                this.wrapParentIndex++;
            if (this.wrapParentIndex == this.wrapIndexes.get(0))
                this.wrapIndexes.remove(0);
            handleWrap(16);
        }

        prepareElementsList(node.typeParameters(), TokenNameCOMMA, TokenNameLESS);
        handleWrap(0);

        return true;
    }

    @Override
    public boolean visit(EnumDeclaration node) {
        handleAnnotations(node.modifiers(), 49);

        List<EnumConstantDeclaration> enumConstants = node.enumConstants();
        if (!enumConstants.isEmpty()) {
            for (EnumConstantDeclaration constant : enumConstants)
                this.wrapIndexes.add(this.tm.firstIndexIn(constant, TerminalToken.TokenNameInvalid));
            this.wrapParentIndex = this.tm.firstIndexIn(node, TokenNameenum);
            this.wrapGroupEnd
                = this.tm.lastIndexIn(enumConstants.get(enumConstants.size() - 1), TerminalToken.TokenNameInvalid);
            handleWrap(48, node);
        }

        List<Type> superInterfaceTypes = node.superInterfaceTypes();
        if (!superInterfaceTypes.isEmpty()) {
            this.wrapParentIndex = this.tm.lastIndexIn(node.getName(), TerminalToken.TokenNameInvalid);
            this.wrapIndexes.add(this.tm.firstIndexBefore(superInterfaceTypes.get(0), TokenNameimplements));
            prepareElementsList(superInterfaceTypes, TokenNameCOMMA, TerminalToken.TokenNameInvalid);
            handleWrap(0.875f);
        }

        return true;
    }

    @Override
    public boolean visit(EnumConstantDeclaration node) {
        handleAnnotations(node.modifiers(), 49);

        handleArguments(node.arguments(), 16);
        AnonymousClassDeclaration anonymousClass = node.getAnonymousClassDeclaration();
        if (anonymousClass != null) {
            forceContinuousWrapping(anonymousClass,
                this.tm.firstIndexIn(node.getName(), TerminalToken.TokenNameInvalid));
        }
        return true;
    }

    @Override
    public boolean visit(MethodInvocation node) {

        handleArguments(node.arguments(), 16);
        handleTypeArguments(node.typeArguments());

        boolean isInvocationChainRoot = !(node.getParent() instanceof MethodInvocation)
            || node.getLocationInParent() != MethodInvocation.EXPRESSION_PROPERTY;
        if (isInvocationChainRoot) {
            Expression expression = node;
            MethodInvocation invocation = node;
            while (expression instanceof MethodInvocation) {
                invocation = (MethodInvocation) expression;
                expression = invocation.getExpression();
                if (expression != null) {
                    this.wrapIndexes.add(this.tm.firstIndexBefore(invocation.getName(), TokenNameDOT));
                    this.secondaryWrapIndexes.add(this.tm.firstIndexIn(invocation.getName(), TokenNameIdentifier));
                }
            }
            Collections.reverse(this.wrapIndexes);
            if (expression == null)
                expression = invocation;
            this.wrapParentIndex = this.tm.lastIndexIn(expression, TerminalToken.TokenNameInvalid);
            this.wrapParentIndex = this.tm.firstIndexIn(expression, TerminalToken.TokenNameInvalid);
            this.wrapGroupEnd = this.tm.lastIndexIn(node, TerminalToken.TokenNameInvalid);
            handleWrap(80);
        }
        return true;
    }

    @Override
    public boolean visit(SuperMethodInvocation node) {

        handleArguments(node.arguments(), 16);
        handleTypeArguments(node.typeArguments());
        return true;
    }

    @Override
    public boolean visit(ClassInstanceCreation node) {

        AnonymousClassDeclaration anonymousClass = node.getAnonymousClassDeclaration();
        if (anonymousClass != null) {
            forceContinuousWrapping(anonymousClass, this.tm.firstIndexIn(node, TokenNamenew));
        }

        handleArguments(node.arguments(), 16);

        handleTypeArguments(node.typeArguments());
        return true;
    }

    @Override
    public boolean visit(ConstructorInvocation node) {

        handleArguments(node.arguments(), 16);
        handleTypeArguments(node.typeArguments());
        return true;
    }

    @Override
    public boolean visit(SuperConstructorInvocation node) {

        handleArguments(node.arguments(), 16);
        handleTypeArguments(node.typeArguments());
        return true;
    }

    @Override
    public boolean visit(FieldAccess node) {
        handleFieldAccess(node);
        return true;
    }

    @Override
    public boolean visit(QualifiedName node) {
        handleFieldAccess(node);
        return true;
    }

    @Override
    public boolean visit(ThisExpression node) {
        handleFieldAccess(node);
        return true;
    }

    @Override
    public boolean visit(SuperFieldAccess node) {
        handleFieldAccess(node);
        return true;
    }

    private void handleFieldAccess(Expression node) {
        boolean isAccessChainRoot = !FieldAccessAdapter.isFieldAccess(node.getParent());
        if (!isAccessChainRoot)
            return;

        Expression expression = node;
        FieldAccessAdapter access = null;
        while (FieldAccessAdapter.isFieldAccess(expression)) {
            access = new FieldAccessAdapter(expression);
            int nameIndex = access.getIdentifierIndex(this.tm);
            // find a dot preceding the name, may not be there
            for (int i = nameIndex - 1; i > this.tm.firstIndexIn(node, TerminalToken.TokenNameInvalid); i--) {
                Token t = this.tm.get(i);
                if (t.tokenType == TokenNameDOT) {
                    this.wrapIndexes.add(i);
                    this.secondaryWrapIndexes.add(nameIndex);
                }
                if (!t.isComment() && t.tokenType != TokenNamesuper)
                    break;
            }
            expression = access.getExpression();
        }
        Collections.reverse(this.wrapIndexes);
        this.wrapParentIndex = this.tm.lastIndexIn(expression != null ? expression : access.accessExpression,
            TerminalToken.TokenNameInvalid);
        boolean isFollowedByInvocation = node.getParent() instanceof MethodInvocation
            && node.getLocationInParent() == MethodInvocation.EXPRESSION_PROPERTY;
        this.wrapGroupEnd = isFollowedByInvocation
            ? this.tm.lastIndexIn(node.getParent(), TerminalToken.TokenNameInvalid)
            : new FieldAccessAdapter(node).getIdentifierIndex(this.tm);
        // TODO need configuration for this, now only handles line breaks that cannot be removed
        handleWrap(0);
    }

    @Override
    public boolean visit(InfixExpression node) {
        ASTNode parent = node.getParent();
        if ((parent instanceof InfixExpression) && samePrecedence(node, (InfixExpression) parent))
            return true; // this node has been handled higher in the AST

        Operator operator = node.getOperator();
        int wrappingOption = operator == Operator.CONDITIONAL_AND || operator == Operator.CONDITIONAL_OR ? 48 : 16;

        findTokensToWrap(node, true, 0);
        this.wrapParentIndex = this.wrapIndexes.remove(0);
        this.wrapGroupEnd = this.tm.lastIndexIn(node, TerminalToken.TokenNameInvalid);
        for (int i = this.wrapParentIndex; i >= 0; i--) {
            if (!this.tm.get(i).isComment()) {
                this.wrapParentIndex = i;
                break;
            }
        }
        handleWrap(wrappingOption, false, node);
        return true;
    }

    private void findTokensToWrap(InfixExpression node, boolean wrapBeforeOperator, int depth) {
        Expression left = node.getLeftOperand();
        if (left instanceof InfixExpression && samePrecedence(node, (InfixExpression) left)) {
            findTokensToWrap((InfixExpression) left, wrapBeforeOperator, depth + 1);
        } else if (this.wrapIndexes.isEmpty() // always add first operand, it will be taken as wrap parent
            || !wrapBeforeOperator) {
            this.wrapIndexes.add(this.tm.firstIndexIn(left, TerminalToken.TokenNameInvalid));
        }

        Expression right = node.getRightOperand();
        List<Expression> extended = node.extendedOperands();
        for (int i = -1; i < extended.size(); i++) {
            Expression operand = (i == -1) ? right : extended.get(i);
            if (operand instanceof InfixExpression && samePrecedence(node, (InfixExpression) operand)) {
                findTokensToWrap((InfixExpression) operand, wrapBeforeOperator, depth + 1);
            }
            int indexBefore = this.tm.firstIndexBefore(operand, TerminalToken.TokenNameInvalid);
            while (this.tm.get(indexBefore).isComment())
                indexBefore--;
            assert node.getOperator().toString().equals(this.tm.toString(indexBefore));
            int indexAfter = this.tm.firstIndexIn(operand, TerminalToken.TokenNameInvalid);
            this.wrapIndexes.add(wrapBeforeOperator ? indexBefore : indexAfter);
            this.secondaryWrapIndexes.add(wrapBeforeOperator ? indexAfter : indexBefore);

        }
    }

    private boolean samePrecedence(InfixExpression expression1, InfixExpression expression2) {
        return expression1.getOperator().precedence == expression2.getOperator().precedence;
    }

    @Override
    public boolean visit(ConditionalExpression node) {

        List<Integer> before = this.wrapIndexes;
        List<Integer> after = this.secondaryWrapIndexes;
        before.add(this.tm.firstIndexAfter(node.getExpression(), TokenNameQUESTION));
        before.add(this.tm.firstIndexAfter(node.getThenExpression(), TokenNameCOLON));
        after.add(this.tm.firstIndexIn(node.getThenExpression(), TerminalToken.TokenNameInvalid));
        after.add(this.tm.firstIndexIn(node.getElseExpression(), TerminalToken.TokenNameInvalid));
        this.wrapParentIndex = this.tm.lastIndexIn(node.getExpression(), TerminalToken.TokenNameInvalid);
        this.wrapGroupEnd = this.tm.lastIndexIn(node, TerminalToken.TokenNameInvalid);
        handleWrap(48);
        return true;
    }

    @Override
    public boolean visit(ArrayInitializer node) {
        List<Expression> expressions = node.expressions();
        if (!expressions.isEmpty()) {
            prepareElementsList(expressions, TokenNameCOMMA, TokenNameLBRACE);
            handleWrap(48, node);
        }
        int openingBraceIndex = this.tm.firstIndexIn(node, TokenNameLBRACE);
        Token openingBrace = this.tm.get(openingBraceIndex);
        if (openingBrace.isNextLineOnWrap() && openingBrace.getWrapPolicy() == null && openingBraceIndex > 0) {
            // add fake wrap policy to make sure the brace indentation is right
            openingBrace.setWrapPolicy(new WrapPolicy(WrapMode.DISABLED, openingBraceIndex - 1, 0));
        }

        return true;
    }

    @Override
    public boolean visit(Assignment node) {
        int rightSideIndex = this.tm.firstIndexIn(node.getRightHandSide(), TerminalToken.TokenNameInvalid);
        if (this.tm.get(rightSideIndex).getLineBreaksBefore() > 0)
            return true; // must be an array initializer in new line because of brace_position_for_array_initializer

        int operatorIndex = this.tm.firstIndexBefore(node.getRightHandSide(), TerminalToken.TokenNameInvalid);
        while (this.tm.get(operatorIndex).isComment())
            operatorIndex--;
        assert node.getOperator().toString().equals(this.tm.toString(operatorIndex));

        this.wrapIndexes.add(operatorIndex);
        this.secondaryWrapIndexes.add(rightSideIndex);
        this.wrapParentIndex = operatorIndex - 1;
        this.wrapGroupEnd = this.tm.lastIndexIn(node.getRightHandSide(), TerminalToken.TokenNameInvalid);
        handleWrap(16);
        return true;
    }

    @Override
    public boolean visit(VariableDeclarationFragment node) {
        if (node.getInitializer() == null)
            return true;
        int rightSideIndex = this.tm.firstIndexIn(node.getInitializer(), TerminalToken.TokenNameInvalid);
        if (this.tm.get(rightSideIndex).getLineBreaksBefore() > 0)
            return true; // must be an array initializer in new line because of brace_position_for_array_initializer
        int equalIndex = this.tm.firstIndexBefore(node.getInitializer(), TokenNameEQUAL);

        this.wrapIndexes.add(equalIndex);
        this.secondaryWrapIndexes.add(rightSideIndex);
        this.wrapParentIndex = equalIndex - 1;
        this.wrapGroupEnd = this.tm.lastIndexIn(node.getInitializer(), TerminalToken.TokenNameInvalid);
        handleWrap(16);
        return true;
    }

    @Override
    public boolean visit(ForStatement node) {
        int lParen = this.tm.firstIndexIn(node, TokenNameLPAREN);
        int rParen = this.tm.firstIndexBefore(node.getBody(), TokenNameRPAREN);

        List<Expression> initializers = node.initializers();
        if (!initializers.isEmpty())
            this.wrapIndexes.add(this.tm.firstIndexIn(initializers.get(0), TerminalToken.TokenNameInvalid));
        if (node.getExpression() != null)
            this.wrapIndexes.add(this.tm.firstIndexIn(node.getExpression(), TerminalToken.TokenNameInvalid));
        List<Expression> updaters = node.updaters();
        if (!updaters.isEmpty())
            this.wrapIndexes.add(this.tm.firstIndexIn(updaters.get(0), TerminalToken.TokenNameInvalid));
        if (!this.wrapIndexes.isEmpty()) {
            this.wrapParentIndex = lParen;
            this.wrapGroupEnd = rParen;
            handleWrap(16);
        }

        return true;
    }

    @Override
    public boolean visit(TryStatement node) {
        prepareElementsList(node.resources(), TokenNameSEMICOLON, TokenNameLPAREN);
        handleWrap(80);
        return true;
    }

    @Override
    public boolean visit(UnionType node) {
        List<Type> types = node.types();
        if (types.isEmpty())
            return true;
        for (Type type : types) {
            if (this.wrapIndexes.isEmpty()) {
                this.wrapIndexes.add(this.tm.firstIndexIn(type, TerminalToken.TokenNameInvalid));
            } else {
                this.wrapIndexes.add(this.tm.firstIndexBefore(type, TokenNameOR));
                this.secondaryWrapIndexes.add(this.tm.firstIndexIn(type, TerminalToken.TokenNameInvalid));
            }
        }
        this.wrapParentIndex = this.tm.firstIndexBefore(node, TerminalToken.TokenNameInvalid);
        while (this.tm.get(this.wrapParentIndex).isComment())
            this.wrapParentIndex--;
        this.wrapGroupEnd = this.tm.lastIndexIn(types.get(types.size() - 1), TerminalToken.TokenNameInvalid);
        handleWrap(16);
        return true;
    }

    @Override
    public boolean visit(LambdaExpression node) {
        if (node.getBody() instanceof Block) {
            forceContinuousWrapping(node.getBody(), this.tm.firstIndexIn(node, TerminalToken.TokenNameInvalid));
            handleOneLineEnforced(node, ((Block) node.getBody()).statements());
        }
        if (node.hasParentheses()) {
            List<VariableDeclaration> parameters = node.parameters();
            // the legacy formatter didn't like wrapping lambda parameters, so neither do we
            this.currentDepth++;
            handleArguments(parameters, 16);
            this.currentDepth--;
        }
        return true;
    }

    private void handleOneLineEnforced(ASTNode node, List<Statement> statements) {
        if (statements.isEmpty())
            return;
        int openBraceIndex = this.tm.firstIndexBefore(statements.get(0), TokenNameLBRACE);
        int closeBraceIndex = this.tm.firstIndexAfter(statements.get(statements.size() - 1), TokenNameRBRACE);
        if (areKeptOnOneLine(openBraceIndex, closeBraceIndex)) {
            for (Statement statement : statements)
                this.wrapIndexes.add(this.tm.firstIndexIn(statement, TerminalToken.TokenNameInvalid));
            this.wrapParentIndex = openBraceIndex;
            this.wrapGroupEnd = closeBraceIndex;
            this.currentDepth++;
            handleWrap(48 + 4, node);
            this.tm.get(closeBraceIndex)
                .setWrapPolicy(new WrapPolicy(WrapMode.TOP_PRIORITY, openBraceIndex, closeBraceIndex, 0,
                    this.currentDepth, 1, false, false));
            this.currentDepth--;
        }
    }

    private boolean areKeptOnOneLine(int startIndex, int endIndex) {
        return this.tm.stream()
            .skip(startIndex + 1)
            .limit(endIndex - startIndex - 1)
            .allMatch(t -> t.getLineBreaksBefore() == 0 && t.getLineBreaksAfter() == 0);
    }

    @Override
    public boolean visit(FieldDeclaration node) {
        handleAnnotations(node.modifiers(), 49);
        handleVariableDeclarations(node.fragments());
        return true;
    }

    @Override
    public boolean visit(VariableDeclarationStatement node) {
        handleAnnotations(node.modifiers(), 49);
        handleVariableDeclarations(node.fragments());
        return true;
    }

    @Override
    public boolean visit(VariableDeclarationExpression node) {
        handleAnnotations(node.modifiers(), 49);
        handleVariableDeclarations(node.fragments());
        return true;
    }

    @Override
    public boolean visit(SingleVariableDeclaration node) {
        handleAnnotations(node.modifiers(), node.getParent() instanceof EnhancedForStatement ? 49 : 0);
        return true;
    }

    @Override
    public boolean visit(ParameterizedType node) {
        prepareElementsList(node.typeArguments(), TokenNameCOMMA, TokenNameLESS);
        handleWrap(0);
        return true;
    }

    @Override
    public boolean visit(TypeMethodReference node) {
        handleTypeArguments(node.typeArguments());
        return true;
    }

    @Override
    public boolean visit(ExpressionMethodReference node) {
        handleTypeArguments(node.typeArguments());
        return true;
    }

    @Override
    public boolean visit(SuperMethodReference node) {
        handleTypeArguments(node.typeArguments());
        return true;
    }

    @Override
    public boolean visit(CreationReference node) {
        handleTypeArguments(node.typeArguments());
        return true;
    }

    private void handleTypeArguments(List<Type> typeArguments) {
        if (typeArguments.isEmpty())
            return;
        prepareElementsList(typeArguments, TokenNameCOMMA, TokenNameLESS);
        handleWrap(0);
    }

    @Override
    public boolean visit(ExportsDirective node) {
        handleModuleStatement(node.modules(), TokenNameto);
        return true;
    }

    @Override
    public boolean visit(OpensDirective node) {
        handleModuleStatement(node.modules(), TokenNameto);
        return true;
    }

    @Override
    public boolean visit(ProvidesDirective node) {
        handleModuleStatement(node.implementations(), TokenNamewith);
        return true;
    }

    private void handleModuleStatement(List<Name> names, int joiningTokenType) {
        if (names.isEmpty())
            return;
        int joiningTokenIndex = this.tm.firstIndexBefore(names.get(0), joiningTokenType);
        this.wrapParentIndex = this.tm.firstIndexBefore(names.get(0), TokenNameIdentifier);
        this.wrapIndexes.add(joiningTokenIndex);
        prepareElementsList(names, TokenNameCOMMA, TerminalToken.TokenNameInvalid);
        handleWrap(0.875f);
    }

    @Override
    public boolean visit(SwitchCase node) {
        Expression expression = node.getExpression();
        prepareElementsList(expression == null ? List.of() : List.of(expression), TokenNameCOMMA, TokenNamecase);
        handleWrap(16);
        return true;
    }

    @Override
    public boolean visit(AssertStatement node) {
        Expression message = node.getMessage();
        if (message != null) {
            int atColon = this.tm.firstIndexBefore(message, TokenNameCOLON);
            int afterColon = this.tm.firstIndexIn(message, TerminalToken.TokenNameInvalid);

            this.wrapIndexes.add(atColon);
            this.secondaryWrapIndexes.add(afterColon);
            this.wrapParentIndex = this.tm.firstIndexIn(node, TerminalToken.TokenNameInvalid);
            this.wrapGroupEnd = this.tm.lastIndexIn(node, TerminalToken.TokenNameInvalid);
            handleWrap(16);
        }
        return true;
    }

    /**
     * Makes sure all new lines within given node will have wrap policy so that wrap executor will fix their indentation
     * if necessary.
     */
    void forceContinuousWrapping(ASTNode node, int parentIndex) {
        int parentIndent = this.tm.get(parentIndex).getIndent();
        int indentChange = -parentIndent;
        int lineStart = this.tm.findFirstTokenInLine(parentIndex);
        for (int i = parentIndex; i >= lineStart; i--) {
            int align = this.tm.get(i).getAlign();
            if (align > 0) {
                indentChange = -2 * parentIndent + align;
                break;
            }
        }

        Token previous = null;
        int from = this.tm.firstIndexIn(node, TerminalToken.TokenNameInvalid);
        int to = this.tm.lastIndexIn(node, TerminalToken.TokenNameInvalid);
        for (int i = from; i <= to; i++) {
            Token token = this.tm.get(i);
            if ((token.getLineBreaksBefore() > 0 || (previous != null && previous.getLineBreaksAfter() > 0))
                && (token.getWrapPolicy() == null || token.getWrapPolicy().wrapMode() == WrapMode.BLOCK_INDENT)) {
                int extraIndent = token.getIndent() + indentChange;
                token.setWrapPolicy(new WrapPolicy(WrapMode.BLOCK_INDENT, parentIndex, extraIndent));
                token.setIndent(parentIndent + extraIndent);
            }
            previous = token;
        }
    }

    private void handleVariableDeclarations(List<VariableDeclarationFragment> fragments) {
        if (fragments.size() > 1) {
            this.wrapParentIndex = this.tm.firstIndexIn(fragments.get(0), TerminalToken.TokenNameInvalid);
            prepareElementsList(fragments, TokenNameCOMMA, TerminalToken.TokenNameInvalid);
            this.wrapIndexes.remove(0);
            handleWrap(16);
        }
    }

    private void handleArguments(List<? extends ASTNode> arguments, int wrappingOption) {
        this.wrapPenalties.add(1 / 0.875f);
        prepareElementsList(arguments, TokenNameCOMMA, TokenNameLPAREN);
        handleWrap(wrappingOption);
    }

    private void handleAnnotations(List<? extends IExtendedModifier> modifiers, int wrappingOption) {
        Annotation last = null;
        int i;
        for (i = 0; i < modifiers.size(); i++) {
            if (modifiers.get(i).isModifier())
                break;
            Annotation annotation = (Annotation) modifiers.get(i);
            if (i == 0) {
                this.wrapParentIndex = this.tm.firstIndexIn(annotation, TerminalToken.TokenNameInvalid);
            } else {
                this.wrapIndexes.add(this.tm.firstIndexIn(annotation, TerminalToken.TokenNameInvalid));
                this.wrapGroupEnd = this.tm.lastIndexIn(annotation, TerminalToken.TokenNameInvalid);
            }
            last = annotation;
        }
        handleWrap(wrappingOption, last);

        if (i < modifiers.size()) {
            // any annotations following other modifiers will be associated with declaration type
            handleAnnotations(modifiers.subList(i + 1, modifiers.size()), 32);
        }
    }

    private void prepareElementsList(List<? extends ASTNode> elements, int separatorType, int wrapParentType) {
        for (int i = 0; i < elements.size(); i++) {
            ASTNode element = elements.get(i);
            this.wrapIndexes.add(this.tm.firstIndexIn(element, TerminalToken.TokenNameInvalid));
            if (i > 0)
                this.secondaryWrapIndexes.add(this.tm.firstIndexBefore(element, separatorType));
        }
        // wrapIndexes may have been filled with additional values even if arguments is empty
        if (!this.wrapIndexes.isEmpty()) {
            Token firstToken = this.tm.get(this.wrapIndexes.get(0));
            if (this.wrapParentIndex < 0)
                this.wrapParentIndex = this.tm.findIndex(firstToken.originalStart - 1, wrapParentType, false);
            if (!elements.isEmpty() && this.wrapGroupEnd < 0)
                this.wrapGroupEnd
                    = this.tm.lastIndexIn(elements.get(elements.size() - 1), TerminalToken.TokenNameInvalid);
        }
    }

    private void handleWrap(int wrappingOption) {
        handleWrap(wrappingOption, null);
    }

    private void handleWrap(float firstPenaltyMultiplier) {
        this.wrapPenalties.add(firstPenaltyMultiplier);
        handleWrap(16, null);
    }

    private void handleWrap(int wrappingOption, ASTNode parentNode) {
        handleWrap(wrappingOption, true, parentNode);
    }

    private void handleWrap(int wrappingOption, boolean wrapPreceedingComments, ASTNode parentNode) {
        doHandleWrap(wrappingOption, wrapPreceedingComments, parentNode);
        this.wrapIndexes.clear();
        this.secondaryWrapIndexes.clear();
        this.wrapPenalties.clear();
        this.wrapParentIndex = this.wrapGroupEnd = -1;
    }

    private void doHandleWrap(int wrappingOption, boolean wrapPreceedingComments, ASTNode parentNode) {
        if (this.wrapIndexes.isEmpty())
            return;
        assert this.wrapParentIndex >= 0 && this.wrapParentIndex < this.wrapIndexes.get(0);
        assert this.wrapGroupEnd >= this.wrapIndexes.get(this.wrapIndexes.size() - 1);

        while (this.tm.get(this.wrapParentIndex).isComment() && this.wrapParentIndex > 0)
            this.wrapParentIndex--;

        float penalty = this.wrapPenalties.isEmpty() ? 1 : this.wrapPenalties.get(0);
        WrapPolicy policy = getWrapPolicy(wrappingOption, penalty, true, parentNode);

        WrapPolicy existing = this.tm.get(this.wrapIndexes.get(0)).getWrapPolicy();
        if (existing != null && existing.wrapMode() == WrapMode.TOP_PRIORITY) {
            // separate lines if wrapped
            assert existing.wrapParentIndex() == this.wrapParentIndex;
            this.wrapGroupEnd = existing.groupEndIndex();
            policy = new WrapPolicy(WrapMode.TOP_PRIORITY, policy.wrapParentIndex(), this.wrapGroupEnd,
                policy.extraIndent(), policy.structureDepth(), policy.penaltyMultiplier(), true,
                policy.indentOnColumn());
        }

        setTokenWrapPolicy(0, policy, true);

        for (int i = 1; i < this.wrapIndexes.size(); i++) {
            penalty = this.wrapPenalties.size() > i ? this.wrapPenalties.get(i) : 1;
            if (penalty != policy.penaltyMultiplier() || i == 1)
                policy = getWrapPolicy(wrappingOption, penalty, false, parentNode);
            setTokenWrapPolicy(i, policy, wrapPreceedingComments);
        }

        if (!this.secondaryWrapIndexes.isEmpty()) {
            int optionNoAlignment = (wrappingOption & ~112);
            policy = getWrapPolicy(optionNoAlignment, 1, false, parentNode);
            for (int index : this.secondaryWrapIndexes) {
                Token token = this.tm.get(index);
                if (token.getWrapPolicy() == null || token.getWrapPolicy().wrapMode() == WrapMode.BLOCK_INDENT)
                    token.setWrapPolicy(policy);
            }
        }
    }

    private void setTokenWrapPolicy(int wrapIndexesIndex, WrapPolicy policy, boolean wrapPreceedingComments) {
        int index = this.wrapIndexes.get(wrapIndexesIndex);
        if (wrapPreceedingComments) {
            for (int i = index - 1; i >= 0; i--) {
                Token previous = this.tm.get(i);
                if (!previous.isComment())
                    break;
                if (previous.getLineBreaksAfter() == 0 && i == index - 1)
                    index = i;
                if (previous.getLineBreaksBefore() > 0)
                    previous.setWrapPolicy(policy);
            }
            this.wrapIndexes.set(wrapIndexesIndex, index);
        }

        Token token = this.tm.get(index);
        if (token.getWrapPolicy() == WrapPolicy.DISABLE_WRAP)
            return;

        token.setWrapPolicy(policy);
        if (policy.wrapMode() == WrapMode.FORCE) {
            token.breakBefore();
        } else if (token.tokenType == TokenNameCOMMENT_BLOCK) {
            // allow wrap preparator to decide if this comment should be wrapped
            token.clearLineBreaksBefore();
        }
    }

    private WrapPolicy getWrapPolicy(int wrappingOption, float penaltyMultiplier, boolean isFirst, ASTNode parentNode) {
        assert this.wrapParentIndex >= 0 && this.wrapGroupEnd >= 0;
        int extraIndent = 1;
        boolean indentOnColumn = (wrappingOption & 2) != 0;
        boolean isForceWrap = (wrappingOption & 1) != 0;
        boolean isAlreadyWrapped = false;
        if (indentOnColumn) {
            extraIndent = 0;
        } else if (parentNode instanceof Annotation) {
            extraIndent = 0;
        } else if (parentNode instanceof EnumDeclaration) {
            // special behavior for compatibility with legacy formatter
            extraIndent = ((wrappingOption & 4) != 0) ? 2 : 1;

            isAlreadyWrapped = isFirst;
        } else if (parentNode instanceof IfStatement
            || parentNode instanceof ForStatement
            || parentNode instanceof EnhancedForStatement
            || parentNode instanceof WhileStatement) {
            this.wrapParentIndex = this.tm.firstIndexIn(parentNode, TerminalToken.TokenNameInvalid); // only if
            // !indoentOnColumn
        } else if (parentNode instanceof DoStatement) {
            extraIndent = 0;
            this.wrapParentIndex = this.tm.firstIndexIn(parentNode, TerminalToken.TokenNameInvalid); // only if
            // !indoentOnColumn
        }

        WrapMode wrapMode = WrapMode.WHERE_NECESSARY;
        boolean isTopPriority = false;
        switch (wrappingOption & 112) {
            case 0:
                wrapMode = WrapMode.DISABLED;
                isForceWrap = false;
                break;

            case 32:
                isTopPriority = isFirst;
                isForceWrap &= isFirst;
                break;

            case 48:
                isTopPriority = true;
                break;

            case 64:
                isTopPriority = true;
                if (!isFirst)
                    extraIndent++;
                break;

            case 80:
                isTopPriority = !isFirst;
                isForceWrap &= !isFirst;
                break;
        }

        if (isForceWrap) {
            wrapMode = WrapMode.FORCE;
        } else if (isAlreadyWrapped) {
            wrapMode = WrapMode.DISABLED; // to avoid triggering top priority wrapping
        } else if (isTopPriority) {
            wrapMode = WrapMode.TOP_PRIORITY;
        }
        extraIndent *= 4;
        return new WrapPolicy(wrapMode, this.wrapParentIndex, this.wrapGroupEnd, extraIndent, this.currentDepth,
            penaltyMultiplier, isFirst, indentOnColumn);
    }

    public void finishUp(List<Region> regions) {
        preserveExistingLineBreaks();
        applyBreaksOutsideRegions(regions);
        new WrapExecutor(this.tm, this.options, regions).executeWraps();
        wrapComments();

    }

    private void preserveExistingLineBreaks() {
        // normally n empty lines = n+1 line breaks, but not at the file start and end
        Token first = this.tm.get(0);
        int startingBreaks = first.getLineBreaksBefore();
        first.clearLineBreaksBefore();
        first.putLineBreaksBefore(startingBreaks - 1);

        this.tm.traverse(0, new TokenTraverser() {

            @Override
            protected boolean token(Token token, int index) {
                int lineBreaks = getLineBreaksToPreserve(getPrevious(), token);
                if (lineBreaks > 1 || index == 0)
                    token.putLineBreaksBefore(lineBreaks);
                return true;
            }
        });

        Token last = this.tm.get(this.tm.size() - 1);
        last.clearLineBreaksAfter();
        int endingBreaks = getLineBreaksToPreserve(last, null);
        if (endingBreaks > 0) {
            last.putLineBreaksAfter(endingBreaks);
        } else if ((this.kind & (8 | 128)) != 0) {
            last.breakAfter();
        }
    }

    int getLineBreaksToPreserve(Token token1, Token token2) {
        if ((token1 != null && !token1.isPreserveLineBreaksAfter())
            || (token2 != null && !token2.isPreserveLineBreaksBefore())) {
            return 0;
        }
        int lineBreaks = WrapPreparator.this.tm.countLineBreaksBetween(token1, token2);
        int toPreserve = 1;
        if (token1 != null && token2 != null)
            toPreserve++; // n empty lines = n+1 line breaks, except for file start and end
        return Math.min(lineBreaks, toPreserve);
    }

    private void applyBreaksOutsideRegions(List<Region> regions) {
        String source = this.tm.getSource();
        int previousRegionEnd = 0;
        for (Region region : regions) {
            int index = this.tm.findIndex(previousRegionEnd, TerminalToken.TokenNameInvalid, true);
            Token token = this.tm.get(index);
            if (this.tm.countLineBreaksBetween(source, previousRegionEnd,
                Math.min(token.originalStart, region.getOffset())) > 0)
                token.breakBefore();
            for (index++; index < this.tm.size(); index++) {
                Token next = this.tm.get(index);
                if (next.originalStart > region.getOffset()) {
                    if (this.tm.countLineBreaksBetween(source, token.originalEnd, region.getOffset()) > 0)
                        next.breakBefore();
                    break;
                }
                if (this.tm.countLineBreaksBetween(token, next) > 0)
                    next.breakBefore();
                token = next;
            }
            previousRegionEnd = region.getOffset() + region.getLength() - 1;
        }
    }

    private void wrapComments() {
        CommentWrapExecutor commentWrapper = new CommentWrapExecutor(this.tm, this.options);
        boolean isNLSTagInLine = false;
        for (int i = 0; i < this.tm.size(); i++) {
            Token token = this.tm.get(i);
            if (token.getLineBreaksBefore() > 0 || token.getLineBreaksAfter() > 0)
                isNLSTagInLine = false;
            if (token.hasNLSTag()) {
                assert token.tokenType == TokenNameStringLiteral;
                isNLSTagInLine = true;
            }
            List<Token> structure = token.getInternalStructure();
            if (token.isComment() && structure != null && !structure.isEmpty() && !isNLSTagInLine) {
                int startPosition = this.tm.getPositionInLine(i);
                if (token.tokenType == TokenNameCOMMENT_LINE) {
                    commentWrapper.wrapLineComment(token, startPosition);
                } else {
                    assert token.tokenType == TokenNameCOMMENT_BLOCK || token.tokenType == TokenNameCOMMENT_JAVADOC;
                    commentWrapper.wrapMultiLineComment(token, startPosition, false, false);
                }
            }
        }
    }

}
