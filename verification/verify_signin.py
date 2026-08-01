import time
from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:3000/auth/signin")
    page.wait_for_timeout(1000)

    # Let's take a screenshot of the Sign In page
    page.screenshot(path="/home/jules/verification/screenshots/signin.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
