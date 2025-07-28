import os
import requests
from fastapi import APIRouter
from dotenv import load_dotenv
from supabase import create_client, Client
from fastapi import Query
import time
from threading import Thread
import datetime
from fastapi import Request
import threading
import time as pytime
import jwt
from fastapi import Header, HTTPException, Depends
import httpx

load_dotenv()

router = APIRouter()

NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

SUPABASE_JWT_SECRET = "YXUfXkLI+hZScyonE4AnP/jg7PaejNZGaao1O0z+nmKGc6sXjIWeuvqw6Ls0+efoB1P2MlCuwGRPKEHp0Svnog=="
ADMIN_EMAIL = "kagabolucky72@gmail.com"

def get_current_user(authorization: str = Header(...)):
    print("[DEBUG] SUPABASE_JWT_SECRET:", SUPABASE_JWT_SECRET)
    if not authorization.startswith("Bearer "):
        print("[DEBUG] Invalid authorization header format:", authorization)
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ")[1]
    print("[DEBUG] Token:", token)
    try:
        payload = jwt.decode(token, SUPABASE_JWT_SECRET, algorithms=["HS256"], options={"verify_aud": False})
        print("[DEBUG] Decoded payload:", payload)
        email = payload.get("email")
        if not email:
            print("[DEBUG] No email in token payload")
            raise HTTPException(status_code=401, detail="No email in token")
        return email
    except Exception as e:
        print("[DEBUG] JWT decode error:", str(e))
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def admin_required(email: str = Depends(get_current_user)):
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    return email

