internal global::System.ClientModel.Primitives.PipelineMessage CreateGetByResourceGroupRequest(string subscriptionId, string resourceGroupName, global::System.ClientModel.Primitives.RequestOptions options)
{
    global::Sample.ClientUriBuilder uri = new global::Sample.ClientUriBuilder();
    uri.Reset(_endpoint);
    uri.AppendPath("/subscriptions/", false);
    uri.AppendPath(subscriptionId, true);
    uri.AppendPath("/resourceGroups/", false);
    uri.AppendPath(resourceGroupName, true);
    uri.AppendPath("/providers/Azure.ResourceManager.Resources/singletonTrackedResources/default", false);
    global::System.ClientModel.Primitives.PipelineMessage message = Pipeline.CreateMessage(uri.ToUri(), "GET", PipelineMessageClassifier200);
    global::System.ClientModel.Primitives.PipelineRequest request = message.Request;
    message.Apply(options);
    return message;
}

internal global::System.ClientModel.Primitives.PipelineMessage CreateListByResourceGroupRequest(string subscriptionId, string resourceGroupName, global::System.ClientModel.Primitives.RequestOptions options)
{
    global::Sample.ClientUriBuilder uri = new global::Sample.ClientUriBuilder();
    uri.Reset(_endpoint);
    uri.AppendPath("/subscriptions/", false);
    uri.AppendPath(subscriptionId, true);
    uri.AppendPath("/resourceGroups/", false);
    uri.AppendPath(resourceGroupName, true);
    uri.AppendPath("/providers/Azure.ResourceManager.Resources/singletonTrackedResources", false);
    global::System.ClientModel.Primitives.PipelineMessage message = Pipeline.CreateMessage(uri.ToUri(), "GET", PipelineMessageClassifier200);
    global::System.ClientModel.Primitives.PipelineRequest request = message.Request;
    message.Apply(options);
    return message;
}

internal global::System.ClientModel.Primitives.PipelineMessage CreateNextListByResourceGroupRequest(global::System.Uri nextPage, string subscriptionId, string resourceGroupName, global::System.ClientModel.Primitives.RequestOptions options)
{
    global::Sample.ClientUriBuilder uri = new global::Sample.ClientUriBuilder();
    if (nextPage.IsAbsoluteUri)
    {
        uri.Reset(nextPage);
    }
    else
    {
        uri.Reset(new global::System.Uri(_endpoint, nextPage));
    }

    global::System.ClientModel.Primitives.PipelineMessage message = Pipeline.CreateMessage(uri.ToUri(), "GET", PipelineMessageClassifier200);
    global::System.ClientModel.Primitives.PipelineRequest request = message.Request;
    message.Apply(options);
    return message;
}
