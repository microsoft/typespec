// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading;
using System.Threading.Tasks;

namespace Test
{
    public class OperationClient
    {
        /// <summary>
        /// Stale summary.
        ///             Request Path./old/path.Operation Id.Old_List.Default Api Version.2026-03-01.
        /// </summary>
        /// <param name="id">Stale identifier.</param>
        /// <param name="cancellationToken">Stale cancellation.</param>
        /// <returns>Stale result.</returns>
        public string GetAll(string id, CancellationToken cancellationToken = default) => null;

        /// <summary>
        /// Stale summary.
        ///                         <list type="bullet">
        ///                             <item><term>Default Api Version</term><description>2026-03-01</description></item>
        ///                         </list>
        /// </summary>
        /// <param name="id">Stale identifier.</param>
        /// <param name="cancellationToken">Stale cancellation.</param>
        /// <returns>Stale result.</returns>
        public Task<string> GetAllAsync(string id, CancellationToken cancellationToken = default) => null;
    }
}
