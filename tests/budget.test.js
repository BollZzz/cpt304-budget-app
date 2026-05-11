import { beforeEach, describe, expect, it } from "vitest";
import { JSDOM } from "jsdom";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function loadApp() {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const chartScript = fs.readFileSync(path.join(root, "chart.js"), "utf8");
  const budgetScript = fs.readFileSync(path.join(root, "budget.js"), "utf8");
  const dom = new JSDOM(html, {
    url: "https://example.test/",
    runScripts: "outside-only",
  });

  dom.window.HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: () => {},
    beginPath: () => {},
    arc: () => {},
    stroke: () => {},
    set lineWidth(value) {},
    set strokeStyle(value) {},
  });

  dom.window.eval(`${chartScript}\n//# sourceURL=chart.js`);
  dom.window.eval(`${budgetScript}\n//# sourceURL=budget.js`);
  return dom;
}

function click(element) {
  element.dispatchEvent(new element.ownerDocument.defaultView.MouseEvent("click", {
    bubbles: true,
  }));
}

function setValue(input, value) {
  input.value = value;
  input.dispatchEvent(new input.ownerDocument.defaultView.Event("input", {
    bubbles: true,
  }));
}

describe("Budget App", () => {
  beforeEach(() => {
    const dom = new JSDOM("", { url: "https://example.test/" });
    dom.window.localStorage.clear();
  });

  it("renders the main app and cookie banner", () => {
    const dom = loadApp();
    const document = dom.window.document;

    expect(document.querySelector("#app-name").textContent).toContain("BudgetApp");
    expect(document.querySelector(".dash-title").textContent).toBe("Dashboard");
    expect(document.querySelector(".cookie-banner").classList.contains("hide")).toBe(false);
  });

  it("adds income and expense entries and calculates totals", () => {
    const dom = loadApp();
    const document = dom.window.document;

    click(document.querySelector(".second-tab"));
    setValue(document.querySelector("#income-title-input"), "Salary");
    setValue(document.querySelector("#income-amount-input"), "1000");
    click(document.querySelector(".add-income"));

    click(document.querySelector(".first-tab"));
    setValue(document.querySelector("#expense-title-input"), "Rent");
    setValue(document.querySelector("#expense-amount-input"), "350");
    click(document.querySelector(".add-expense"));

    expect(document.querySelector(".income-total").textContent).toBe("$1000");
    expect(document.querySelector(".outcome-total").textContent).toBe("$350");
    expect(document.querySelector(".balance .value").textContent).toBe("$650");
    expect(document.querySelector("#all .list").textContent).toContain("Salary : $1000");
    expect(document.querySelector("#all .list").textContent).toContain("Rent : $350");
  });

  it("deletes an entry", () => {
    const dom = loadApp();
    const document = dom.window.document;

    click(document.querySelector(".second-tab"));
    setValue(document.querySelector("#income-title-input"), "Salary");
    setValue(document.querySelector("#income-amount-input"), "500");
    click(document.querySelector(".add-income"));

    click(document.querySelector(".delete-entry"));

    expect(document.querySelector(".income-total").textContent).toBe("$0");
    expect(document.querySelector(".status-message").textContent).toBe("Entry deleted.");
  });

  it("validates empty titles and invalid amounts", () => {
    const dom = loadApp();
    const document = dom.window.document;

    click(document.querySelector(".first-tab"));
    setValue(document.querySelector("#expense-title-input"), "");
    setValue(document.querySelector("#expense-amount-input"), "-1");
    click(document.querySelector(".add-expense"));

    expect(document.querySelectorAll(".validation-error").length).toBe(2);
    expect(document.querySelector("#expense .list").children.length).toBe(0);
  });

  it("toggles language and persists the selected language", () => {
    const dom = loadApp();
    const document = dom.window.document;

    click(document.querySelector(".language-toggle"));

    expect(document.documentElement.lang).toBe("zh-CN");
    expect(document.querySelector("[data-i18n='balance']").textContent).toBe("余额");
    expect(dom.window.localStorage.getItem("budget_app_language")).toBe("zh");
  });

  it("stores cookie banner choices", () => {
    const dom = loadApp();
    const document = dom.window.document;

    click(document.querySelector(".cookie-reject"));

    expect(dom.window.localStorage.getItem("budget_app_cookie_consent")).toBe("rejected");
    expect(document.querySelector(".cookie-banner").classList.contains("hide")).toBe(true);
  });

  it("renders the privacy policy page", () => {
    const html = fs.readFileSync(path.join(root, "privacy.html"), "utf8");
    const dom = new JSDOM(html);
    const document = dom.window.document;

    expect(document.querySelector("h1").textContent).toBe("Privacy Policy");
    expect(document.body.textContent).toContain("localStorage");
    expect(document.body.textContent).toContain("backend database");
  });
});
