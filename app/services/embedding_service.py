def fake_embedding(text: str, dim: int = 384) -> list[float]:
    """
    臨時用的假 embedding。
    現在只為了先打通 vector search pipeline。
    後面會換成真正的 embedding model。
    """
    base = sum(ord(c) for c in text) % 1000
    return [((base + i) % 1000) / 1000.0 for i in range(dim)]
