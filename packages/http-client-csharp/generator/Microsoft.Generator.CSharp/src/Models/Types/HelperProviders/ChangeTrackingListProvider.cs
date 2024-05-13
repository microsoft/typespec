// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;
using System.Collections;
using System.Collections.Generic;
using Microsoft.Generator.CSharp.Expressions;
using Microsoft.Generator.CSharp.Models;
using static Microsoft.Generator.CSharp.Expressions.Snippets;

namespace Microsoft.Generator.CSharp
{
    public sealed class ChangeTrackingListProvider : TypeProvider
    {
        private static readonly Lazy<ChangeTrackingListProvider> _instance = new(() => new ChangeTrackingListProvider());

        public static ChangeTrackingListProvider Instance => _instance.Value;

        private class ChangeTrackingListTemplate<T> { }

        private readonly CSharpType _tType;
        private readonly CSharpType _tArrayType;
        private readonly CSharpType _iListOfT;
        private readonly CSharpType _iReadOnlyListOfT;

        private readonly FieldDeclaration _innerListField;
        private readonly PropertyDeclaration _isUndefinedProperty;
        private readonly PropertyDeclaration _isReadOnlyProperty;
        private readonly PropertyDeclaration _countProperty;

        public ChangeTrackingListProvider() : base(null) // internal helpers are not allowed to be customized, therefore we pass in null for SourceInputModel
        {
            Name = "ChangeTrackingList";
            DeclarationModifiers = TypeSignatureModifiers.Internal | TypeSignatureModifiers.Partial;
            _tType = typeof(ChangeTrackingListTemplate<>).GetGenericArguments()[0];
            _tArrayType = typeof(ChangeTrackingListTemplate<>).GetGenericArguments()[0].MakeArrayType();
            _iListOfT = new CSharpType(typeof(IList<>), _tType);
            _iReadOnlyListOfT = new CSharpType(typeof(IReadOnlyList<>), _tType);

            _innerListField = new FieldDeclaration(FieldModifiers.Private, _iListOfT, "_innerList");
            _isUndefinedProperty = new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(bool), "IsUndefined", new ExpressionPropertyBody(Equal(_innerListField, Null)));
            _isReadOnlyProperty = new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(bool), "IsReadOnly",
                new ExpressionPropertyBody(new TernaryConditionalOperator(IsUndefined, False, EnsureList().Property(nameof(IList<object>.IsReadOnly)))));
            _countProperty = new PropertyDeclaration(null, MethodSignatureModifiers.Public, typeof(int), "Count",
                new ExpressionPropertyBody(new TernaryConditionalOperator(IsUndefined, Int(0), EnsureList().Property(nameof(IList<object>.Count)))));
        }

        private const string _ensureList = "EnsureList";

        private BoolExpression? _isUndefined;
        private BoolExpression IsUndefined => _isUndefined ??= new(_isUndefinedProperty);

        private ValueExpression? _ensureListExpression;
        private ValueExpression EnsureList() => _ensureListExpression ??= new InvokeInstanceMethodExpression(null, _ensureList, Array.Empty<ValueExpression>());

        public override string Name { get; }

        protected override CSharpType[] BuildTypeArguments() => [_tType];

        protected override CSharpType[] BuildImplements() => [_iListOfT, _iReadOnlyListOfT];

        protected override CSharpMethod[] BuildConstructors()
        {
            var ctors = new CSharpMethod[3];

            // the parameterless ctor
            var ctorSignature = new ConstructorSignature(
                Type: Type,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: Array.Empty<Parameter>(),
                Summary: null, Description: null);
            ctors[0] = new(ctorSignature, EmptyStatement, CSharpMethodKinds.Constructor);

            var iListParameter = new Parameter("innerList", null, _iListOfT, null, ValidationType.None, null);
            var iListSignature = new ConstructorSignature(
                Type: Type,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: [iListParameter],
                Summary: null, Description: null);
            var iList = (ValueExpression)iListParameter;
            var iListBody = new IfStatement(NotEqual(iList, Null))
            {
                Assign(_innerListField, iList)
            };
            ctors[1] = new(iListSignature, iListBody, CSharpMethodKinds.Constructor);

            var iReadOnlyListParameter = iListParameter with
            {
                Type = _iReadOnlyListOfT
            };
            var iReadOnlyListSignature = new ConstructorSignature(
                Type: Type,
                Modifiers: MethodSignatureModifiers.Public,
                Parameters: [iReadOnlyListParameter],
                Summary: null, Description: null);
            var iReadOnlyList = (ValueExpression)iReadOnlyListParameter;
            var iReadOnlyListBody = new IfStatement(NotEqual(iReadOnlyList, Null))
            {
                Assign(_innerListField, Linq.ToList(iReadOnlyList))
            };
            ctors[2] = new(iReadOnlyListSignature, iReadOnlyListBody, CSharpMethodKinds.Constructor);

            return ctors;
        }

        protected override FieldDeclaration[] BuildFields() => [_innerListField];

        protected override PropertyDeclaration[] BuildProperties()
        {
            var indexParameter = new Parameter("index", null, typeof(int), null, ValidationType.None, null);
            var index = new IntExpression(indexParameter);
            var indexerProperty = new IndexerDeclaration(null, MethodSignatureModifiers.Public, _tType, indexParameter,
                new MethodPropertyBody(
                    new MethodBodyStatement[]
                    {
                        new IfStatement(IsUndefined)
                        {
                            Throw(New.ArgumentOutOfRangeException(Nameof(index)))
                        },
                        Return(new ArrayElementExpression(EnsureList(), index))
                    },
                    new MethodBodyStatement[]
                    {
                        new IfStatement(IsUndefined)
                        {
                            Throw(New.ArgumentOutOfRangeException(Nameof(index)))
                        },
                        Assign(new ArrayElementExpression(EnsureList(), index), new KeywordExpression("value", null))
                    }));

            return [_isUndefinedProperty, _countProperty, _isReadOnlyProperty, indexerProperty];
        }

        protected override CSharpMethod[] BuildMethods()
            => [BuildReset(),
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
                BuildEnsureList()];

        private CSharpMethod BuildReset()
        {
            var signature = new MethodSignature(
                Name: "Reset",
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: null,
                Parameters: Array.Empty<Parameter>(),
                Summary: null, Description: null, ReturnDescription: null);
            return new(signature, Assign(_innerListField, Null), CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildGetEnumeratorOfT()
        {
            var iEnumeratorOfT = new CSharpType(typeof(IEnumerator<>), _tType);
            var signature = new MethodSignature(
                Name: nameof(IEnumerable<object>.GetEnumerator),
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: iEnumeratorOfT,
                Parameters: Array.Empty<Parameter>(),
                Summary: null, Description: null, ReturnDescription: null);

            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    new DeclareLocalFunctionStatement(new CodeWriterDeclaration("EnumerateEmpty"), Array.Empty<Parameter>(), iEnumeratorOfT, YieldBreak),
                    Return(new InvokeStaticMethodExpression(null, "EnumerateEmpty", Array.Empty<ValueExpression>()))
                },
                Return(EnsureList().Invoke(nameof(IEnumerable<object>.GetEnumerator)))
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildGetEnumerator()
        {
            var signature = new MethodSignature(
                Name: nameof(IEnumerable.GetEnumerator),
                Modifiers: MethodSignatureModifiers.None,
                ReturnType: typeof(IEnumerator),
                Parameters: Array.Empty<Parameter>(),
                ExplicitInterface: typeof(IEnumerable),
                Summary: null, Description: null, ReturnDescription: null);
            return new(signature, Return(This.Invoke(nameof(IEnumerable<object>.GetEnumerator))), CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildAdd()
        {
            var genericParameter = new Parameter("item", null, _tType, null, ValidationType.None, null);
            var signature = new MethodSignature(
                Name: nameof(IList<object>.Add),
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: null,
                Parameters: [genericParameter],
                Summary: null, Description: null, ReturnDescription: null);
            return new(signature, new InvokeInstanceMethodStatement(EnsureList(), nameof(IList<object>.Add), genericParameter), CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildClear()
        {
            var signature = new MethodSignature(
                Name: nameof(IList<object>.Clear),
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: null,
                Parameters: Array.Empty<Parameter>(),
                Summary: null, Description: null, ReturnDescription: null);
            return new(signature, new InvokeInstanceMethodStatement(EnsureList(), nameof(IList<object>.Clear)), CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildContains()
        {
            var itemParameter = new Parameter("item", null, _tType, null, ValidationType.None, null);
            var signature = new MethodSignature(
                Name: nameof(IList<object>.Contains),
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: typeof(bool),
                Parameters: [itemParameter],
                Summary: null, Description: null, ReturnDescription: null);
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureList().Invoke(signature))
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildCopyTo()
        {
            var arrayParameter = new Parameter("array", null, _tArrayType, null, ValidationType.None, null);
            var indexParameter = new Parameter("arrayIndex", null, typeof(int), null, ValidationType.None, null);
            var signature = new MethodSignature(
                Name: nameof(IList<object>.CopyTo),
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: null,
                Parameters: [arrayParameter, indexParameter],
                Summary: null, Description: null, ReturnDescription: null);
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return()
                },
                new InvokeInstanceMethodStatement(EnsureList(), "CopyTo", [(ValueExpression)arrayParameter, (ValueExpression)indexParameter], false)
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildRemove()
        {
            var itemParameter = new Parameter("item", null, _tType, null, ValidationType.None, null);
            var signature = new MethodSignature(
                Name: nameof(IList<object>.Remove),
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: typeof(bool),
                Parameters: [itemParameter],
                Summary: null, Description: null, ReturnDescription: null);
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(False)
                },
                Return(EnsureList().Invoke(signature))
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildIndexOf()
        {
            var itemParameter = new Parameter("item", null, _tType, null, ValidationType.None, null);
            var signature = new MethodSignature(
                Name: nameof(IList<object>.IndexOf),
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: typeof(int),
                Parameters: [itemParameter],
                Summary: null, Description: null, ReturnDescription: null);
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Return(Literal(-1))
                },
                Return(EnsureList().Invoke(signature))
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildInsert()
        {
            var indexParameter = new Parameter("index", null, typeof(int), null, ValidationType.None, null);
            var itemParameter = new Parameter("item", null, _tType, null, ValidationType.None, null);
            var signature = new MethodSignature(
                Name: nameof(IList<object>.Insert),
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: null,
                Parameters: [indexParameter, itemParameter],
                Summary: null, Description: null, ReturnDescription: null);
            return new(signature, new MethodBodyStatement[]
            {
                new InvokeInstanceMethodStatement(EnsureList(), "Insert", [(ValueExpression)indexParameter, (ValueExpression)itemParameter], false)
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildRemoveAt()
        {
            var indexParameter = new Parameter("index", null, typeof(int), null, ValidationType.None, null);
            var signature = new MethodSignature(
                Name: nameof(IList<object>.RemoveAt),
                Modifiers: MethodSignatureModifiers.Public,
                ReturnType: null,
                Parameters: [indexParameter],
                Summary: null, Description: null, ReturnDescription: null);
            var index = new ParameterReference(indexParameter);
            return new(signature, new MethodBodyStatement[]
            {
                new IfStatement(IsUndefined)
                {
                    Throw(New.Instance(typeof(ArgumentOutOfRangeException), Nameof(index)))
                },
                new InvokeInstanceMethodStatement(EnsureList(), nameof(IList<object>.RemoveAt), [index], false)
            }, CSharpMethodKinds.Method);
        }

        private CSharpMethod BuildEnsureList()
        {
            var signature = new MethodSignature(
                Name: _ensureList,
                Modifiers: MethodSignatureModifiers.Private,
                ReturnType: _iListOfT,
                Parameters: Array.Empty<Parameter>(),
                Summary: null, Description: null, ReturnDescription: null);
            return new(signature, new MethodBodyStatement[]
            {
                Return(new BinaryOperatorExpression("??=", _innerListField, New.Instance(new CSharpType(typeof(List<>), _tType))))
            }, CSharpMethodKinds.Method);
        }
    }
}
