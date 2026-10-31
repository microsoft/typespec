// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.CodeAnalysis.Text;

namespace Microsoft.TypeSpec.Generator.Primitives
{
    internal enum TypeReferenceRole { Code, WholeTypeCref }

    internal readonly record struct TypeReferenceSite(TextSpan Span, CSharpType Type, TypeReferenceRole Role = TypeReferenceRole.Code);
}
