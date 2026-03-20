from google import genai
from app.core.settings import settings

client = genai.Client(api_key=settings.gemini_api_key)


def generate_answer_with_gemini(query: str, context_blocks: list[str]) -> str:
    """
    用 Gemini 根據檢索到的 chunks 生成答案。
    """
    if not context_blocks:
        return "找不到足夠資訊。"

    context_text = "\n\n".join(context_blocks)

    prompt = f"""你是公司內部知識助理。
只能根據提供的文件片段回答。
如果資料不足，請明確回答：找不到足夠資訊。
回答請簡潔、準確，必要時整理成重點。

問題：
{query}

可用文件片段：
{context_text}

請只根據上面的文件片段回答，不要自行補充未提供的資訊。
"""

    try:
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
        )
        return (response.text or "").strip() or "找不到足夠資訊。"

    except Exception as e:
        error_text = str(e)

        if "RESOURCE_EXHAUSTED" in error_text or "quota" in error_text.lower():
            return "目前生成模型額度已達上限，請稍後再試。"

        if "API key" in error_text or "api_key" in error_text.lower():
            return "Gemini API 金鑰設定有問題，請檢查 GEMINI_API_KEY。"

        return f"LLM 生成失敗：{error_text}"
