// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Providers
{
    /// <summary>
    /// Represents the different types of constructors that can be generated for a model.
    /// </summary>
    public enum ConstructorType
    {
        /// <summary>Standard public/internal constructor</summary>
        Standard,
        /// <summary>Public constructor for direct instantiation</summary>
        PublicForInstantiation,
        /// <summary>Private protected constructor for inheritance</summary>
        PrivateProtectedForInheritance,
        /// <summary>Internal constructor for serialization</summary>
        InternalForSerialization
    }
}
