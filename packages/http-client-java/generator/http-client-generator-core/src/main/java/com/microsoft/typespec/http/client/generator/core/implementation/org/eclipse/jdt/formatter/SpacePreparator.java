// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2014, 2025 Mateusz Matela and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 *
 * Contributors:
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Formatter does not format Java code correctly, especially when max line width is set - https://bugs.eclipse.org/303519
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] IndexOutOfBoundsException in TokenManager - https://bugs.eclipse.org/462945
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] follow up bug for comments - https://bugs.eclipse.org/458208
 *     IBM Corporation - DOM AST changes for JEP 354
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.*;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.ScannerHelper;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.InfixExpression.Operator;
import java.util.ArrayList;
import java.util.List;

public class SpacePreparator extends ASTVisitor {

    TokenManager tm;

    public SpacePreparator(TokenManager tokenManager) {
        this.tm = tokenManager;

    }

    @Override
    public boolean preVisit2(ASTNode node) {
        return (node.getFlags() & 1) == 0;
    }

    @Override
    public boolean visit(TypeDeclaration node) {
        if (this.tm.isFake(node))
            return true;

        handleToken(node.getName(), TokenNameIdentifier, true, false);

        List<TypeParameter> typeParameters = node.typeParameters();
        handleTypeParameters(typeParameters);

        if (!node.superInterfaceTypes().isEmpty())
            handleTokenAfter(node.getName(), node.isInterface() ? TokenNameextends : TokenNameimplements, true, true);
        if (node.getSuperclassType() != null)
            handleTokenAfter(node.getName(), TokenNameextends, true, true);

        handleToken(node.getName(), TokenNameLBRACE, true, false);
        handleCommas(node.superInterfaceTypes());
        return true;
    }

    @Override
    public boolean visit(EnumDeclaration node) {
        handleToken(node.getName(), TokenNameLBRACE, true, false);
        handleCommas(node.superInterfaceTypes());
        handleCommas(node.enumConstants());
        return true;
    }

    @Override
    public boolean visit(EnumConstantDeclaration node) {
        List<Expression> arguments = node.arguments();
        if (!arguments.isEmpty()) {
            this.tm.firstTokenIn(node, TokenNameLPAREN);

            handleTokenAfter(arguments.get(arguments.size() - 1), TokenNameRPAREN, false, false);
        } else {
            // look for empty parenthesis, may not be there
            int from = this.tm.firstIndexIn(node.getName(), TokenNameIdentifier) + 1;
            AnonymousClassDeclaration classDeclaration = node.getAnonymousClassDeclaration();
            int to = classDeclaration != null
                ? this.tm.firstIndexBefore(classDeclaration, TerminalToken.TokenNameInvalid)
                : this.tm.lastIndexIn(node, TerminalToken.TokenNameInvalid);
            for (int i = from; i <= to; i++) {
                if (this.tm.get(i).tokenType == TokenNameLPAREN) {
                    break;
                }
            }
        }

        handleCommas(arguments);
        return true;
    }

    @Override
    public boolean visit(AnonymousClassDeclaration node) {
        handleToken(node, TokenNameLBRACE, true, false);
        return true;
    }

    @Override
    public boolean visit(MethodDeclaration node) {
        handleToken(node.getName(), TokenNameIdentifier, true, false);

        List<SingleVariableDeclaration> params = node.parameters();
        handleToken(node.getName(), TokenNameLPAREN, false, false);

        if (node.getReceiverType() != null) {
            params = new ArrayList<>(params);
            params.add(0, null); // space for explicit receiver, null OK - first value not read in handleCommas
        }
        handleCommas(params);

        if (node.getBody() != null)
            this.tm.firstTokenIn(node.getBody(), TokenNameLBRACE).spaceBefore();

        if (node.getReceiverType() != null)
            this.tm.lastTokenIn(node.getReceiverType(), TerminalToken.TokenNameInvalid).spaceAfter();

        List<Type> thrownExceptionTypes = node.thrownExceptionTypes();
        if (!thrownExceptionTypes.isEmpty()) {
            handleTokenBefore(thrownExceptionTypes.get(0), TokenNamethrows, true, false);
            handleCommas(thrownExceptionTypes);
        }

        List<TypeParameter> typeParameters = node.typeParameters();
        if (!typeParameters.isEmpty()) {
            handleTypeParameters(typeParameters);
            handleTokenBefore(typeParameters.get(0), TokenNameLESS, true, false);
            handleTokenAfter(typeParameters.get(typeParameters.size() - 1), TokenNameGREATER, false, true);
        }

        return true;
    }

