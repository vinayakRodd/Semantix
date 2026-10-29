import asyncio
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.parsers.manager import parser_manager


async def test_parsers():
    # 1. Test sample parser 1
    res1 = await parser_manager.parse_url("sample://fastapi-architecture")
    assert res1.success is True
    assert len(res1.messages) == 4
    assert res1.platform == "ChatGPT-4o"
    print("✓ Sample 1 (FastAPI) parsed successfully:", res1.title)

    # 2. Test sample parser 2
    res2 = await parser_manager.parse_url("sample://claude-design-system")
    assert res2.success is True
    assert len(res2.messages) == 2
    assert res2.platform == "Claude 3.5 Sonnet"
    print("✓ Sample 2 (Claude) parsed successfully:", res2.title)

    # 3. Test samples listing
    samples = parser_manager.get_sample_options()
    assert len(samples) == 2
    print("✓ Sample options available:", len(samples))

    # 4. Adversarial parser tests: Empty & whitespace strings
    try:
        await parser_manager.parse_url("")
        assert False, "Should have raised ValueError on empty string"
    except ValueError:
        print("✓ Empty URL string rejected as expected")

    try:
        await parser_manager.parse_url("    ")
        assert False, "Should have raised ValueError on whitespace string"
    except ValueError:
        print("✓ Whitespace-only URL rejected as expected")


def test_api_endpoints():
    client = TestClient(app)

    # 1. Health check
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "healthy"
    print("✓ API GET /api/health returned healthy")

    # 2. Samples endpoint
    r = client.get("/api/samples")
    assert r.status_code == 200
    assert len(r.json()) >= 2
    print("✓ API GET /api/samples returned sample list")

    # 3. POST /api/fetch-chat with sample
    r = client.post("/api/fetch-chat", json={"url": "sample://fastapi-architecture"})
    assert r.status_code == 200
    data = r.json()
    assert data["success"] is True
    assert len(data["messages"]) == 4
    print("✓ API POST /api/fetch-chat with sample passed")

    # 4. POST /api/fetch-chat with empty string
    r = client.post("/api/fetch-chat", json={"url": "   "})
    assert r.status_code == 400
    print("✓ API POST /api/fetch-chat empty string validation passed (400 Bad Request)")

    # 5. POST /api/fetch-chat missing body
    r = client.post("/api/fetch-chat", json={})
    assert r.status_code == 422
    print("✓ API POST /api/fetch-chat missing url field rejected (422 Unprocessable)")

    # 6. POST /api/compress-chat with valid messages
    test_messages = [
        {"role": "user", "content": "How do I optimize SQL queries in PostgreSQL?"},
        {
            "role": "assistant",
            "content": "Sure! I would be glad to help with that. First, add an index on your filter columns. Second, use EXPLAIN ANALYZE. Hope this helps! Let me know if you have any questions!"
        },
        {"role": "user", "content": "thanks"},
    ]
    r = client.post("/api/compress-chat", json={"messages": test_messages})
    assert r.status_code == 200
    comp_data = r.json()
    assert comp_data["success"] is True
    metrics = comp_data["metrics"]
    assert metrics["original_tokens"] > metrics["compressed_tokens"]
    assert metrics["reduction_percentage"] > 0
    assert metrics["processing_time_ms"] >= 0
    assert len(comp_data["compressed_messages"]) == 2  # 'thanks' pruned, opening/closing fluff stripped
    print("✓ API POST /api/compress-chat passed with", metrics["reduction_percentage"], "% reduction in", metrics["processing_time_ms"], "ms")

    # 7. POST /api/compress-chat empty message list
    r = client.post("/api/compress-chat", json={"messages": []})
    assert r.status_code == 400
    print("✓ API POST /api/compress-chat empty array rejected (400 Bad Request)")


if __name__ == "__main__":
    asyncio.run(test_parsers())
    test_api_endpoints()
    print("\n✓ ALL ADVERSARIAL AND RUNTIME TESTS PASSED SUCCESSFULLY!")

