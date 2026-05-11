import pytest
from client.overload.aio import OverloadClient


class TestClientOverloadAsync:
    @pytest.fixture
    def client(self):
        return OverloadClient(endpoint="http://localhost:3000")

    @pytest.mark.asyncio
    async def test_list(self, client: OverloadClient):
        result = await client.list()
        assert len(result) == 2
        assert result[0]["id"] == "1"
        assert result[0]["name"] == "foo"
        assert result[0]["scope"] == "car"
        assert result[1]["id"] == "2"
        assert result[1]["name"] == "bar"
        assert result[1]["scope"] == "bike"

    @pytest.mark.asyncio
    async def test_list_by_scope(self, client: OverloadClient):
        result = await client.list_by_scope("car")
        assert len(result) == 1
        assert result[0]["id"] == "1"
        assert result[0]["name"] == "foo"
        assert result[0]["scope"] == "car"
