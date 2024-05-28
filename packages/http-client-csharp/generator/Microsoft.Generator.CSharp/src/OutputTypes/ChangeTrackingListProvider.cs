// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    internal class ChangeTrackingListProvider : TypeProvider
    {
        private static readonly Lazy<ChangeTrackingListProvider> _instance = new(() => new ChangeTrackingListProvider());

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

        private ChangeTrackingListProvider() : base(null)
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

        public override string Name => "ChangeTrackingList";

        protected override CSharpMethod[] BuildConstructors()
        {
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

            return
            [
                new CSharpMethod(new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, Array.Empty<Parameter>()), EmptyStatement),
                new CSharpMethod(iListSignature, iListBody),
                new CSharpMethod(iReadOnlyListSignature, iReadOnlyListBody)
            ];
        }

        protected override CSharpType[] BuildTypeArguments()
        {
            return new[] { _t };
        }

        protected override CSharpType[] BuildImplements()
        {
            return new[] { _iListOfT, _iReadOnlyListOfT };
        }

        protected override FieldDeclaration[] BuildFields()
        {
            return new[] { _innerListField };
        }

        protected override PropertyDeclaration[] BuildProperties() =>
            new[]
            {
                new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(bool), "IsUndefined", new ExpressionPropertyBody(Equal(_innerList, Null))),
                BuildCount(),
                BuildIsReadOnly(),
                BuildIndexer()
            };

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
            var indexParam = new Parameter("index", null, typeof(int), null, ValidationType.None, null);
            return new IndexerDeclaration(null, MethodSignatureModifiers.Public, _t, indexParam, new MethodPropertyBody(
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

        protected override CSharpMethod[] BuildMethods()
        {
            var methods = new List<CSharpMethod>
            {
                BuildReset(),
                BuildGetEnumeratorOfT(),
                BuildGetEnumerator(),
                BuildAdd(),
                BuildClear(),
                BuildContains(),
                BuildCopyTo(),
                BuildRemove(),
                BuildIndexOf(),
                BuildInsert(),
                BuildRemoveAt(),
                BuildEnsureList()
            };

            return methods.ToArray();
        }

        private CSharpMethod BuildRemoveAt()
        {
            var indexVariable = new ParameterReference(_indexParam);
            return new CSharpMethod(new MethodSignature("RemoveAt", null, null, MethodSignatureModifiers.Public, null, null, new Parameter[] { _indexParam }), new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(indexVariable)))
                },
                new InvokeInstanceMethodStatement(EnsureList, "RemoveAt", new ValueExpression[] { indexVariable }, false)
            });
        }

        private CSharpMethod BuildInsert()
        {
            return new CSharpMethod(new MethodSignature("Insert", null, null, MethodSignatureModifiers.Public, null, null, new Parameter[] { _indexParam, _tParam }), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Insert", new ValueExpression[] { new ParameterReference(_indexParam), new ParameterReference(_tParam) }, false)
            });
        }

        private CSharpMethod BuildIndexOf()
        {
            var signature = new MethodSignature("IndexOf", null, null, MethodSignatureModifiers.Public, typeof(int), null, new Parameter[] { _tParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(Literal(-1))
                },
                Return(EnsureList.Invoke(signature))
            });
        }

        private CSharpMethod BuildRemove()
        {
            var signature = new MethodSignature("Remove", null, null, MethodSignatureModifiers.Public, typeof(bool), null, new Parameter[] { _tParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureList.Invoke(signature))
            });
        }

        private CSharpMethod BuildCopyTo()
        {
            var arrayParam = new Parameter("array", null, _tArray, null, ValidationType.None, null);
            var arrayIndexParam = new Parameter("arrayIndex", null, typeof(int), null, ValidationType.None, null);
            return new CSharpMethod(new MethodSignature("CopyTo", null, null, MethodSignatureModifiers.Public, null, null, new Parameter[] { arrayParam, arrayIndexParam }), new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return()
                },
                new InvokeInstanceMethodStatement(EnsureList, "CopyTo", new ValueExpression[] { new ParameterReference(arrayParam), new ParameterReference(arrayIndexParam) }, false)
            });
        }

        private CSharpMethod BuildContains()
        {
            var signature = new MethodSignature("Contains", null, null, MethodSignatureModifiers.Public, typeof(bool), null, new Parameter[] { _tParam });
            return new CSharpMethod(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureList.Invoke(signature))
            });
        }

        private CSharpMethod BuildClear()
        {
            return new CSharpMethod(new MethodSignature("Clear", null, null, MethodSignatureModifiers.Public, null, null, Array.Empty<Parameter>()), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Clear")
            });
        }

        private CSharpMethod BuildAdd()
        {
            var genericParameter = new Parameter("item", null, _t, null, ValidationType.None, null);
            return new CSharpMethod(new MethodSignature("Add", null, null, MethodSignatureModifiers.Public, null, null, new Parameter[] { genericParameter }), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Add", new ParameterReference(genericParameter))
            });
        }

        private CSharpMethod BuildGetEnumerator()
        {
            return new CSharpMethod(new MethodSignature("GetEnumerator", null, null, MethodSignatureModifiers.None, typeof(IEnumerator), null, Array.Empty<Parameter>(), ExplicitInterface: typeof(IEnumerable)), new MethodBodyStatement[]
            {
                Return(This.Invoke(_getEnumeratorSignature))
            });
        }

        private CSharpMethod BuildGetEnumeratorOfT()
        {
            return new CSharpMethod(_getEnumeratorSignature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    new DeclareLocalFunctionStatement(new CodeWriterDeclaration("enumerateEmpty"), Array.Empty<Parameter>(), new CSharpType(typeof(IEnumerator<>), _t), new KeywordStatement("yield", new KeywordExpression("break", null))),
                    Return(new InvokeStaticMethodExpression(null, "enumerateEmpty", Array.Empty<ValueExpression>()))
                },
                Return(EnsureList.Invoke(_getEnumeratorSignature))
            });
        }

        private CSharpMethod BuildReset()
        {
            return new CSharpMethod(new MethodSignature("Reset", null, null, MethodSignatureModifiers.Public, null, null, Array.Empty<Parameter>()), new MethodBodyStatement[]
            {
                Assign(_innerList, Null)
            });
        }

        private CSharpMethod BuildEnsureList()
        {
            return new CSharpMethod(_ensureListSignature, new MethodBodyStatement[]
            {
                Return(new BinaryOperatorExpression("??=", _innerList, New.Instance(new CSharpType(typeof(List<>), _t))))
            });
        }
    }
}
