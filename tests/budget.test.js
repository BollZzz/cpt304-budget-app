import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const appHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");

async function loadApp() {
  document.documentElement.innerHTML = appHtml;
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: () => {},
    beginPath: () => {},
    arc: () => {},
    stroke: () => {},
    set lineWidth(value) {},
    set strokeStyle(value) {},
  });

  await import("../chart.js");
  await import("../budget.js");
}

function click(element) {
  element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

function setValue(input, value) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function pressEnter(input) {
  input.dispatchEvent(new KeyboardEvent("keydown", {
    bubbles: true,
    key: "Enter",
  }));
}

describe("Budget App", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    delete globalThis.updateChart;
  });

  it("renders the main app and cookie banner", async () => {
    await loadApp();

    expect(document.querySelector("#app-name").textContent).toContain("BudgetApp");
    expect(document.querySelector(".dash-title").textContent).toBe("Dashboard");
    expect(document.querySelector(".cookie-banner").classList.contains("hide")).toBe(false);
  });

  it("adds income and expense entries and calculates totals", async () => {
    await loadApp();

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

  it("deletes an entry", async () => {
    await loadApp();

    click(document.querySelector(".second-tab"));
    setValue(document.querySelector("#income-title-input"), "Salary");
    setValue(document.querySelector("#income-amount-input"), "500");
    click(document.querySelector(".add-income"));

    click(document.querySelector(".delete-entry"));

    expect(document.querySelector(".income-total").textContent).toBe("$0");
    expect(document.querySelector(".status-message").textContent).toBe("Entry deleted.");
  });

  it("edits an entry and handles Enter submissions", async () => {
    await loadApp();

    click(document.querySelector(".second-tab"));
    setValue(document.querySelector("#income-title-input"), "Bonus");
    setValue(document.querySelector("#income-amount-input"), "200");
    pressEnter(document.querySelector("#income-amount-input"));
    click(document.querySelector(".edit-entry"));

    expect(document.querySelector("#income-title-input").value).toBe("Bonus");
    expect(document.querySelector("#income-amount-input").value).toBe("200");
    expect(document.querySelector(".status-message").textContent).toBe(
      "Entry moved back to the form for editing."
    );

    pressEnter(document.querySelector("#income-title-input"));
    expect(document.querySelector(".income-total").textContent).toBe("$200");
  });

  it("validates empty titles, invalid amounts, and excessive amounts", async () => {
    await loadApp();

    click(document.querySelector(".first-tab"));
    setValue(document.querySelector("#expense-title-input"), "");
    setValue(document.querySelector("#expense-amount-input"), "-1");
    click(document.querySelector(".add-expense"));

    expect(document.querySelectorAll(".validation-error").length).toBe(2);

    setValue(document.querySelector("#expense-title-input"), "Car");
    setValue(document.querySelector("#expense-amount-input"), "1000001");
    click(document.querySelector(".add-expense"));

    expect(document.querySelector("#expense .list").children.length).toBe(0);
    expect(document.querySelector(".validation-error").textContent).toContain("1,000,000");
  });

  it("toggles language and persists the selected language", async () => {
    await loadApp();

    click(document.querySelector(".language-toggle"));

    expect(document.documentElement.lang).toBe("zh-CN");
    expect(document.querySelector("[data-i18n='balance']").textContent).toBe("余额");
    expect(localStorage.getItem("budget_app_language")).toBe("zh");
  });

  it("stores cookie banner choices", async () => {
    await loadApp();

    click(document.querySelector(".cookie-reject"));

    expect(localStorage.getItem("budget_app_cookie_consent")).toBe("rejected");
    expect(document.querySelector(".cookie-banner").classList.contains("hide")).toBe(true);
  });

  it("loads saved encrypted data, ignores invalid data, and normalises entries", async () => {
    localStorage.setItem(
      "entry_list",
      btoa(
        [...JSON.stringify([
          { type: "income", title: "Salary", amount: "1200.456" },
          { type: "expense", title: "Rent", amount: 350 },
          { type: "other", title: "Ignore", amount: 1 },
        ])]
          .map((char, index) =>
            String.fromCharCode(
              char.charCodeAt(0) ^
                "budget_app_local_secret".charCodeAt(index % "budget_app_local_secret".length)
            )
          )
          .join("")
      )
    );

    await loadApp();

    expect(document.querySelector(".income-total").textContent).toBe("$1200.46");
    expect(document.querySelector(".outcome-total").textContent).toBe("$350");
    expect(window.BudgetApp.normaliseEntryList([{ type: "income", title: "Ok", amount: 1 }])).toEqual([
      { type: "income", title: "Ok", amount: 1 },
    ]);

    vi.resetModules();
    localStorage.setItem("entry_list", "not-json");
    await loadApp();
    expect(document.querySelector(".income-total").textContent).toBe("$0");
  });

  it("renders the privacy policy page", () => {
    const html = fs.readFileSync(path.join(root, "privacy.html"), "utf8");
    const privacyDocument = new DOMParser().parseFromString(html, "text/html");

    expect(privacyDocument.querySelector("h1").textContent).toBe("Privacy Policy");
    expect(privacyDocument.body.textContent).toContain("localStorage");
    expect(privacyDocument.body.textContent).toContain("backend database");
  });
});
