public virtual global::System.ClientModel.ClientResult<global::Sample.Models.TestModel> GetSpecialCase(global::System.Threading.CancellationToken cancellationToken = default)
{
    global::System.ClientModel.ClientResult result = this.GetSpecialCase(cancellationToken.ToRequestOptions());
    return global::System.ClientModel.ClientResult.FromValue(((global::Sample.Models.TestModel)result), result.GetRawResponse());
}
