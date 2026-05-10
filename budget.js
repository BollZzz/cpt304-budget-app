(function () {
  "use strict";

  //SELECT ELEMENTS
  const balanceEl = document.querySelector(".balance .value");
  const incomeTotalEl = document.querySelector(".income-total");
  const outcomeTotalEl = document.querySelector(".outcome-total");
  const incomeEl = document.querySelector("#income");
  const expenseEl = document.querySelector("#expense");
  const allEl = document.querySelector("#all");
  const incomeList = document.querySelector("#income .list");
  const expenseList = document.querySelector("#expense .list");
  const allList = document.querySelector("#all .list");

  //SELECT BUTTONS
  const expenseBtn = document.querySelector(".first-tab");
  const incomeBtn = document.querySelector(".second-tab");
  const allBtn = document.querySelector(".third-tab");

  //INPUT BTS
  const addExpense = document.querySelector(".add-expense");
  const expenseTitle = document.getElementById("expense-title-input");
  const expenseAmount = document.getElementById("expense-amount-input");

  const addIncome = document.querySelector(".add-income");
  const incomeTitle = document.getElementById("income-title-input");
  const incomeAmount = document.getElementById("income-amount-input");

  //VARIABLES
  let ENTRY_LIST;
  let balance = 0,
    income = 0,
    outcome = 0;
  const DELETE = "delete",
    EDIT = "edit";

  const STORAGE_KEY = "entry_list";
  const STORAGE_SECRET = "budget_app_local_secret";

  function xorCipher(text, key) {
    let result = "";
    for (let i = 0; i < text.length; i++) {
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
    if (Array.isArray(decrypted)) return decrypted;

    // Backward compatibility for previously plain-text data
    try {
      const plainData = JSON.parse(storedValue);
      return Array.isArray(plainData) ? plainData : [];
    } catch (error) {
      return [];
    }
  }

  function saveEntryList(data) {
    localStorage.setItem(STORAGE_KEY, encryptData(data));
  }

  // LOOK IF THERE IS DATA IN LOCAL STORAGE
  ENTRY_LIST = loadEntryList();
  updateUI();

  //EVENT LISTENERS
  expenseBtn.addEventListener("click", function () {
    show(expenseEl);
    hide([incomeEl, allEl]);
    active(expenseBtn);
    inactive([incomeBtn, allBtn]);
  });
  incomeBtn.addEventListener("click", function () {
    show(incomeEl);
    hide([expenseEl, allEl]);
    active(incomeBtn);
    inactive([expenseBtn, allBtn]);
  });
  allBtn.addEventListener("click", function () {
    show(allEl);
    hide([incomeEl, expenseEl]);
    active(allBtn);
    inactive([incomeBtn, expenseBtn]);
  });

  addExpense.addEventListener("click", function () {
    const title = expenseTitle.value.trim();
    const amount = validateAmountInput(expenseAmount);

    // CHECK IF TITLE IS EMPTY OR AMOUNT IS INVALID => EXIT
    if (!title || amount === null) return;

    // ADD INPUTs TO ENTRY_LIST
    let expense = {
      type: "expense",
      title,
      amount,
    };
    ENTRY_LIST.push(expense);

    clearValidationError(expenseAmount);
    updateUI();
    clearInput([expenseTitle, expenseAmount]);
  });

  addIncome.addEventListener("click", function () {
    const title = incomeTitle.value.trim();
    const amount = validateAmountInput(incomeAmount);

    // CHECK IF TITLE IS EMPTY OR AMOUNT IS INVALID => EXIT
    if (!title || amount === null) return;

    // ADD INPUTs TO ENTRY_LIST
    let income = {
      type: "income",
      title,
      amount,
    };
    ENTRY_LIST.push(income);

    clearValidationError(incomeAmount);
    updateUI();
    clearInput([incomeTitle, incomeAmount]);
  });

  incomeList.addEventListener("click", deleteOrEdit);
  expenseList.addEventListener("click", deleteOrEdit);
  allList.addEventListener("click", deleteOrEdit);

  // HELEPER FUNCS
  function deleteOrEdit(event) {
    const targetBtn = event.target;
    const entry = targetBtn.parentNode;

    if (targetBtn.id == EDIT) {
      editEntry(entry);
    } else if (targetBtn.id == DELETE) {
      deleteEntry(entry);
    }
  }

  function deleteEntry(entry) {
    ENTRY_LIST.splice(entry.id, 1);
    updateUI();
  }

  function editEntry(entry) {
    const ENTRY = ENTRY_LIST[entry.id];

    if (ENTRY.type == "income") {
      incomeTitle.value = ENTRY.title;
      incomeAmount.value = ENTRY.amount;
    } else if (ENTRY.type == "expense") {
      expenseTitle.value = ENTRY.title;
      expenseAmount.value = ENTRY.amount;
    }
    deleteEntry(entry);
  }

  function updateUI() {
    income = calculateTotal("income", ENTRY_LIST);
    outcome = calculateTotal("expense", ENTRY_LIST);
    balance = Math.abs(calculateBalance(income, outcome));

    let sign = income >= outcome ? "$" : "-$";

    //UPDATE UI
    balanceEl.innerHTML = `<small>${sign}</small>${balance}`;
    outcomeTotalEl.innerHTML = `<small>$</small>${outcome}`;
    incomeTotalEl.innerHTML = `<small>$</small>${income}`;

    clearElement([expenseList, incomeList, allList]);

    ENTRY_LIST.forEach((entry, index) => {
      if (entry.type == "expense") {
        showEntry(expenseList, entry.type, entry.title, entry.amount, index);
      } else if (entry.type == "income") {
        showEntry(incomeList, entry.type, entry.title, entry.amount, index);
      }
      showEntry(allList, entry.type, entry.title, entry.amount, index);
    });
    updateChart(income, outcome);
    saveEntryList(ENTRY_LIST);
  }

  function showEntry(list, type, title, amount, id) {
    const li = document.createElement("li");
    li.id = id;
    li.className = type;

    const entryDiv = document.createElement("div");
    entryDiv.className = "entry";
    entryDiv.textContent = `${title} : $${amount}`;

    const editDiv = document.createElement("div");
    editDiv.id = "edit";

    const deleteDiv = document.createElement("div");
    deleteDiv.id = "delete";

    li.appendChild(entryDiv);
    li.appendChild(editDiv);
    li.appendChild(deleteDiv);

    list.insertBefore(li, list.firstChild);
  }

  function clearElement(elements) {
    elements.forEach((element) => {
      element.innerHTML = "";
    });
  }

  function calculateTotal(type, list) {
    let sum = 0;
    list.forEach((entry) => {
      if (entry.type == type) {
        sum += entry.amount;
      }
    });
    return sum;
  }

  function calculateBalance(income, outcome) {
    return income - outcome;
  }
  function clearInput(inputs) {
    inputs.forEach((input) => {
      input.value = "";
    });
  }

  function validateAmountInput(inputElement) {
    const rawValue = inputElement.value.trim();
    const amount = Number(rawValue);

    if (!rawValue || Number.isNaN(amount) || amount <= 0) {
      showValidationError(
        inputElement,
        "Please enter a valid amount greater than 0."
      );
      return null;
    }

    clearValidationError(inputElement);
    return amount;
  }

  function showValidationError(inputElement, message) {
    let errorEl = inputElement.nextElementSibling;

    if (!errorEl || !errorEl.classList.contains("validation-error")) {
      errorEl = document.createElement("small");
      errorEl.className = "validation-error";
      errorEl.style.color = "red";
      errorEl.style.display = "block";
      errorEl.style.marginTop = "4px";
      inputElement.insertAdjacentElement("afterend", errorEl);
    }

    errorEl.textContent = message;
  }

  function clearValidationError(inputElement) {
    const errorEl = inputElement.nextElementSibling;
    if (errorEl && errorEl.classList.contains("validation-error")) {
      errorEl.remove();
    }
  }

  function show(element) {
    element.classList.remove("hide");
  }

  function hide(elements) {
    elements.forEach((element) => {
      element.classList.add("hide");
    });
  }

  function active(element) {
    element.classList.add("focus");
  }
  function inactive(elements) {
    elements.forEach((element) => {
      element.classList.remove("focus");
    });
  }
})();