    private void handleTypeParameters(List<TypeParameter> typeParameters) {
        if (!typeParameters.isEmpty()) {
            handleTokenBefore(typeParameters.get(0), TokenNameLESS, false, false);
            handleTokenAfter(typeParameters.get(typeParameters.size() - 1), TokenNameGREATER, false, true);
            handleCommas(typeParameters);
        }
    }

    @Override
    public boolean visit(FieldDeclaration node) {
        handleToken(node.fragments().get(0), TokenNameIdentifier, true, false);
        handleCommas(node.fragments());

        return true;
    }

    @Override
    public boolean visit(VariableDeclarationStatement node) {
        handleToken(node.fragments().get(0), TokenNameIdentifier, true, false);
        handleCommas(node.fragments());
        return true;
    }

    @Override
    public boolean visit(VariableDeclarationFragment node) {
        if (node.getInitializer() != null) {
            handleToken(node.getName(), TokenNameEQUAL, true, true);
        }
        return true;
    }

    @Override
    public void endVisit(SingleVariableDeclaration node) {
        // this must be endVisit in case a space added by a visit on a child node needs to be cleared
        if (node.isVarargs()) {
            handleTokenBefore(node.getName(), TokenNameELLIPSIS, false, true);
            List<Annotation> varargsAnnotations = node.varargsAnnotations();
            if (!varargsAnnotations.isEmpty()) {
                this.tm.firstTokenIn(varargsAnnotations.get(0), TokenNameAT).spaceBefore();
                this.tm
                    .lastTokenIn(varargsAnnotations.get(varargsAnnotations.size() - 1), TerminalToken.TokenNameInvalid)
                    .clearSpaceAfter();
            }
        } else {
            handleToken(node.getName(), TokenNameIdentifier, true, false);
        }
    }

    @Override
    public boolean visit(SwitchStatement node) {
        handleToken(node, TokenNameLPAREN, true, false);
        handleTokenAfter(node.getExpression(), TokenNameRPAREN, false, false);
        handleTokenAfter(node.getExpression(), TokenNameLBRACE, true, false);

        return true;
    }

    @Override
    public boolean visit(SwitchCase node) {
        handleToken(this.tm.lastTokenIn(node, TokenNameCOLON), false, false);
        if (!node.isDefault()) {
            handleToken(node, TokenNamecase, false, true);
        }
        return true;
    }

    @Override
    public boolean visit(DoStatement node) {
        handleTokenBefore(node.getExpression(), TokenNameLPAREN, true, false);
        handleTokenBefore(node.getExpression(), TokenNamewhile, true, false);
        handleTokenAfter(node.getExpression(), TokenNameRPAREN, false, false);
        return true;
    }

    @Override
    public boolean visit(WhileStatement node) {
        handleToken(node, TokenNameLPAREN, true, false);
        handleTokenBefore(node.getBody(), TokenNameRPAREN, false, false);
        handleLoopBody(node.getBody());
        return true;
    }

    @Override
    public boolean visit(SynchronizedStatement node) {
        handleToken(node, TokenNameLPAREN, true, false);
        handleTokenBefore(node.getBody(), TokenNameRPAREN, false, false);
        return true;
    }

    @Override
    public boolean visit(TryStatement node) {
        List<Expression> resources = node.resources();
        if (!resources.isEmpty()) {
            handleToken(node, TokenNameLPAREN, true, false);
            handleTokenBefore(node.getBody(), TokenNameRPAREN, false, false);
            for (int i = 1; i < resources.size(); i++) {
                handleTokenBefore(resources.get(i), TokenNameSEMICOLON, false, true);
            }
            // there can be a semicolon after the last resource
            int index = this.tm.firstIndexAfter(resources.get(resources.size() - 1), TerminalToken.TokenNameInvalid);
            while (index < this.tm.size()) {
                Token token = this.tm.get(index++);
                if (token.tokenType == TokenNameSEMICOLON) {
                    handleToken(token, false, false);
                } else if (token.tokenType == TokenNameRPAREN) {
                    break;
                }
            }
        }
        return true;
    }

    @Override
    public boolean visit(CatchClause node) {
        handleToken(node, TokenNameLPAREN, true, false);
        handleTokenBefore(node.getBody(), TokenNameRPAREN, false, false);
        return true;
    }

