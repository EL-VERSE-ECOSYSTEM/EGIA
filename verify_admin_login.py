from playwright.sync_api import sync_playwright, expect
import os

def verify_admin_login(page):
    page.goto("http://localhost:3000/admin-login")
    expect(page.get_by_text("System Access")).to_be_visible()
    path = os.path.join(os.getcwd(), "verification_imgs/admin_login.png")
    page.screenshot(path=path)
    print(f"Screenshot saved at {path}")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_admin_login(page)
        finally:
            browser.close()
