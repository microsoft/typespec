// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using System.Collections;
using System.Collections.Generic;
using AutoRest.CSharp.Common.Input;
using AutoRest.CSharp.Common.Output.Expressions.KnownValueExpressions;
using AutoRest.CSharp.Common.Output.Expressions.Statements;
using AutoRest.CSharp.Common.Output.Expressions.ValueExpressions;
using AutoRest.CSharp.Common.Output.Models;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Generation.Writers;
using AutoRest.CSharp.Input.Source;
using AutoRest.CSharp.Output.Models.Shared;
using static AutoRest.CSharp.Common.Output.Models.Snippets;

namespace AutoRest.CSharp.Output.Models.Types
{
    internal class ChangeTrackingListProvider : ExpressionTypeProvider
    {
        private static readonly Lazy<ChangeTrackingListProvider> _instance = new(() => new ChangeTrackingListProvider(Configuration.Namespace, null));

        private class ChangeTrackingListTemplate<T> { }

        private readonly MethodSignature _ensureListSignature;
        private readonly MethodSignature _getEnumeratorSignature;
        private readonly CSharpType _t;
        private readonly FieldDeclaration _innerListField;
        private readonly CSharpType _tArray;
        private readonly Parameter _tParam;
        private readonly Parameter _indexParam = new Parameter("index", null, typeof(int), null, ValidationType.None, null);
        private VariableReference _innerList;
        private readonly CSharpType _iListOfT;
        private readonly CSharpType _iReadOnlyListOfT;

        private BoolExpression IsUndefined { get; } = new BoolExpression(new MemberExpression(This, "IsUndefined"));
        private InvokeInstanceMethodExpression EnsureList { get; init; }

        public static ChangeTrackingListProvider Instance => _instance.Value;

        private ChangeTrackingListProvider(string defaultNamespace, SourceInputModel? sourceInputModel)
            : base(defaultNamespace, sourceInputModel)
        {
            _t = typeof(ChangeTrackingListTemplate<>).GetGenericArguments()[0];
            _iListOfT = new CSharpType(typeof(IList<>), _t);
            _iReadOnlyListOfT = new CSharpType(typeof(IReadOnlyList<>), _t);

            _ensureListSignature = new MethodSignature("EnsureList", null, null, MethodSignatureModifiers.Public, _iListOfT, null, Array.Empty<Parameter>());
            _getEnumeratorSignature = new MethodSignature("GetEnumerator", null, null, MethodSignatureModifiers.Public, new CSharpType(typeof(IEnumerator<>), _t), null, Array.Empty<Parameter>());
            _innerListField = new FieldDeclaration(FieldModifiers.Private, _iListOfT, "_innerList");
            _innerList = new VariableReference(_iListOfT, _innerListField.Declaration);
            _tArray = typeof(ChangeTrackingListTemplate<>).GetGenericArguments()[0].MakeArrayType();
            _tParam = new Parameter("item", null, _t, null, ValidationType.None, null);
            DeclarationModifiers = TypeSignatureModifiers.Internal;
            EnsureList = This.Invoke(_ensureListSignature);
        }

        protected override string DefaultName => "ChangeTrackingList";

        protected override IEnumerable<Method> BuildConstructors()
        {
            yield return new Method(new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, Array.Empty<Parameter>()), EmptyStatement);
            var iListParam = new Parameter("innerList", null, _iListOfT, null, ValidationType.None, null);
            var iListSignature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, new Parameter[] { iListParam });
            var iListVariable = new ParameterReference(iListParam);
            var iListBody = new MethodBodyStatement[]
            {
                new IfStatement(NotEqual(iListVariable, Null))
                {
                    new AssignValueStatement(_innerList, iListVariable)
                }
            };