    @Override
    public boolean visit(AssertStatement node) {
        this.tm.firstTokenIn(node, TokenNameassert).spaceAfter();
        if (node.getMessage() != null) {
            handleTokenBefore(node.getMessage(), TokenNameCOLON, true, true);
        }
        return true;
    }

    @Override
    public boolean visit(ReturnStatement node) {
        if (node.getExpression() != null) {
            this.tm.firstTokenIn(node, TokenNamereturn).spaceAfter();
        }
        return true;
    }

    @Override
    public boolean visit(ThrowStatement node) {
        this.tm.firstTokenIn(node, TokenNamethrow).spaceAfter();
        return true;
    }

    @Override
    public boolean visit(LabeledStatement node) {
        handleToken(node, TokenNameCOLON, false, true);
        return true;
    }

    @Override
    public boolean visit(AnnotationTypeDeclaration node) {
        handleToken(node, TokenNameAT, true, false);
        handleToken(node.getName(), TokenNameLBRACE, true, false);
        return true;
    }

    @Override
    public boolean visit(AnnotationTypeMemberDeclaration node) {
        handleToken(node.getName(), TokenNameIdentifier, true, false);
        handleToken(node.getName(), TokenNameLPAREN, false, false);
        handleEmptyParens(node.getName());
        if (node.getDefault() != null)
            handleTokenBefore(node.getDefault(), TokenNamedefault, true, true);
        return true;
    }

    @Override
    public boolean visit(NormalAnnotation node) {
        handleAnnotation(node, true);
        handleCommas(node.values());
        return true;
    }

    @Override
    public boolean visit(MemberValuePair node) {
        handleToken(node, TokenNameEQUAL, true, true);
        return true;
    }

    @Override
    public boolean visit(SingleMemberAnnotation node) {
        handleAnnotation(node, true);
        return true;
    }

    @Override
    public boolean visit(MarkerAnnotation node) {
        handleAnnotation(node, false);
        return true;
    }

    private void handleAnnotation(Annotation node, boolean handleParenthesis) {
        handleToken(node, TokenNameAT, false, false);
        if (handleParenthesis) {
            handleToken(node, TokenNameLPAREN, false, false);

        }

        ASTNode parent = node.getParent();
        boolean skipSpaceAfter = parent instanceof Annotation
            || parent instanceof MemberValuePair
            || (parent instanceof AnnotationTypeMemberDeclaration
                && ((AnnotationTypeMemberDeclaration) parent).getDefault() == node)
            || parent instanceof ArrayInitializer;
        if (!skipSpaceAfter)
            this.tm.lastTokenIn(node, TerminalToken.TokenNameInvalid).spaceAfter();
    }

    @Override
    public boolean visit(LambdaExpression node) {
        handleToken(node, TokenNameARROW, true, true);
        List<VariableDeclaration> parameters = node.parameters();
        if (node.hasParentheses()) {
            if (!handleEmptyParens(node)) {
                handleToken(node, TokenNameLPAREN, false, false);

                handleTokenBefore(node.getBody(), TokenNameRPAREN, false, false);
            }
            handleCommas(parameters);
        }
        return true;
    }

    @Override
    public boolean visit(Block node) {

        ASTNode parent = node.getParent();
        if (parent.getLength() == 0)
            return true; // this is a fake block created by parsing in statements mode
        if (parent instanceof MethodDeclaration)
            return true; // spaces handled in #visit(MethodDeclaration)

        handleToken(node, TokenNameLBRACE, true, false);
        if ((parent instanceof Statement || parent instanceof CatchClause)) {
            int closeBraceIndex = this.tm.lastIndexIn(node, TokenNameRBRACE);
            this.tm.get(closeBraceIndex).spaceAfter();
        }
        return true;
    }

    @Override
    public boolean visit(IfStatement node) {
        handleToken(node, TokenNameLPAREN, true, false);

        Statement thenStatement = node.getThenStatement();
        handleTokenBefore(thenStatement, TokenNameRPAREN, false, false);

        handleLoopBody(thenStatement);

        return true;
    }

    @Override
    public boolean visit(ForStatement node) {
        handleToken(node, TokenNameLPAREN, true, false);
        handleTokenBefore(node.getBody(), TokenNameRPAREN, false, false);
        handleCommas(node.initializers());
        handleCommas(node.updaters());

        boolean part2Empty = node.getExpression() == null;
        boolean part3Empty = node.updaters().isEmpty();
        handleToken(node, TokenNameSEMICOLON, false, !part2Empty);
        handleTokenBefore(node.getBody(), TokenNameSEMICOLON, false, !part3Empty);

        handleLoopBody(node.getBody());
        return true;
    }

