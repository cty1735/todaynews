"""Live integration check. Start the app first; requires Python Playwright + Chrome."""
import json
import os
from pathlib import Path
from urllib.parse import urlparse, parse_qs

from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("NEWSNOW_URL", "http://127.0.0.1:5188")
CHROME = os.environ.get("CHROME_PATH", r"C:\Program Files\Google\Chrome\Application\chrome.exe")
ARTIFACTS = Path(__file__).parent.parent / "screenshots" / "local"
ARTIFACTS.mkdir(parents=True, exist_ok=True)


def is_source(response, source="baidu"):
    parsed = urlparse(response.url)
    return parsed.path == "/api/s" and parse_qs(parsed.query).get("id") == [source]


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROME)
    try:
        context = browser.new_context(viewport={"width": 1440, "height": 1000}, reduced_motion="reduce", service_workers="block")
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        assert context.request.get(f"{BASE}/api/enable-login").json() == {"enable": False}

        # Real collectors, not fixture responses. Cache reads must preserve collection time.
        live_counts = {}
        for source in ["baidu", "bilibili-hot-search", "weibo", "zhihu", "wallstreetcn-hot", "cls-telegraph", "thepaper", "ithome", "github-trending-today"]:
            response = context.request.get(f"{BASE}/api/s?id={source}&latest", timeout=90000)
            assert response.ok, (source, response.status)
            payload = response.json()
            assert payload["items"] and payload["updatedTime"] > 0, source
            assert all(item["title"] and str(item["url"]).startswith("http") for item in payload["items"]), source
            live_counts[source] = len(payload["items"])
        first = context.request.get(f"{BASE}/api/s?id=baidu").json()
        second = context.request.get(f"{BASE}/api/s?id=baidu").json()
        assert first["updatedTime"] == second["updatedTime"], "Cache falsely reported a new collection time"

        page.clock.install()
        page.goto(f"{BASE}/c/focus", wait_until="networkidle")
        cards = page.locator("main [data-source]")
        expect(cards).to_have_count(9)
        baidu = page.locator('main [data-source="baidu"]')
        expect(baidu.locator("ol a").first).to_be_visible(timeout=60000)
        expect(page.get_by_text("TanStack Router", exact=True)).to_have_count(0)
        page.screenshot(path=str(ARTIFACTS / "desktop.png"), full_page=True)

        with page.expect_response(is_source) as refreshed:
            page.get_by_role("button", name="刷新百度热搜", exact=True).click()
        assert refreshed.value.ok

        # Accelerate browser time, leaving the live backend untouched.
        with page.expect_response(is_source, timeout=20000) as polled:
            page.clock.fast_forward(121000)
        assert polled.value.ok, "Two-minute automatic refresh did not reach the API"
        page.clock.resume()

        # Changes survive a hard reload, including adding a source via the search dialog.
        page.get_by_role("button", name="取消关注百度热搜", exact=True).click()
        expect(page.locator('main [data-source="baidu"]')).to_have_count(0)
        page.reload(wait_until="networkidle")
        expect(page.locator('main [data-source="baidu"]')).to_have_count(0)
        page.get_by_role("button", name="添加新闻来源", exact=True).click()
        dialog = page.get_by_role("dialog", name="搜索新闻来源")
        expect(dialog).to_be_visible()
        dialog.get_by_role("combobox", name="搜索新闻来源").fill("百度")
        dialog.get_by_role("option", name="百度热搜", exact=True).click()
        page.keyboard.press("Escape")
        page.reload(wait_until="networkidle")
        expect(page.locator('main [data-source="baidu"]')).to_have_count(1)

        page.get_by_role("button", name="打开菜单", exact=True).click()
        expect(page.locator("#dropdown-menu")).to_be_visible()
        page.keyboard.press("Escape")
        expect(page.locator("#dropdown-menu")).to_have_count(0)

        # Empty subscriptions are intentional and must not be replaced by defaults.
        page.evaluate("""() => {
            const value = JSON.parse(localStorage.getItem('metadata'));
            value.data.focus = [];
            value.updatedTime = Date.now();
            localStorage.setItem('metadata', JSON.stringify(value));
        }""")
        page.reload(wait_until="networkidle")
        expect(page.get_by_text("还没有关注的新闻来源", exact=True)).to_be_visible()
        page.locator("main").get_by_role("button", name="添加新闻来源", exact=True).click()
        expect(page.get_by_role("dialog", name="搜索新闻来源")).to_be_visible()
        assert not errors, errors
        context.close()

        # A failed source has a retry action; recovering the network restores live items.
        failure = browser.new_context(service_workers="block")
        failure.add_init_script("localStorage.setItem('metadata', JSON.stringify({updatedTime:1,data:{focus:['baidu']},action:'init'}))")
        failed_page = failure.new_page()
        failed_page.route("**/api/s/entire", lambda route: route.fulfill(json=[]))
        failed_page.route("**/api/s?*", lambda route: route.fulfill(status=503, json={"message": "test outage"}))
        failed_page.goto(f"{BASE}/c/focus", wait_until="networkidle")
        expect(failed_page.get_by_text("暂时无法获取该来源", exact=True)).to_be_visible()
        failed_page.unroute("**/api/s?*")
        failed_page.get_by_role("button", name="重新获取", exact=True).click()
        expect(failed_page.locator('[data-source="baidu"] ol a').first).to_be_visible(timeout=60000)
        failure.close()

        mobile = browser.new_context(**p.devices["iPhone 13"], reduced_motion="reduce", service_workers="block")
        phone = mobile.new_page()
        phone.goto(f"{BASE}/c/focus", wait_until="networkidle")
        expect(phone.locator('[data-source="baidu"] ol a').first).to_be_visible(timeout=60000)
        assert phone.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Mobile page overflow"
        expect(phone.get_by_text("左右滑动查看更多", exact=True)).to_be_visible()
        phone.screenshot(path=str(ARTIFACTS / "mobile.png"), full_page=True)
        phone.get_by_role("button", name="来源", exact=True).click()
        expect(phone.get_by_role("dialog", name="搜索新闻来源")).to_be_visible()
        assert phone.evaluate("document.documentElement.scrollWidth <= innerWidth"), "Mobile dialog overflow"
        mobile.close()
        print(json.dumps({"passed": True, "live_items": live_counts, "checks": ["live APIs", "cache timestamps", "desktop", "manual refresh", "automatic refresh", "saved follows", "search", "menu", "empty state", "outage recovery", "mobile"], "screenshots": str(ARTIFACTS)}, ensure_ascii=False, indent=2))
    finally:
        browser.close()