            yield return new Method(iListSignature, iListBody);
            var iReadOnlyListParam = new Parameter("innerList", null, _iReadOnlyListOfT, null, ValidationType.None, null);
            var iReadOnlyListSignature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, new Parameter[] { iReadOnlyListParam });
            var iReadOnlyListVariable = new ParameterReference(iReadOnlyListParam);
            var iReadOnlyListBody = new MethodBodyStatement[]
            {
                new IfStatement(NotEqual(iReadOnlyListVariable, Null))
                {
                    new AssignValueStatement(_innerList, Linq.ToList(iReadOnlyListVariable))
                }
            };

            yield return new Method(iReadOnlyListSignature, iReadOnlyListBody);
        }

        protected override IEnumerable<CSharpType> BuildTypeArguments()
        {
            yield return _t;
        }

        protected override IEnumerable<CSharpType> BuildImplements()
        {
            yield return _iListOfT;
            yield return _iReadOnlyListOfT;
        }

        protected override IEnumerable<FieldDeclaration> BuildFields()
        {
            yield return _innerListField;
        }

        protected override IEnumerable<PropertyDeclaration> BuildProperties()
        {
            yield return new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(bool), "IsUndefined", new ExpressionPropertyBody(Equal(_innerList, Null)));
            yield return BuildCount();
            yield return BuildIsReadOnly();
            yield return BuildIndexer();
        }

        private PropertyDeclaration BuildIsReadOnly()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(bool), "IsReadOnly",
                        new ExpressionPropertyBody(new TernaryConditionalOperator(
                            IsUndefined,
                            False,
                            new MemberExpression(EnsureList, "IsReadOnly"))));
        }

        private PropertyDeclaration BuildCount()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(int), "Count",
                new ExpressionPropertyBody(new TernaryConditionalOperator(
                    IsUndefined,
                    Literal(0),
                    new MemberExpression(EnsureList, "Count"))));
        }

        private PropertyDeclaration BuildIndexer()
        {
            return new PropertyDeclaration(null, MethodSignatureModifiers.Public, _t, "this", new MethodPropertyBody(
                new MethodBodyStatement[]
                {
                    new IfStatement(IsUndefined)
                    {
                        Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(new ParameterReference(_indexParam))))
                    },
                    Return(new ArrayElementExpression(EnsureList, new ParameterReference(_indexParam))),
                },
                new MethodBodyStatement[]
                {
                    new IfStatement(IsUndefined)
                    {
                        Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(new ParameterReference(_indexParam))))
                    },
                    new AssignValueStatement(
                            new ArrayElementExpression(EnsureList, new ParameterReference(_indexParam)),
                            new KeywordExpression("value", null))
                }));
        }

        protected override IEnumerable<Method> BuildMethods()
        {
            yield return BuildReset();
            yield return BuildGetEnumeratorOfT();
            yield return BuildGetEnumerator();
            yield return BuildAdd();
            yield return BuildClear();
            yield return BuildContains();
            yield return BuildCopyTo();
            yield return BuildRemove();
            yield return BuildIndexOf();
            yield return BuildInsert();
            yield return BuildRemoveAt();
            yield return BuildEnsureList();
        }

        private Method BuildRemoveAt()
        {
            var indexVariable = new ParameterReference(_indexParam);
            return new Method(new MethodSignature("RemoveAt", null, null, MethodSignatureModifiers.Public, null, null, new Parameter[] { _indexParam }), new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(indexVariable)))
                },
                new InvokeInstanceMethodStatement(EnsureList, "RemoveAt", new ValueExpression[] { indexVariable }, false)
            });
        }

        private Method BuildInsert()
        {
            return new Method(new MethodSignature("Insert", null, null, MethodSignatureModifiers.Public, null, null, new Parameter[] { _indexParam, _tParam }), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Insert", new ValueExpression[] { new ParameterReference(_indexParam), new ParameterReference(_tParam) }, false)
            });
        }

        private Method BuildIndexOf()
        {
            var signature = new MethodSignature("IndexOf", null, null, MethodSignatureModifiers.Public, typeof(int), null, new Parameter[] { _tParam });
            return new Method(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(Literal(-1))
                },
                Return(EnsureList.Invoke(signature))
            });
        }

        private Method BuildRemove()
        {
            var signature = new MethodSignature("Remove", null, null, MethodSignatureModifiers.Public, typeof(bool), null, new Parameter[] { _tParam });
            return new Method(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureList.Invoke(signature))
            });
        }

        private Method BuildCopyTo()
        {
            var arrayParam = new Parameter("array", null, _tArray, null, ValidationType.None, null);
            var arrayIndexParam = new Parameter("arrayIndex", null, typeof(int), null, ValidationType.None, null);
            return new Method(new MethodSignature("CopyTo", null, null, MethodSignatureModifiers.Public, null, null, new Parameter[] { arrayParam, arrayIndexParam }), new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return()
                },
                new InvokeInstanceMethodStatement(EnsureList, "CopyTo", new ValueExpression[] { new ParameterReference(arrayParam), new ParameterReference(arrayIndexParam) }, false)
            });
        }

        private Method BuildContains()
        {
            var signature = new MethodSignature("Contains", null, null, MethodSignatureModifiers.Public, typeof(bool), null, new Parameter[] { _tParam });
            return new Method(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureList.Invoke(signature))
            });
        }

        private Method BuildClear()
        {
            return new Method(new MethodSignature("Clear", null, null, MethodSignatureModifiers.Public, null, null, Array.Empty<Parameter>()), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Clear")
            });
        }

        private Method BuildAdd()
        {
            var genericParameter = new Parameter("item", null, _t, null, ValidationType.None, null);
            return new Method(new MethodSignature("Add", null, null, MethodSignatureModifiers.Public, null, null, new Parameter[] { genericParameter }), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Add", new ParameterReference(genericParameter))
            });
        }

        private Method BuildGetEnumerator()
        {
            return new Method(new MethodSignature("GetEnumerator", null, null, MethodSignatureModifiers.None, typeof(IEnumerator), null, Array.Empty<Parameter>(), ExplicitInterface: typeof(IEnumerable)), new MethodBodyStatement[]
            {
                Return(This.Invoke(_getEnumeratorSignature))
            });
        }

        private Method BuildGetEnumeratorOfT()
        {
            return new Method(_getEnumeratorSignature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    new DeclareLocalFunctionStatement(new CodeWriterDeclaration("enumerateEmpty"), Array.Empty<Parameter>(), new CSharpType(typeof(IEnumerator<>), _t), new KeywordStatement("yield", new KeywordExpression("break", null))),
                    Return(new InvokeStaticMethodExpression(null, "enumerateEmpty", Array.Empty<ValueExpression>()))
                },
                Return(EnsureList.Invoke(_getEnumeratorSignature))
            });
        }

        private Method BuildReset()
        {
            return new Method(new MethodSignature("Reset", null, null, MethodSignatureModifiers.Public, null, null, Array.Empty<Parameter>()), new MethodBodyStatement[]
            {
                Assign(_innerList, Null)
            });
        }

        private Method BuildEnsureList()
        {
            return new Method(_ensureListSignature, new MethodBodyStatement[]
            {
                Return(new BinaryOperatorExpression("??=", _innerList, New.Instance(new CSharpType(typeof(List<>), _t))))
            });
        }
    }
}