    @Override
    public boolean visit(VariableDeclarationExpression node) {
        ASTNode parent = node.getParent();
        if (parent instanceof ForStatement) {
            handleCommas(node.fragments());
        } else if (parent instanceof ExpressionStatement) {
            handleCommas(node.fragments());
        }
        this.tm.firstTokenAfter(node.getType(), TerminalToken.TokenNameInvalid).spaceBefore();
        return true;
    }

    @Override
    public boolean visit(EnhancedForStatement node) {
        handleToken(node, TokenNameLPAREN, true, false);
        handleTokenBefore(node.getBody(), TokenNameRPAREN, false, false);
        handleTokenAfter(node.getParameter(), TokenNameCOLON, true, true);
        handleLoopBody(node.getBody());
        return true;
    }

    @Override
    public boolean visit(MethodInvocation node) {
        handleTypeArguments(node.typeArguments());
        handleInvocation(node.getName());
        handleCommas(node.arguments());
        return true;
    }

    @Override
    public boolean visit(SuperMethodInvocation node) {
        handleTypeArguments(node.typeArguments());
        handleInvocation(node.getName());
        handleCommas(node.arguments());
        return true;
    }

    @Override
    public boolean visit(ClassInstanceCreation node) {
        List<Type> typeArguments = node.typeArguments();
        handleTypeArguments(typeArguments);
        handleInvocation(node.getType());
        if (!typeArguments.isEmpty()) {
            handleTokenBefore(typeArguments.get(0), TokenNamenew, false, true); // fix for: new<Integer>A<String>()
        }
        handleCommas(node.arguments());
        return true;
    }

    @Override
    public boolean visit(ConstructorInvocation node) {
        handleTypeArguments(node.typeArguments());
        handleInvocation(node);
        handleCommas(node.arguments());
        return true;
    }

    @Override
    public boolean visit(SuperConstructorInvocation node) {
        handleTypeArguments(node.typeArguments());
        handleInvocation(node);
        handleCommas(node.arguments());
        return true;
    }

    private void handleInvocation(ASTNode nodeBeforeOpeningParen) {
        handleToken(nodeBeforeOpeningParen, TokenNameLPAREN, false, false);
    }

    @Override
    public boolean visit(Assignment node) {
        handleOperator(node.getOperator().toString(), node.getRightHandSide(), true, true);
        return true;
    }

    @Override
    public boolean visit(InfixExpression node) {
        Operator operator = node.getOperator();
        handleOperator(operator.toString(), node.getRightOperand(), true, true);
        List<Expression> extendedOperands = node.extendedOperands();
        for (Expression operand : extendedOperands) {
            handleOperator(operator.toString(), operand, true, true);
        }
        return true;
    }

    @Override
    public boolean visit(PrefixExpression node) {
        handleOperator(node.getOperator().toString(), node.getOperand(), false, false);
        return true;
    }

    private void handleOperator(String operator, ASTNode nodeAfter, boolean spaceBefore, boolean spaceAfter) {
        if (spaceBefore || spaceAfter) {
            int i = this.tm.firstIndexBefore(nodeAfter, TerminalToken.TokenNameInvalid);
            while (!operator.equals(this.tm.toString(i))) {
                i--;
            }
            handleToken(this.tm.get(i), spaceBefore, spaceAfter);
        }
    }

    @Override
    public boolean visit(ParenthesizedExpression node) {
        handleToken(node, TokenNameLPAREN, false, false);
        handleTokenAfter(node.getExpression(), TokenNameRPAREN, false, false);
        return true;
    }

    @Override
    public boolean visit(CastExpression node) {
        handleToken(node, TokenNameLPAREN, false, false);
        handleTokenBefore(node.getExpression(), TokenNameRPAREN, false, true);
        return true;
    }

    @Override
    public boolean visit(IntersectionType node) {
        List<Type> types = node.types();
        for (int i = 1; i < types.size(); i++)
            handleTokenBefore(types.get(i), TokenNameAND, true, true);
        return true;
    }

    @Override
    public boolean visit(ConditionalExpression node) {
        handleTokenBefore(node.getThenExpression(), TokenNameQUESTION, true, true);
        handleTokenBefore(node.getElseExpression(), TokenNameCOLON, true, true);
        return true;
    }

