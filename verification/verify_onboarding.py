import os
import sys
import random
import subprocess
import json
from playwright.sync_api import sync_playwright

def run_cuj(page, context):
    print("Starting visual verification...")
    # Generate random name suffix to guarantee success on every run
    rand_id = random.randint(1000, 9999)
    last_name = f"Okon{rand_id}"
    email = f"mary.okon{rand_id}@egia.com"

    # 1. Goto SignUp Options Page
    page.goto("http://localhost:3000/auth/signup")
    page.wait_for_timeout(2000)

    # Take screenshot of signup selection screen
    page.screenshot(path="/home/jules/verification/screenshots/signup_options.png")
    print("Screenshot of signup options saved.")

    # 2. Click "Parent who is a Teacher Registration" (its role link is /auth/signup/parent-teacher)
    page.get_by_role("link", name="Register").nth(1).click()
    page.wait_for_timeout(2000)

    # Take screenshot of Parent-Teacher Registration form
    page.screenshot(path="/home/jules/verification/screenshots/parent_teacher_form.png")
    print("Screenshot of parent-teacher form saved.")

    # 3. Fill in Parent-Teacher Form
    # Parent/Teacher fields
    page.locator("#firstName").fill("Mary")
    page.wait_for_timeout(500)
    page.locator("#lastName").fill(last_name)
    page.wait_for_timeout(500)
    page.get_by_label("Email Address").fill(email)
    page.wait_for_timeout(500)
    page.get_by_label("Phone / WhatsApp Number").fill("+2348031234567")
    page.wait_for_timeout(500)

    # Child fields
    page.locator("#childFirstName").fill("Efe")
    page.wait_for_timeout(500)
    page.locator("#childMiddleName").fill("David")
    page.wait_for_timeout(500)
    page.locator("#childLastName").fill(last_name)
    page.wait_for_timeout(500)
    page.locator("#childDOB").fill("2016-05-12")
    page.wait_for_timeout(500)
    page.locator("#childClass").select_option("Primary 3")
    page.wait_for_timeout(500)

    # Password fields
    page.locator("#password").fill("password123")
    page.wait_for_timeout(500)
    page.locator("#confirmPassword").fill("password123")
    page.wait_for_timeout(500)

    # Note: We need a mock base64 profile image for submission
    with open("/tmp/dummy_photo.png", "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82")

    page.locator("input[type='file']").set_input_files("/tmp/dummy_photo.png")
    page.wait_for_timeout(2000)

    # Take screenshot filled form
    page.screenshot(path="/home/jules/verification/screenshots/parent_teacher_filled.png")
    print("Screenshot of filled form saved.")

    # Setup alert handler to automatically dismiss browser alert dialogues
    page.on("dialog", lambda dialog: dialog.accept())

    # 4. Submit form
    page.get_by_role("button", name="Complete Registration").click()
    page.wait_for_timeout(4000)

    # Take screenshot of final result (should redirect to sign-in page /auth/signin)
    page.screenshot(path="/home/jules/verification/screenshots/verification_final.png")
    print("Screenshot of signin redirect saved.")

    # 5. Let's verify student sign-in with Admission Number only
    # To log in, let's query the database to get the generated admission number for Mary Okon's child!
    print("Querying database for child's generated admission number...")

    query = f"SELECT \"admissionnumber\" FROM student WHERE \"lastname\" = '{last_name}' LIMIT 1;"
    proc = subprocess.Popen(
        ['python3', 'self_created_tools/db_exec.py', query],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = proc.communicate()

    admission_number = "GOD999999"
    try:
        res = json.loads(stdout)
        if res and len(res) > 0:
            admission_number = res[0]["admissionnumber"]
    except Exception as parse_err:
        print("Could not parse DB response:", parse_err)
        print("stdout was:", stdout)
        print("stderr was:", stderr)

    print(f"Generated Admission Number found: {admission_number}")

    # 6. Go to Sign In page
    page.goto("http://localhost:3000/auth/signin")
    page.wait_for_timeout(2000)

    # Select STUDENT role
    page.locator("#role").select_option("STUDENT")
    page.wait_for_timeout(1000)

    # Screenshot of Student Login page showing Admission Number Only (Password hidden)
    page.screenshot(path="/home/jules/verification/screenshots/student_signin_form.png")
    print("Screenshot of student login form saved.")

    # Fill in Admission Number
    page.get_by_label("Admission Number Only").fill(admission_number)
    page.wait_for_timeout(1000)

    # Click Sign In
    page.get_by_role("button", name="Sign In").click()
    page.wait_for_timeout(4000)

    # Take final overview screenshot
    page.screenshot(path="/home/jules/verification/screenshots/student_dashboard_overview.png")
    print("Screenshot of student dashboard overview saved.")

if __name__ == "__main__":
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)
    os.makedirs("/home/jules/verification/videos", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            # Inject standard User-Agent for Playwright verification
            context.set_extra_http_headers({"User-Agent": "Playwright"})
            run_cuj(page, context)
        except Exception as e:
            print(f"Error occurred during execution: {e}")
            page.screenshot(path="/home/jules/verification/screenshots/error.png")
        finally:
            context.close()
            browser.close()
            print("Verification finished.")
