#nullable disable

using System.ClientModel;
using System.ClientModel.Primitives;
using System.Threading;
using System.Threading.Tasks;

namespace Sample
{
    /// <summary>
    /// Represents a stale previously-published contract whose parameter is spelled
    /// "metricName" (capital N). The current spec uses "metricname" (lowercase) and
    /// has not renamed the parameter, so this stale baseline must NOT silently
    /// rewrite the current parameter back to "metricName".
    /// </summary>
    public partial class StaleBaseline
    {
        public virtual Task<ClientResult> GetMetricsAsync(string metricName, CancellationToken cancellationToken = default) { return null; }
        public virtual ClientResult GetMetrics(string metricName, CancellationToken cancellationToken = default) { return null; }
    }
}
