# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest

from specialwords.aio import SpecialWordsClient


@pytest.fixture
async def client():
    async with SpecialWordsClient() as client:
        yield client


# Operations


@pytest.mark.asyncio
async def test_operations_and_method(client: SpecialWordsClient):
    await client.operations.and_method()


@pytest.mark.asyncio
async def test_operations_as_method(client: SpecialWordsClient):
    await client.operations.as_method()


@pytest.mark.asyncio
async def test_operations_assert_method(client: SpecialWordsClient):
    await client.operations.assert_method()


@pytest.mark.asyncio
async def test_operations_async_method(client: SpecialWordsClient):
    await client.operations.async_method()


@pytest.mark.asyncio
async def test_operations_await_method(client: SpecialWordsClient):
    await client.operations.await_method()


@pytest.mark.asyncio
async def test_operations_break_method(client: SpecialWordsClient):
    await client.operations.break_method()


@pytest.mark.asyncio
async def test_operations_class_method(client: SpecialWordsClient):
    await client.operations.class_method()


@pytest.mark.asyncio
async def test_operations_constructor(client: SpecialWordsClient):
    await client.operations.constructor()


@pytest.mark.asyncio
async def test_operations_continue_method(client: SpecialWordsClient):
    await client.operations.continue_method()


@pytest.mark.asyncio
async def test_operations_def_method(client: SpecialWordsClient):
    await client.operations.def_method()


@pytest.mark.asyncio
async def test_operations_del_method(client: SpecialWordsClient):
    await client.operations.del_method()


@pytest.mark.asyncio
async def test_operations_elif_method(client: SpecialWordsClient):
    await client.operations.elif_method()


@pytest.mark.asyncio
async def test_operations_else_method(client: SpecialWordsClient):
    await client.operations.else_method()


@pytest.mark.asyncio
async def test_operations_except_method(client: SpecialWordsClient):
    await client.operations.except_method()


@pytest.mark.asyncio
async def test_operations_exec_method(client: SpecialWordsClient):
    await client.operations.exec_method()


@pytest.mark.asyncio
async def test_operations_finally_method(client: SpecialWordsClient):
    await client.operations.finally_method()


@pytest.mark.asyncio
async def test_operations_for_method(client: SpecialWordsClient):
    await client.operations.for_method()


@pytest.mark.asyncio
async def test_operations_from_method(client: SpecialWordsClient):
    await client.operations.from_method()


@pytest.mark.asyncio
async def test_operations_global_method(client: SpecialWordsClient):
    await client.operations.global_method()


@pytest.mark.asyncio
async def test_operations_if_method(client: SpecialWordsClient):
    await client.operations.if_method()


@pytest.mark.asyncio
async def test_operations_import_method(client: SpecialWordsClient):
    await client.operations.import_method()


@pytest.mark.asyncio
async def test_operations_in_method(client: SpecialWordsClient):
    await client.operations.in_method()


@pytest.mark.asyncio
async def test_operations_is_method(client: SpecialWordsClient):
    await client.operations.is_method()


@pytest.mark.asyncio
async def test_operations_lambda_method(client: SpecialWordsClient):
    await client.operations.lambda_method()


@pytest.mark.asyncio
async def test_operations_not_method(client: SpecialWordsClient):
    await client.operations.not_method()


@pytest.mark.asyncio
async def test_operations_or_method(client: SpecialWordsClient):
    await client.operations.or_method()


@pytest.mark.asyncio
async def test_operations_pass_method(client: SpecialWordsClient):
    await client.operations.pass_method()


@pytest.mark.asyncio
async def test_operations_raise_method(client: SpecialWordsClient):
    await client.operations.raise_method()


@pytest.mark.asyncio
async def test_operations_return_method(client: SpecialWordsClient):
    await client.operations.return_method()


@pytest.mark.asyncio
async def test_operations_try_method(client: SpecialWordsClient):
    await client.operations.try_method()


@pytest.mark.asyncio
async def test_operations_while_method(client: SpecialWordsClient):
    await client.operations.while_method()


@pytest.mark.asyncio
async def test_operations_with_method(client: SpecialWordsClient):
    await client.operations.with_method()


@pytest.mark.asyncio
async def test_operations_yield_method(client: SpecialWordsClient):
    await client.operations.yield_method()


# Models