def call_gemini_with_retry(payload, headers, max_retries=5):
    gemini_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    for attempt in range(max_retries):
        response = requests.post(gemini_url, headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 429:
            # Parse retry delay from Gemini error, or use default
            try:
                retry_delay = 10  # default
                error_json = response.json()
                details = error_json.get("error", {}).get("details", [])
                for d in details:
                    if d.get("@type") == "type.googleapis.com/google.rpc.RetryInfo":
                        retry_delay = int(d.get("retryDelay", "10s").replace("s", ""))
                print(f"Rate limited. Waiting {retry_delay} seconds before retrying...")
                time.sleep(retry_delay)
            except Exception:
                time.sleep(10)
        else:
            print(f"Gemini error: {response.text}. Retrying in 10s...")
            time.sleep(10)
    return None  # If all retries fail

@router.get("/fetch-news")
def fetch_and_summarize():
    # Fetch sports news from NewsData.io
    url = f"https://newsdata.io/api/1/news?apikey={NEWSDATA_API_KEY}&category=sports&language=en"
    response = requests.get(url)
    if response.status_code != 200:
        return {"error": "Failed to fetch news", "details": response.text}
    articles = response.json().get("results", [])

    summarized_articles = []
    for article in articles:
        title = article.get("title", "")
        description = article.get("description", "")
        content = f"Title: {title}\nDescription: {description}"
        # Gemini prompt for category
        category_prompt = (
            "Given the following news article, which of these categories best fits it? "
            "Return only the category name from this list (no explanation):\n"
            "- Politics\n- Business\n- Crime\n- Investigative\n- Local News\n- International/World News\n- Science and Technology\n- Health\n- Entertainment\n- Lifestyle\n- Culture\n- Human Interest\n- Sports\n- Feature Articles\n- Opinion Pieces\n\n"
            f"Title: {title}\nDescription: {description}"
        )
        headers = {
            "Content-Type": "application/json",
            "X-goog-api-key": GEMINI_API_KEY
        }
        cat_payload = {
            "contents": [{"parts": [{"text": category_prompt}]}]
        }
        cat_data = call_gemini_with_retry(cat_payload, headers)
        if cat_data and "candidates" in cat_data:
            ai_category = cat_data["candidates"][0]["content"]["parts"][0]["text"].strip()
        else:
            print(f"Skipping article '{title}' due to Gemini category failure.")
            continue  # Skip this article if category fails
        # Look up or create category in DB
        category_id = None
        if ai_category:
            cat_resp = supabase.table("categories").select("id").ilike("name", ai_category).execute()
            if cat_resp.data:
                category_id = cat_resp.data[0]["id"]
            else:
                new_cat = supabase.table("categories").insert({"name": ai_category, "description": "AI-generated category"}).execute()
                if new_cat.data:
                    category_id = new_cat.data[0]["id"]
        # Gemini prompt for summary
        summary_prompt = f"Summarize the following news article in 2-3 sentences.\nTitle: {title}\nDescription: {description}"
        sum_payload = {
            "contents": [{"parts": [{"text": summary_prompt}]}]
        }
        sum_data = call_gemini_with_retry(sum_payload, headers)
        if sum_data and "candidates" in sum_data:
            summary_text = sum_data["candidates"][0]["content"]["parts"][0]["text"]
        else:
            print(f"Skipping article '{title}' due to Gemini summary failure.")
            continue  # Skip this article if summary fails
        summarized_articles.append({
            "title": title,
            "summary": summary_text,
            "original": article,
            "category_id": category_id
        })

    # Save summarized articles to Supabase Postgres
    insert_payload = [
        {"title": art["title"], "summary": art["summary"], "original": art["original"], "category_id": art["category_id"]}
        for art in summarized_articles
    ]
    db_response = supabase.table("articles").insert(insert_payload).execute()

    return {"db_response": db_response.data, "summarized_articles": summarized_articles}

@router.get("/categories")
def get_categories():
    response = supabase.table("categories").select("id", "name", "description").execute()
    return {"categories": response.data}

@router.get("/articles")
def get_articles(category: str = Query(None)):
    if category:
        # Try case-insensitive match
        cat_resp = supabase.table("categories").select("id").ilike("name", category).execute()
        if not cat_resp.data:
            # Try capitalized match (e.g., 'Sports' vs 'sports')
            cat_resp = supabase.table("categories").select("id").ilike("name", category.capitalize()).execute()
        if not cat_resp.data:
            # Try upper-case match (e.g., 'SPORTS')
            cat_resp = supabase.table("categories").select("id").ilike("name", category.upper()).execute()
        if not cat_resp.data:
            return {"articles": []}
        category_id = cat_resp.data[0]["id"]
        response = supabase.table("articles").select("id", "title", "summary", "original", "created_at").eq("category_id", category_id).execute()
    else:
        response = supabase.table("articles").select("id", "title", "summary", "original", "created_at").execute()
    return {"articles": response.data}

@router.post("/schedule-post")
async def schedule_post(request: Request, email: str = Depends(admin_required)):
    data = await request.json()
    platform = data.get("platform")
    content = data.get("content")
    scheduled_time = data.get("scheduled_time")
    user_id = data.get("user_id", 1)  # Default to 1 for now (admin)
    if not (platform and content and scheduled_time):
        return {"error": "platform, content, and scheduled_time are required"}
    resp = supabase.table("scheduled_posts").insert({
        "platform": platform,
        "content": content,
        "scheduled_time": scheduled_time,
        "user_id": user_id,
        "status": "pending"
    }).execute()
    return {"scheduled_post": resp.data}

@router.get("/scheduled-posts")
async def get_scheduled_posts(email: str = Depends(admin_required)):
    resp = supabase.table("scheduled_posts").select("*",).order("scheduled_time", desc=False).execute()
    return {"scheduled_posts": resp.data}

@router.post("/generate-post-content")
async def generate_post_content(request: Request, email: str = Depends(admin_required)):
    data = await request.json()
    article_title = data.get("title")
    article_summary = data.get("summary")
    tone = data.get("tone", "professional")
    if not (article_title and article_summary):
        return {"error": "title and summary are required"}
    prompt = (
        f"Draft a social media post in a {tone} tone about the following news article. "
        f"Make it engaging and concise.\n"
        f"Title: {article_title}\n"
        f"Summary: {article_summary}"
    )
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY
    }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    gemini_data = call_gemini_with_retry(payload, headers)
    if gemini_data and "candidates" in gemini_data:
        post_content = gemini_data["candidates"][0]["content"]["parts"][0]["text"]
        return {"post_content": post_content.strip()}
    else:
        return {"error": "Failed to generate post content"}

@router.post("/admin-login")
async def admin_login(request: Request):
    data = await request.json()
    email = data.get("email")
    password = data.get("password")
    if not (email and password):
        return {"error": "email and password are required"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
            json={"email": email, "password": password}
        )
        if resp.status_code == 200:
            return resp.json()
        else:
            return {"error": resp.text, "status_code": resp.status_code}

# Background job to publish due posts
def publish_due_posts():
    while True:
        now = datetime.datetime.utcnow().isoformat()
        # Get due posts
        resp = supabase.table("scheduled_posts").select("id", "platform", "content", "scheduled_time", "status").eq("status", "pending").lte("scheduled_time", now).execute()
        posts = resp.data if resp and resp.data else []
        for post in posts:
            # Simulate publishing (log action)
            print(f"[Scheduler] Publishing post {post['id']} to {post['platform']} at {now}: {post['content']}")
            # Update status to 'posted'
            supabase.table("scheduled_posts").update({"status": "posted"}).eq("id", post["id"]).execute()
        pytime.sleep(30)  # Check every 30 seconds

# Start background thread
threading.Thread(target=publish_due_posts, daemon=True).start() 