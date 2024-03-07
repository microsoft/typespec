// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// <auto-generated/>

#nullable disable

using Azure.Core;
using Azure.ResourceManager;
using MgmtOmitOperationGroups;

namespace MgmtOmitOperationGroups.Mocking
{
    /// <summary> A class to add extension methods to ArmClient. </summary>
    public partial class MockableMgmtOmitOperationGroupsArmClient : ArmResource
    {
        /// <summary> Initializes a new instance of the <see cref="MockableMgmtOmitOperationGroupsArmClient"/> class for mocking. </summary>
        protected MockableMgmtOmitOperationGroupsArmClient()
        {
        }

        /// <summary> Initializes a new instance of the <see cref="MockableMgmtOmitOperationGroupsArmClient"/> class. </summary>
        /// <param name="client"> The client parameters to use in these operations. </param>
        /// <param name="id"> The identifier of the resource that is the target of operations. </param>
        internal MockableMgmtOmitOperationGroupsArmClient(ArmClient client, ResourceIdentifier id) : base(client, id)
        {
        }

        internal MockableMgmtOmitOperationGroupsArmClient(ArmClient client) : this(client, ResourceIdentifier.Root)
        {
        }

        private string GetApiVersionOrNull(ResourceType resourceType)
        {
            TryGetApiVersion(resourceType, out string apiVersion);
            return apiVersion;
        }

        /// <summary>
        /// Gets an object representing a <see cref="Model2Resource"/> along with the instance operations that can be performed on it but with no data.
        /// You can use <see cref="Model2Resource.CreateResourceIdentifier" /> to create a <see cref="Model2Resource"/> <see cref="ResourceIdentifier"/> from its components.
        /// </summary>
        /// <param name="id"> The resource ID of the resource to get. </param>
        /// <returns> Returns a <see cref="Model2Resource"/> object. </returns>
        public virtual Model2Resource GetModel2Resource(ResourceIdentifier id)
        {
            Model2Resource.ValidateResourceId(id);
            return new Model2Resource(Client, id);
        }
    }
}
