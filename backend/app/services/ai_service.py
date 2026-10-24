import logging
import os

logger = logging.getLogger(__name__)

def generate_reply(message: str) -> tuple[str, str]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return (
            "Please configure GEMINI_API_KEY in your .env file and restart the server.",
            "setup",
        )

    model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(model=model, contents=message)
        answer = getattr(response, "text", None)
        if not answer:
            logger.warning("Gemini returned an empty response.")
            return "The AI returned an empty response. Please try again.", "gemini"
        return answer, "gemini"
    except Exception as exc:
        logger.exception("Gemini request failed. Model=%s ErrorType=%s", model, type(exc).__name__)
        return (
            "The AI request failed. Check the server terminal for the underlying error, then try again.",
            "error",
        )
