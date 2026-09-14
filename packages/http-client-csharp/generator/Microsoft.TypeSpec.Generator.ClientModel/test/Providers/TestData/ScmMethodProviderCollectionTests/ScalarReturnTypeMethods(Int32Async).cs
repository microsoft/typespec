public virtual async global::System.Threading.Tasks.Task<global::System.ClientModel.ClientResult<int>> GetScalarAsync(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = await this.GetScalarAsync(cancellationToken.ToRequestOptions()).ConfigureAwait(false);
    string responseContent = result.GetRawResponse().Content.ToString().TrimStart('﻿');
    using global::System.Text.Json.JsonDocument document = global::System.Text.Json.JsonDocument.Parse(responseContent);
    int value = document.RootElement.GetInt32();
    return global::System.ClientModel.ClientResult.FromValue(value, result.GetRawResponse());
}
