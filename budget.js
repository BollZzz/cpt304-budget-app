(function () {
  "use strict";

  const STORAGE_KEY = "entry_list";
  const LANGUAGE_KEY = "budget_app_language";
  const COOKIE_KEY = "budget_app_cookie_consent";
  const STORAGE_SECRET = "budget_app_local_secret";
  const MAX_TITLE_LENGTH = 60;
  const MAX_AMOUNT = 1000000;

  const translations = {
    en: {
      balance: "Balance",
      income: "Income",
      expense: "Expense",
      expenses: "Expenses",
      dashboard: "Dashboard",
      all: "All",
      expenseTitle: "Expense title",
      expenseAmount: "Expense amount",
      incomeTitle: "Income title",
      incomeAmount: "Income amount",
      addExpense: "Add expense",
      addIncome: "Add income",
      edit: "Edit",
      delete: "Delete",
      privacyPolicy: "Privacy Policy",
      titlePlaceholder: "Title",
      amountPlaceholder: "$0",
      cookieText:
        "This app stores your language, cookie choice and budget entries in this browser.",
      acceptCookies: "Accept",
      rejectCookies: "Reject",
      emptyTitle: "Please enter a title.",
      invalidAmount: "Please enter a valid amount greater than 0.",
      tooLargeAmount: "Please enter an amount of 1,000,000 or less.",
      addedExpense: "Expense added.",
      addedIncome: "Income added.",
      deletedEntry: "Entry deleted.",
      editingEntry: "Entry moved back to the form for editing.",
      cookieAccepted: "Cookie choice saved: accepted.",
      cookieRejected: "Cookie choice saved: rejected.",
      languageToggle: "Switch language to Chinese",
    },
    zh: {
      balance: "余额",
      income: "收入",
      expense: "支出",
      expenses: "支出",
      dashboard: "仪表盘",
      all: "全部",
      expenseTitle: "支出标题",
      expenseAmount: "支出金额",
      incomeTitle: "收入标题",
      incomeAmount: "收入金额",
      addExpense: "添加支出",
      addIncome: "添加收入",
      edit: "编辑",
      delete: "删除",
      privacyPolicy: "隐私政策",
      titlePlaceholder: "标题",
      amountPlaceholder: "$0",
      cookieText:
        "本应用会在此浏览器中保存语言、Cookie 选择和预算记录。",
      acceptCookies: "接受",
      rejectCookies: "拒绝",
      emptyTitle: "请输入标题。",
      invalidAmount: "请输入大于 0 的有效金额。",
      tooLargeAmount: "请输入不超过 1,000,000 的金额。",
      addedExpense: "支出已添加。",
      addedIncome: "收入已添加。",
      deletedEntry: "记录已删除。",
      editingEntry: "记录已移回表单以便编辑。",
      cookieAccepted: "Cookie 选择已保存：接受。",
      cookieRejected: "Cookie 选择已保存：拒绝。",
      languageToggle: "切换语言为英文",
    },
  };

  const elements = {
    balance: document.querySelector(".balance .value"),
    incomeTotal: document.querySelector(".income-total"),
    outcomeTotal: document.querySelector(".outcome-total"),
    incomePanel: document.querySelector("#income"),
    expensePanel: document.querySelector("#expense"),
    allPanel: document.querySelector("#all"),
    incomeList: document.querySelector("#income .list"),
    expenseList: document.querySelector("#expense .list"),
    allList: document.querySelector("#all .list"),
    expenseTab: document.querySelector(".first-tab"),
    incomeTab: document.querySelector(".second-tab"),
    allTab: document.querySelector(".third-tab"),
    addExpense: document.querySelector(".add-expense"),
    expenseTitle: document.getElementById("expense-title-input"),
    expenseAmount: document.getElementById("expense-amount-input"),
    addIncome: document.querySelector(".add-income"),
    incomeTitle: document.getElementById("income-title-input"),
    incomeAmount: document.getElementById("income-amount-input"),
    status: document.querySelector(".status-message"),
    languageToggle: document.querySelector(".language-toggle"),
    cookieBanner: document.querySelector(".cookie-banner"),
    cookieAccept: document.querySelector(".cookie-accept"),
    cookieReject: document.querySelector(".cookie-reject"),
  };

  let entryList = loadEntryList();
  let currentLanguage = getSavedLanguage();

  applyLanguage(currentLanguage);
  setupCookieBanner();
  updateUI();

  elements.expenseTab.addEventListener("click", function () {
    switchPanel("expense");
  });
  elements.incomeTab.addEventListener("click", function () {
    switchPanel("income");
  });
  elements.allTab.addEventListener("click", function () {
    switchPanel("all");
  });

  elements.addExpense.addEventListener("click", function () {
    addEntry("expense");
  });
  elements.addIncome.addEventListener("click", function () {
    addEntry("income");
  });

  [elements.expenseAmount, elements.incomeAmount].forEach((input) => {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        addEntry(input === elements.expenseAmount ? "expense" : "income");
      }
    });
  });

  [elements.expenseTitle, elements.incomeTitle].forEach((input) => {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        addEntry(input === elements.expenseTitle ? "expense" : "income");
      }
    });
  });

  elements.incomeList.addEventListener("click", handleEntryAction);
  elements.expenseList.addEventListener("click", handleEntryAction);
  elements.allList.addEventListener("click", handleEntryAction);

  elements.languageToggle.addEventListener("click", function () {
    currentLanguage = currentLanguage === "en" ? "zh" : "en";
    localStorage.setItem(LANGUAGE_KEY, currentLanguage);
    applyLanguage(currentLanguage);
  });

  elements.cookieAccept.addEventListener("click", function () {
    saveCookieConsent("accepted", t("cookieAccepted"));
  });

  elements.cookieReject.addEventListener("click", function () {
    saveCookieConsent("rejected", t("cookieRejected"));
  });

  function addEntry(type) {
    const titleInput =
      type === "expense" ? elements.expenseTitle : elements.incomeTitle;
    const amountInput =
      type === "expense" ? elements.expenseAmount : elements.incomeAmount;
    const title = validateTitleInput(titleInput);
    const amount = validateAmountInput(amountInput);

    if (!title || amount === null) return;

    entryList.push({ type, title, amount });
    updateUI();
    clearInput([titleInput, amountInput]);
    setStatus(type === "expense" ? t("addedExpense") : t("addedIncome"));
  }

  function handleEntryAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const entryEl = button.closest("li");
    const index = Number(entryEl.dataset.index);
    if (!Number.isInteger(index) || !entryList[index]) return;

    if (button.dataset.action === "edit") {
      editEntry(index);
    } else if (button.dataset.action === "delete") {
      deleteEntry(index);
    }
  }

  function deleteEntry(index) {
    entryList.splice(index, 1);
    updateUI();
    setStatus(t("deletedEntry"));
  }

  function editEntry(index) {
    const entry = entryList[index];
    const titleInput =
      entry.type === "income" ? elements.incomeTitle : elements.expenseTitle;
    const amountInput =
      entry.type === "income" ? elements.incomeAmount : elements.expenseAmount;

    titleInput.value = entry.title;
    amountInput.value = entry.amount;
    deleteEntry(index);
    switchPanel(entry.type);
    titleInput.focus();
    setStatus(t("editingEntry"));
  }

  function updateUI() {
    const income = calculateTotal("income", entryList);
    const expense = calculateTotal("expense", entryList);
    const balance = calculateBalance(income, expense);
    const sign = balance < 0 ? "-$" : "$";

    elements.balance.innerHTML = `<small>${sign}</small>${Math.abs(balance)}`;
    elements.outcomeTotal.innerHTML = `<small>$</small>${expense}`;
    elements.incomeTotal.innerHTML = `<small>$</small>${income}`;

    clearElement([elements.expenseList, elements.incomeList, elements.allList]);

    entryList.forEach((entry, index) => {
      if (entry.type === "expense") {
        showEntry(elements.expenseList, entry, index);
      } else if (entry.type === "income") {
        showEntry(elements.incomeList, entry, index);
      }
      showEntry(elements.allList, entry, index);
    });

    if (typeof updateChart === "function") {
      updateChart(income, expense);
    }

    saveEntryList(entryList);
  }

  function showEntry(list, entry, index) {
    const li = document.createElement("li");
    li.dataset.index = index;
    li.className = entry.type;

    const entryDiv = document.createElement("div");
    entryDiv.className = "entry";
    entryDiv.textContent = `${entry.title} : $${entry.amount}`;

    const editButton = createEntryButton("edit", t("edit"));
    const deleteButton = createEntryButton("delete", t("delete"));

    li.appendChild(entryDiv);
    li.appendChild(editButton);
    li.appendChild(deleteButton);

    list.insertBefore(li, list.firstChild);
  }

  function createEntryButton(action, label) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `entry-action ${action}-entry`;
    button.dataset.action = action;
    button.setAttribute("aria-label", label);
    button.textContent = label;
    return button;
  }

  function calculateTotal(type, list) {
    return list
      .filter((entry) => entry.type === type)
      .reduce((sum, entry) => sum + entry.amount, 0);
  }

  function calculateBalance(income, expense) {
    return income - expense;
  }

  function validateTitleInput(inputElement) {
    const title = inputElement.value.trim();

    if (!title) {
      showValidationError(inputElement, t("emptyTitle"));
      return null;
    }

    const cleanedTitle = title.slice(0, MAX_TITLE_LENGTH);
    clearValidationError(inputElement);
    return cleanedTitle;
  }

  function validateAmountInput(inputElement) {
    const rawValue = inputElement.value.trim();
    const amount = Number(rawValue);

    if (!rawValue || !Number.isFinite(amount) || amount <= 0) {
      showValidationError(inputElement, t("invalidAmount"));
      return null;
    }

    if (amount > MAX_AMOUNT) {
      showValidationError(inputElement, t("tooLargeAmount"));
      return null;
    }

    clearValidationError(inputElement);
    return Math.round(amount * 100) / 100;
  }

  function showValidationError(inputElement, message) {
    let errorEl = inputElement.nextElementSibling;

    if (!errorEl || !errorEl.classList.contains("validation-error")) {
      errorEl = document.createElement("small");
      errorEl.className = "validation-error";
      errorEl.setAttribute("role", "alert");
      inputElement.insertAdjacentElement("afterend", errorEl);
    }

    errorEl.textContent = message;
    inputElement.setAttribute("aria-invalid", "true");
  }

  function clearValidationError(inputElement) {
    const errorEl = inputElement.nextElementSibling;
    if (errorEl && errorEl.classList.contains("validation-error")) {
      errorEl.remove();
    }
    inputElement.removeAttribute("aria-invalid");
  }

  function clearInput(inputs) {
    inputs.forEach((input) => {
      input.value = "";
    });
  }

  function clearElement(elementsToClear) {
    elementsToClear.forEach((element) => {
      element.textContent = "";
    });
  }

  function switchPanel(panelName) {
    const panels = {
      expense: elements.expensePanel,
      income: elements.incomePanel,
      all: elements.allPanel,
    };
    const tabs = {
      expense: elements.expenseTab,
      income: elements.incomeTab,
      all: elements.allTab,
    };

    Object.entries(panels).forEach(([name, panel]) => {
      panel.classList.toggle("hide", name !== panelName);
    });

    Object.entries(tabs).forEach(([name, tab]) => {
      const selected = name === panelName;
      tab.classList.toggle("focus", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
  }

  function applyLanguage(language) {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });

    elements.expenseTitle.placeholder = t("titlePlaceholder");
    elements.incomeTitle.placeholder = t("titlePlaceholder");
    elements.expenseAmount.placeholder = t("amountPlaceholder");
    elements.incomeAmount.placeholder = t("amountPlaceholder");
    elements.addExpense.setAttribute("aria-label", t("addExpense"));
    elements.addIncome.setAttribute("aria-label", t("addIncome"));
    elements.languageToggle.textContent = language === "en" ? "中文" : "English";
    elements.languageToggle.setAttribute("aria-label", t("languageToggle"));
    updateEntryActionLabels();
  }

  function updateEntryActionLabels() {
    document.querySelectorAll(".edit-entry").forEach((button) => {
      button.textContent = t("edit");
      button.setAttribute("aria-label", t("edit"));
    });
    document.querySelectorAll(".delete-entry").forEach((button) => {
      button.textContent = t("delete");
      button.setAttribute("aria-label", t("delete"));
    });
  }

  function t(key) {
    return translations[currentLanguage][key] || translations.en[key] || key;
  }

  function getSavedLanguage() {
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    return savedLanguage === "zh" ? "zh" : "en";
  }

  function setupCookieBanner() {
    const choice = localStorage.getItem(COOKIE_KEY);
    if (!choice) {
      elements.cookieBanner.classList.remove("hide");
    }
  }

  function saveCookieConsent(choice, message) {
    localStorage.setItem(COOKIE_KEY, choice);
    elements.cookieBanner.classList.add("hide");
    setStatus(message);
  }

  function setStatus(message) {
    elements.status.textContent = message;
  }

  function xorCipher(text, key) {
    let result = "";
    for (let i = 0; i < text.length; i += 1) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  }

  function encryptData(data) {
    const json = JSON.stringify(data);
    const encrypted = xorCipher(json, STORAGE_SECRET);
    return btoa(encrypted);
  }

  function decryptData(encryptedText) {
    try {
      const decoded = atob(encryptedText);
      const decrypted = xorCipher(decoded, STORAGE_SECRET);
      return JSON.parse(decrypted);
    } catch (error) {
      return null;
    }
  }

  function loadEntryList() {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return [];

    const decrypted = decryptData(storedValue);
    if (Array.isArray(decrypted)) return normaliseEntryList(decrypted);

    try {
      const plainData = JSON.parse(storedValue);
      return Array.isArray(plainData) ? normaliseEntryList(plainData) : [];
    } catch (error) {
      return [];
    }
  }

  function normaliseEntryList(list) {
    return list
      .filter(
        (entry) =>
          entry &&
          (entry.type === "income" || entry.type === "expense") &&
          typeof entry.title === "string" &&
          Number.isFinite(Number(entry.amount)) &&
          Number(entry.amount) > 0
      )
      .map((entry) => ({
        type: entry.type,
        title: entry.title.slice(0, MAX_TITLE_LENGTH),
        amount: Math.round(Number(entry.amount) * 100) / 100,
      }));
  }

  function saveEntryList(data) {
    localStorage.setItem(STORAGE_KEY, encryptData(data));
  }

  window.BudgetApp = {
    calculateTotal,
    calculateBalance,
    normaliseEntryList,
    translations,
  };
})();
