import asyncio
import os
from playwright.async_api import async_playwright

async def verify_registration():
    async with async_playwright() as p:
        # Launch browser with the specified testing agent
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Playwright Testing HeadlessChrome",
            viewport={"width": 1280, "height": 800}
        )
        page = await context.new_page()

        # Start standard NextJS dev server or test relative to it
        print("Visiting student registration page locally...")
        await page.goto("http://localhost:3000/auth/signup/student-registration")

        # Take an initial screenshot
        await page.screenshot(path="verification/student_registration_initial.png")
        print("Captured initial student registration page layout!")

        # Inject fake local storage to simulate successful Korapay payment callback return
        print("Simulating return from Korapay payment checkout redirect by writing unique admission to localStorage...")
        await page.evaluate("""() => {
            localStorage.setItem('pending_student_admission', 'EGIA/STUD/2026/094827');
        }""")

        # Reload the page to trigger client mount logic
        await page.reload()
        await page.wait_for_timeout(1000)

        # Confirm success modal is rendered
        await page.screenshot(path="verification/student_registration_success_modal.png")
        print("Captured return callback success modal screen!")

        # Verify content
        header_text = await page.inner_text("h2")
        print(f"Header visible: {header_text}")

        adm_number_text = await page.locator("p.text-orange-600").first.inner_text()
        print(f"Admission number rendered: {adm_number_text}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(verify_registration())
