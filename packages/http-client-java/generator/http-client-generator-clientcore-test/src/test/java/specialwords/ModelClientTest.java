// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package specialwords;

import io.clientcore.core.http.models.RequestContext;
import org.junit.jupiter.api.Test;
import specialwords.models.And;
import specialwords.models.As;
import specialwords.models.Assert;
import specialwords.models.Async;
import specialwords.models.Await;
import specialwords.models.Break;
import specialwords.models.ClassModel;
import specialwords.models.Constructor;
import specialwords.models.Continue;
import specialwords.models.Def;
import specialwords.models.Del;
import specialwords.models.Elif;
import specialwords.models.Else;
import specialwords.models.Except;
import specialwords.models.Exec;
import specialwords.models.Finally;
import specialwords.models.For;
import specialwords.models.From;
import specialwords.models.Global;
import specialwords.models.If;
import specialwords.models.Import;
import specialwords.models.In;
import specialwords.models.Is;
import specialwords.models.Lambda;
import specialwords.models.Not;
import specialwords.models.Or;
import specialwords.models.Pass;
import specialwords.models.Raise;
import specialwords.models.Return;
import specialwords.models.Try;
import specialwords.models.While;
import specialwords.models.With;
import specialwords.models.Yield;

public class ModelClientTest {

    private final ModelsClient client = new SpecialWordsClientBuilder().buildModelsClient();

    @Test
    public void test() throws Exception {

        client.withAndWithResponse(new And("ok"), RequestContext.none());
        client.withAssertWithResponse(new Assert("ok"), RequestContext.none());
        client.withAsWithResponse(new As("ok"), RequestContext.none());
        client.withAsyncWithResponse(new Async("ok"), RequestContext.none());
        client.withAwaitWithResponse(new Await("ok"), RequestContext.none());
        client.withBreakWithResponse(new Break("ok"), RequestContext.none());
        client.withClassWithResponse(new ClassModel("ok"), RequestContext.none());
        client.withConstructorWithResponse(new Constructor("ok"), RequestContext.none());
        client.withContinueWithResponse(new Continue("ok"), RequestContext.none());
        client.withDefWithResponse(new Def("ok"), RequestContext.none());
        client.withDelWithResponse(new Del("ok"), RequestContext.none());
        client.withElifWithResponse(new Elif("ok"), RequestContext.none());
        client.withElifWithResponse(new Elif("ok"), RequestContext.none());
        client.withElseWithResponse(new Else("ok"), RequestContext.none());
        client.withExceptWithResponse(new Except("ok"), RequestContext.none());
        client.withExecWithResponse(new Exec("ok"), RequestContext.none());
        client.withFinallyWithResponse(new Finally("ok"), RequestContext.none());
        client.withForWithResponse(new For("ok"), RequestContext.none());
        client.withFromWithResponse(new From("ok"), RequestContext.none());
        client.withGlobalWithResponse(new Global("ok"), RequestContext.none());
        client.withIfWithResponse(new If("ok"), RequestContext.none());
        client.withImportWithResponse(new Import("ok"), RequestContext.none());
        client.withInWithResponse(new In("ok"), RequestContext.none());
        client.withFromWithResponse(new From("ok"), RequestContext.none());
        client.withIsWithResponse(new Is("ok"), RequestContext.none());
        client.withLambdaWithResponse(new Lambda("ok"), RequestContext.none());
        client.withNotWithResponse(new Not("ok"), RequestContext.none());
        client.withOrWithResponse(new Or("ok"), RequestContext.none());
        client.withPassWithResponse(new Pass("ok"), RequestContext.none());
        client.withRaiseWithResponse(new Raise("ok"), RequestContext.none());
        client.withReturnWithResponse(new Return("ok"), RequestContext.none());
        client.withRaiseWithResponse(new Raise("ok"), RequestContext.none());
        client.withTryWithResponse(new Try("ok"), RequestContext.none());
        client.withWhileWithResponse(new While("ok"), RequestContext.none());
        client.withWithWithResponse(new With("ok"), RequestContext.none());
        client.withYieldWithResponse(new Yield("ok"), RequestContext.none());
    }
}