    @Override
    public boolean visit(ArrayType node) {
        List<Dimension> dimensions = node.dimensions();
        for (Dimension dimension : dimensions) {
            handleToken(dimension, TokenNameLBRACKET, false, false);
            handleEmptyBrackets(dimension);
        }
        return true;
    }

    @Override
    public boolean visit(ArrayAccess node) {
        handleTokenBefore(node.getIndex(), TokenNameLBRACKET, false, false);
        handleTokenAfter(node.getIndex(), TokenNameRBRACKET, false, false);
        return true;
    }

    @Override
    public boolean visit(ArrayCreation node) {
        List<Expression> dimensions = node.dimensions();
        for (Expression dimension : dimensions) {
            handleTokenBefore(dimension, TokenNameLBRACKET, false, false);
            handleTokenAfter(dimension, TokenNameRBRACKET, false, false);
        }
        return true;
    }

    @Override
    public boolean visit(ArrayInitializer node) {
        int openingBraceIndex = this.tm.firstIndexIn(node, TokenNameLBRACE);
        int closingBraceIndex = this.tm.lastIndexIn(node, TokenNameRBRACE);
        Token lastToken = this.tm.get(closingBraceIndex - 1);
        if (lastToken.tokenType == TokenNameLBRACE) {
            handleToken(this.tm.get(openingBraceIndex), !(node.getParent() instanceof ArrayInitializer)
                && !(node.getParent() instanceof SingleMemberAnnotation), true);
        } else {
            boolean endsWithComma = lastToken.tokenType == TokenNameCOMMA;
            handleToken(this.tm.get(openingBraceIndex),
                !(node.getParent() instanceof ArrayInitializer)
                    && !(node.getParent() instanceof SingleMemberAnnotation),
                !(endsWithComma && node.expressions().isEmpty()));
            handleCommas(node.expressions());
            if (endsWithComma) {
                handleToken(lastToken, false, false); // true);
            }
            handleToken(this.tm.get(closingBraceIndex), !(endsWithComma && node.expressions().isEmpty()), false);
        }
        return true;
    }

    @Override
    public boolean visit(ParameterizedType node) {
        List<Type> typeArguments = node.typeArguments();
        boolean hasArguments = !typeArguments.isEmpty();
        handleTokenAfter(node.getType(), TokenNameLESS, false, false);
        if (hasArguments) {
            handleTokenAfter(typeArguments.get(typeArguments.size() - 1), TokenNameGREATER, false, false);
            handleCommas(node.typeArguments());
        }
        return true;
    }

    @Override
    public boolean visit(TypeParameter node) {
        List<Type> typeBounds = node.typeBounds();
        for (int i = 1; i < typeBounds.size(); i++) {
            handleTokenBefore(typeBounds.get(i), TokenNameAND, true, true);
        }
        return true;
    }

    @Override
    public boolean visit(WildcardType node) {
        handleToken(node, TokenNameQUESTION, false, node.getBound() != null);
        return true;
    }

    @Override
    public boolean visit(UnionType node) {
        List<Type> types = node.types();
        for (int i = 1; i < types.size(); i++)
            handleTokenBefore(types.get(i), TokenNameOR, true, true);
        return true;
    }

    @Override
    public boolean visit(Dimension node) {
        List<Annotation> annotations = node.annotations();
        if (!annotations.isEmpty())
            handleToken(annotations.get(0), TokenNameAT, true, false);
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
        handleTokenBefore(typeArguments.get(0), TokenNameLESS, false, false);
        handleTokenAfter(typeArguments.get(typeArguments.size() - 1), TokenNameGREATER, false, false);
        handleCommas(typeArguments);
    }

    @Override
    public boolean visit(InstanceofExpression node) {
        handleTokenAfter(node.getLeftOperand(), TokenNameinstanceof, true, true);
        return true;
    }

    @Override
    public boolean visit(ModuleDeclaration node) {
        handleToken(node.getName(), TokenNameLBRACE, true, false);
        return true;
    }

    @Override
    public boolean visit(ExportsDirective node) {
        handleModuleStatementCommas(node.modules());
        return true;
    }

    @Override
    public boolean visit(OpensDirective node) {
        handleModuleStatementCommas(node.modules());
        return true;
    }

    @Override
    public boolean visit(ProvidesDirective node) {
        handleModuleStatementCommas(node.implementations());
        return true;
    }

