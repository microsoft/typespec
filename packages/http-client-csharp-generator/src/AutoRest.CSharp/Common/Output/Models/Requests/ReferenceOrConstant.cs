// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

using System;
using AutoRest.CSharp.Generation.Types;
using AutoRest.CSharp.Output.Models.Shared;


namespace AutoRest.CSharp.Output.Models.Requests
{
    internal readonly struct ReferenceOrConstant
    {
        private readonly Constant? _constant;
        private readonly Reference? _reference;

        private ReferenceOrConstant(Constant constant)
        {
            Type = constant.Type;
            _constant = constant;
            _reference = null;
        }

        private ReferenceOrConstant(Reference reference)
        {
            Type = reference.Type;
            _reference = reference;
            _constant = null;
        }

        public CSharpType Type { get; }
        public bool IsConstant => _constant.HasValue;

        public Constant Constant => _constant ?? throw new InvalidOperationException("Not a constant");
        public Reference Reference => _reference ?? throw new InvalidOperationException("Not a reference");

        public static implicit operator ReferenceOrConstant(Constant constant) => new ReferenceOrConstant(constant);
        public static implicit operator ReferenceOrConstant(Reference reference) => new ReferenceOrConstant(reference);
        public static implicit operator ReferenceOrConstant(Parameter parameter) => new ReferenceOrConstant(new Reference(parameter.Name, parameter.Type));
        public static implicit operator ReferenceOrConstant(FieldDeclaration field) => new ReferenceOrConstant(new Reference(field.Name, field.Type));
    }
}