@pytest.mark.asyncio
async def test_models_with_and(client: SpecialWordsClient):
    await client.models.with_and(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_as(client: SpecialWordsClient):
    await client.models.with_as(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_assert(client: SpecialWordsClient):
    await client.models.with_assert(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_async(client: SpecialWordsClient):
    await client.models.with_async(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_await(client: SpecialWordsClient):
    await client.models.with_await(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_break(client: SpecialWordsClient):
    await client.models.with_break(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_class(client: SpecialWordsClient):
    await client.models.with_class(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_constructor(client: SpecialWordsClient):
    await client.models.with_constructor(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_continue(client: SpecialWordsClient):
    await client.models.with_continue(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_def(client: SpecialWordsClient):
    await client.models.with_def(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_del(client: SpecialWordsClient):
    await client.models.with_del(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_elif(client: SpecialWordsClient):
    await client.models.with_elif(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_else(client: SpecialWordsClient):
    await client.models.with_else(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_except(client: SpecialWordsClient):
    await client.models.with_except(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_exec(client: SpecialWordsClient):
    await client.models.with_exec(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_finally(client: SpecialWordsClient):
    await client.models.with_finally(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_for(client: SpecialWordsClient):
    await client.models.with_for(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_from(client: SpecialWordsClient):
    await client.models.with_from(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_global(client: SpecialWordsClient):
    await client.models.with_global(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_if(client: SpecialWordsClient):
    await client.models.with_if(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_import(client: SpecialWordsClient):
    await client.models.with_import(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_in(client: SpecialWordsClient):
    await client.models.with_in(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_is(client: SpecialWordsClient):
    await client.models.with_is(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_lambda(client: SpecialWordsClient):
    await client.models.with_lambda(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_not(client: SpecialWordsClient):
    await client.models.with_not(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_or(client: SpecialWordsClient):
    await client.models.with_or(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_pass(client: SpecialWordsClient):
    await client.models.with_pass(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_raise(client: SpecialWordsClient):
    await client.models.with_raise(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_return(client: SpecialWordsClient):
    await client.models.with_return(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_try(client: SpecialWordsClient):
    await client.models.with_try(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_while(client: SpecialWordsClient):
    await client.models.with_while(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_with(client: SpecialWordsClient):
    await client.models.with_with(body={"name": "ok"})


@pytest.mark.asyncio
async def test_models_with_yield(client: SpecialWordsClient):
    await client.models.with_yield(body={"name": "ok"})


# Parameters


@pytest.mark.asyncio
async def test_parameters_with_and(client: SpecialWordsClient):
    await client.parameters.with_and(and_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_as(client: SpecialWordsClient):
    await client.parameters.with_as(as_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_assert(client: SpecialWordsClient):
    await client.parameters.with_assert(assert_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_async(client: SpecialWordsClient):
    await client.parameters.with_async(async_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_await(client: SpecialWordsClient):
    await client.parameters.with_await(await_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_break(client: SpecialWordsClient):
    await client.parameters.with_break(break_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_class(client: SpecialWordsClient):
    await client.parameters.with_class(class_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_constructor(client: SpecialWordsClient):
    await client.parameters.with_constructor(constructor="ok")


@pytest.mark.asyncio
async def test_parameters_with_continue(client: SpecialWordsClient):
    await client.parameters.with_continue(continue_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_def(client: SpecialWordsClient):
    await client.parameters.with_def(def_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_del(client: SpecialWordsClient):
    await client.parameters.with_del(del_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_elif(client: SpecialWordsClient):
    await client.parameters.with_elif(elif_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_else(client: SpecialWordsClient):
    await client.parameters.with_else(else_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_except(client: SpecialWordsClient):
    await client.parameters.with_except(except_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_exec(client: SpecialWordsClient):
    await client.parameters.with_exec(exec_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_finally(client: SpecialWordsClient):
    await client.parameters.with_finally(finally_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_for(client: SpecialWordsClient):
    await client.parameters.with_for(for_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_from(client: SpecialWordsClient):
    await client.parameters.with_from(from_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_global(client: SpecialWordsClient):
    await client.parameters.with_global(global_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_if(client: SpecialWordsClient):
    await client.parameters.with_if(if_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_import(client: SpecialWordsClient):
    await client.parameters.with_import(import_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_in(client: SpecialWordsClient):
    await client.parameters.with_in(in_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_is(client: SpecialWordsClient):
    await client.parameters.with_is(is_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_lambda(client: SpecialWordsClient):
    await client.parameters.with_lambda(lambda_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_not(client: SpecialWordsClient):
    await client.parameters.with_not(not_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_or(client: SpecialWordsClient):
    await client.parameters.with_or(or_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_pass(client: SpecialWordsClient):
    await client.parameters.with_pass(pass_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_raise(client: SpecialWordsClient):
    await client.parameters.with_raise(raise_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_return(client: SpecialWordsClient):
    await client.parameters.with_return(return_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_try(client: SpecialWordsClient):
    await client.parameters.with_try(try_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_while(client: SpecialWordsClient):
    await client.parameters.with_while(while_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_with(client: SpecialWordsClient):
    await client.parameters.with_with(with_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_yield(client: SpecialWordsClient):
    await client.parameters.with_yield(yield_parameter="ok")


@pytest.mark.asyncio
async def test_parameters_with_cancellation_token(client: SpecialWordsClient):
    await client.parameters.with_cancellation_token(cancellation_token="ok")


# Model properties


@pytest.mark.asyncio
async def test_model_properties_same_as_model(client: SpecialWordsClient):
    await client.model_properties.same_as_model(
        body={"SameAsModel": "ok"},
    )


@pytest.mark.asyncio
async def test_model_properties_dict_methods(client: SpecialWordsClient):
    await client.model_properties.dict_methods(
        body={
            "clear": "ok",
            "copy": "ok",
            "get": "ok",
            "items": "ok",
            "keys": "ok",
            "pop": "ok",
            "popitem": "ok",
            "setdefault": "ok",
            "update": "ok",
            "values": "ok",
        },
    )
