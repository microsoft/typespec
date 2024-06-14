// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Snippets;
using Microsoft.Generator.CSharp.Statements;
using static Microsoft.Generator.CSharp.Snippets.Snippet;

namespace Microsoft.Generator.CSharp.Providers
{
    internal sealed class ChangeTrackingListProvider : TypeProvider
    {
        private static readonly Lazy<ChangeTrackingListProvider> _instance = new(() => new ChangeTrackingListProvider());

        private class ChangeTrackingListTemplate<T> { }

        private readonly MethodSignature _ensureListSignature;
        private readonly MethodSignature _getEnumeratorSignature;
        private readonly CSharpType _t;
        private readonly FieldProvider _innerListField;
        private readonly CSharpType _tArray;
        private readonly ParameterProvider _tParam;
        private readonly ParameterProvider _indexParam = new ParameterProvider("index", $"The index.", typeof(int));
        private VariableReferenceSnippet _innerList;
        private readonly CSharpType _iListOfT;
        private readonly CSharpType _iReadOnlyListOfT;

        private BoolSnippet IsUndefined { get; } = new BoolSnippet(new MemberExpression(This, "IsUndefined"));
        private InvokeInstanceMethodExpression EnsureList { get; init; }

        public static ChangeTrackingListProvider Instance => _instance.Value;

        private ChangeTrackingListProvider()
        {
            _t = typeof(ChangeTrackingListTemplate<>).GetGenericArguments()[0];
            _iListOfT = new CSharpType(typeof(IList<>), _t);
            _iReadOnlyListOfT = new CSharpType(typeof(IReadOnlyList<>), _t);

            _ensureListSignature = new MethodSignature("EnsureList", null, null, MethodSignatureModifiers.Public, _iListOfT, null, Array.Empty<ParameterProvider>());
            _getEnumeratorSignature = new MethodSignature("GetEnumerator", null, null, MethodSignatureModifiers.Public, new CSharpType(typeof(IEnumerator<>), _t), null, Array.Empty<ParameterProvider>());
            _innerListField = new FieldProvider(FieldModifiers.Private, _iListOfT, "_innerList");
            _innerList = new VariableReferenceSnippet(_iListOfT, _innerListField.Declaration);
            _tArray = typeof(ChangeTrackingListTemplate<>).GetGenericArguments()[0].MakeArrayType();
            _tParam = new ParameterProvider("item", $"The item.", _t);
            EnsureList = This.Invoke(_ensureListSignature);
        }

        protected override string GetFileName() => Path.Combine("src", "Generated", "Internal", $"{Name}.cs");

        protected override TypeSignatureModifiers GetDeclarationModifiers()
        {
            return TypeSignatureModifiers.Internal;
        }

        public override string Name => "ChangeTrackingList";

        protected override MethodProvider[] BuildConstructors()
        {
            var iListParam = new ParameterProvider("innerList", $"The inner list.", _iListOfT);
            var iListSignature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, new ParameterProvider[] { iListParam });
            var iListVariable = new ParameterReferenceSnippet(iListParam);
            var iListBody = new MethodBodyStatement[]
            {
                new IfStatement(NotEqual(iListVariable, Null))
                {
                    new AssignValueStatement(_innerList, iListVariable)
                }
            };

            var iReadOnlyListParam = new ParameterProvider("innerList", $"The inner list.", _iReadOnlyListOfT);
            var iReadOnlyListSignature = new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, new ParameterProvider[] { iReadOnlyListParam });
            var iReadOnlyListVariable = new ParameterReferenceSnippet(iReadOnlyListParam);
            var iReadOnlyListBody = new MethodBodyStatement[]
            {
                new IfStatement(NotEqual(iReadOnlyListVariable, Null))
                {
                    new AssignValueStatement(_innerList, Linq.ToList(iReadOnlyListVariable))
                }
            };