    private void handleModuleStatementCommas(List<Name> names) {
        // using settings for fields for now, add new settings if necessary
        handleCommas(names);
    }

    private void handleCommas(List<? extends ASTNode> nodes) {
        for (int i = 1; i < nodes.size(); i++) {
            handleTokenBefore(nodes.get(i), TokenNameCOMMA, false, true);
        }
    }

    private void handleToken(ASTNode node, int tokenType, boolean spaceBefore, boolean spaceAfter) {
        if (spaceBefore || spaceAfter) {
            Token token = this.tm.get(this.tm.findIndex(node.getStartPosition(), tokenType, true));
            // ^not the same as "firstTokenIn(node, tokenType)" - do not assert the token is inside the node
            handleToken(token, spaceBefore, spaceAfter);
        }
    }

    private void handleTokenBefore(ASTNode node, int tokenType, boolean spaceBefore, boolean spaceAfter) {
        if (spaceBefore || spaceAfter) {
            Token token = this.tm.firstTokenBefore(node, tokenType);
            handleToken(token, spaceBefore, spaceAfter);
        }
    }

    private void handleTokenAfter(ASTNode node, int tokenType, boolean spaceBefore, boolean spaceAfter) {
        if (tokenType == TokenNameGREATER) {
            // there could be ">>" or ">>>" instead, get rid of them
            int index = this.tm.lastIndexIn(node, TerminalToken.TokenNameInvalid);
            for (int i = index; i < index + 2; i++) {
                Token token = this.tm.get(i);
                if (token.tokenType == TokenNameRIGHT_SHIFT || token.tokenType == TokenNameUNSIGNED_RIGHT_SHIFT) {
                    this.tm.remove(i);
                    for (int j = 0; j < (token.tokenType == TokenNameRIGHT_SHIFT ? 2 : 3); j++) {
                        this.tm.insert(i + j,
                            new Token(token.originalStart + j, token.originalStart + j, TokenNameGREATER));
                    }
                }
            }
        }
        if (spaceBefore || spaceAfter) {
            Token token = this.tm.firstTokenAfter(node, tokenType);
            handleToken(token, spaceBefore, spaceAfter);
        }
    }

    private void handleToken(Token token, boolean spaceBefore, boolean spaceAfter) {
        if (spaceBefore)
            token.spaceBefore();
        if (spaceAfter)
            token.spaceAfter();
    }

    private boolean handleEmptyParens(ASTNode nodeBeforeParens) {
        int openingIndex = this.tm.findIndex(nodeBeforeParens.getStartPosition(), TokenNameLPAREN, true);
        return this.tm.get(openingIndex + 1).tokenType == TokenNameRPAREN;
    }

    private void handleEmptyBrackets(ASTNode nodeContainingBrackets) {
        int openingIndex = this.tm.firstIndexIn(nodeContainingBrackets, TokenNameLBRACKET);
        this.tm.get(openingIndex + 1);
    }

    private void handleLoopBody(Statement loopBody) {
        /* space before body statement may be needed if it will stay on the same line */
        int firstTokenIndex = this.tm.firstIndexIn(loopBody, TerminalToken.TokenNameInvalid);
        if (!(loopBody instanceof Block)
            && !(loopBody instanceof EmptyStatement)
            && !this.tm.get(firstTokenIndex - 1).isComment()) {
            this.tm.get(firstTokenIndex).spaceBefore();
        }
    }

    public void finishUp() {
        this.tm.traverse(0, new TokenTraverser() {
            boolean isPreviousJIDP = false;

            @Override
            protected boolean token(Token token, int index) {
                // put space between consecutive keywords, numbers or identifiers
                char c = SpacePreparator.this.tm.charAt(token.originalStart);
                boolean isJIDP = ScannerHelper.isJavaIdentifierPart(c);
                if ((isJIDP || c == '@') && this.isPreviousJIDP)
                    getPrevious().spaceAfter();
                this.isPreviousJIDP = isJIDP;

                switch (token.tokenType) {
                    case TokenNamePLUS:
                        if (getNext().tokenType == TokenNamePLUS || getNext().tokenType == TokenNamePLUS_PLUS)
                            token.spaceAfter();
                        break;

                    case TokenNameMINUS:
                        if (getNext().tokenType == TokenNameMINUS || getNext().tokenType == TokenNameMINUS_MINUS)
                            token.spaceAfter();
                        break;

                    default:
                        break;
                }
                return true;
            }
        });
    }
}