            return
            [
                new MethodProvider(new ConstructorSignature(Type, null, null, MethodSignatureModifiers.Public, Array.Empty<ParameterProvider>()), EmptyStatement),
                new MethodProvider(iListSignature, iListBody),
                new MethodProvider(iReadOnlyListSignature, iReadOnlyListBody)
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

        protected override FieldProvider[] BuildFields()
        {
            return new[] { _innerListField };
        }

        protected override PropertyProvider[] BuildProperties() =>
            new[]
            {
                new PropertyProvider(null, MethodSignatureModifiers.Public, typeof(bool), "IsUndefined", new ExpressionPropertyBody(Equal(_innerList, Null))),
                BuildCount(),
                BuildIsReadOnly(),
                BuildIndexer()
            };

        private PropertyProvider BuildIsReadOnly()
        {
            return new PropertyProvider($"Gets the IsReadOnly", MethodSignatureModifiers.Public, typeof(bool), "IsReadOnly",
                        new ExpressionPropertyBody(new TernaryConditionalExpression(
                            IsUndefined,
                            False,
                            new MemberExpression(EnsureList, "IsReadOnly"))));
        }

        private PropertyProvider BuildCount()
        {
            return new PropertyProvider(null, MethodSignatureModifiers.Public, typeof(int), "Count",
                new ExpressionPropertyBody(new TernaryConditionalExpression(
                    IsUndefined,
                    Literal(0),
                    new MemberExpression(EnsureList, "Count"))));
        }

        private PropertyProvider BuildIndexer()
        {
            var indexParam = new ParameterProvider("index", $"The inner list.", typeof(int));
            return new IndexerProvider(null, MethodSignatureModifiers.Public, _t, indexParam, new MethodPropertyBody(
                new MethodBodyStatement[]
                {
                    new IfStatement(IsUndefined)
                    {
                        Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(new ParameterReferenceSnippet(_indexParam))))
                    },
                    Return(new ArrayElementExpression(EnsureList, new ParameterReferenceSnippet(_indexParam))),
                },
                new MethodBodyStatement[]
                {
                    new IfStatement(IsUndefined)
                    {
                        Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(new ParameterReferenceSnippet(_indexParam))))
                    },
                    new AssignValueStatement(
                            new ArrayElementExpression(EnsureList, new ParameterReferenceSnippet(_indexParam)),
                            new KeywordExpression("value", null))
                }));
        }

        protected override MethodProvider[] BuildMethods()
        {
            return new MethodProvider[]
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
        }

        private MethodProvider BuildRemoveAt()
        {
            var indexVariable = new ParameterReferenceSnippet(_indexParam);
            return new MethodProvider(new MethodSignature("RemoveAt", null, null, MethodSignatureModifiers.Public, null, null, new ParameterProvider[] { _indexParam }), new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(indexVariable)))
                },
                new InvokeInstanceMethodStatement(EnsureList, "RemoveAt", new ValueExpression[] { indexVariable }, false)
            });
        }

        private MethodProvider BuildInsert()
        {
            return new MethodProvider(new MethodSignature("Insert", null, null, MethodSignatureModifiers.Public, null, null, new ParameterProvider[] { _indexParam, _tParam }), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Insert", new ValueExpression[] { new ParameterReferenceSnippet(_indexParam), new ParameterReferenceSnippet(_tParam) }, false)
            });
        }

        private MethodProvider BuildIndexOf()
        {
            var signature = new MethodSignature("IndexOf", null, null, MethodSignatureModifiers.Public, typeof(int), null, new ParameterProvider[] { _tParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(Literal(-1))
                },
                Return(EnsureList.Invoke(signature))
            });
        }

        private MethodProvider BuildRemove()
        {
            var signature = new MethodSignature("Remove", null, null, MethodSignatureModifiers.Public, typeof(bool), null, new ParameterProvider[] { _tParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureList.Invoke(signature))
            });
        }

        private MethodProvider BuildCopyTo()
        {
            var arrayParam = new ParameterProvider("array", $"The array to copy to.", _tArray);
            var arrayIndexParam = new ParameterProvider("arrayIndex", $"The array index.", typeof(int));
            return new MethodProvider(new MethodSignature("CopyTo", null, null, MethodSignatureModifiers.Public, null, null, new ParameterProvider[] { arrayParam, arrayIndexParam }), new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return()
                },
                new InvokeInstanceMethodStatement(EnsureList, "CopyTo", new ValueExpression[] { new ParameterReferenceSnippet(arrayParam), new ParameterReferenceSnippet(arrayIndexParam) }, false)
            });
        }

        private MethodProvider BuildContains()
        {
            var signature = new MethodSignature("Contains", null, null, MethodSignatureModifiers.Public, typeof(bool), null, new ParameterProvider[] { _tParam });
            return new MethodProvider(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureList.Invoke(signature))
            });
        }

        private MethodProvider BuildClear()
        {
            return new MethodProvider(new MethodSignature("Clear", null, null, MethodSignatureModifiers.Public, null, null, Array.Empty<ParameterProvider>()), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Clear")
            });
        }

        private MethodProvider BuildAdd()
        {
            var genericParameter = new ParameterProvider("item", $"The item to add.", _t);
            return new MethodProvider(new MethodSignature("Add", null, null, MethodSignatureModifiers.Public, null, null, new ParameterProvider[] { genericParameter }), new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList, "Add", new ParameterReferenceSnippet(genericParameter))
            });
        }

        private MethodProvider BuildGetEnumerator()
        {
            return new MethodProvider(new MethodSignature("GetEnumerator", null, null, MethodSignatureModifiers.None, typeof(IEnumerator), null, Array.Empty<ParameterProvider>(), ExplicitInterface: typeof(IEnumerable)), new MethodBodyStatement[]
            {
                Return(This.Invoke(_getEnumeratorSignature))
            });
        }

        private MethodProvider BuildGetEnumeratorOfT()
        {
            return new MethodProvider(_getEnumeratorSignature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    new DeclareLocalFunctionStatement(new CodeWriterDeclaration("enumerateEmpty"), Array.Empty<ParameterProvider>(), new CSharpType(typeof(IEnumerator<>), _t), new KeywordStatement("yield", new KeywordExpression("break", null))),
                    Return(new InvokeStaticMethodExpression(null, "enumerateEmpty", Array.Empty<ValueExpression>()))
                },
                Return(EnsureList.Invoke(_getEnumeratorSignature))
            });
        }

        private MethodProvider BuildReset()
        {
            return new MethodProvider(new MethodSignature("Reset", null, null, MethodSignatureModifiers.Public, null, null, Array.Empty<ParameterProvider>()), new MethodBodyStatement[]
            {
                Assign(_innerList, Null)
            });
        }

        private MethodProvider BuildEnsureList()
        {
            return new MethodProvider(_ensureListSignature, new MethodBodyStatement[]
            {
                Return(new BinaryOperatorExpression("??=", _innerList, New.Instance(new CSharpType(typeof(List<>), _t))))
            });
        }
    }
}
