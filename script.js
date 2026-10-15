const THEME_KEY = "tip-calculator-theme";

// Cache the form controls and result elements once so we don't query the DOM on every keystroke.
const billInput = document.getElementById("bill");
const customTipInput = document.getElementById("custom-tip");
const peopleInput = document.getElementById("people");
const peopleError = document.getElementById("people-error");
const tipButtons = document.querySelectorAll(".tip-btn");
const tipAmountEl = document.getElementById("tip-amount");
const totalAmountEl = document.getElementById("total-amount");
const perPersonEl = document.getElementById("per-person");
const themeToggle = document.getElementById("theme-toggle");
const themeToggleLabel = document.getElementById("theme-toggle-label");

// 15% is selected in the HTML by default; keep JS in sync with that starting state.
let selectedTipPercent = 15;

function parseMoney(value) {
  const amount = Number.parseFloat(value);
  // Treat empty, NaN, or negative numbers as zero so the UI never shows "NaN".
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function parsePeople(value) {
  const people = Number.parseInt(value, 10);
  return Number.isInteger(people) && people > 0 ? people : 0;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getTipPercent() {
  // A custom value overrides the preset buttons whenever the custom field has a number.
  const custom = customTipInput.value.trim();
  if (custom !== "") {
    const customPercent = Number.parseFloat(custom);
    return Number.isFinite(customPercent) && customPercent >= 0 ? customPercent : 0;
  }
  return selectedTipPercent;
}

function setActiveTipButton(percent) {
  tipButtons.forEach((button) => {
    const isActive = Number(button.dataset.tip) === percent;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function calculate() {
  const bill = parseMoney(billInput.value);
  const people = parsePeople(peopleInput.value);
  const tipPercent = getTipPercent();

  const tipAmount = bill * (tipPercent / 100);
  const total = bill + tipAmount;
  const perPerson = people > 0 ? total / people : 0;

  // Warn when the split would divide by zero; hide the message otherwise.
  peopleError.hidden = people > 0;

  tipAmountEl.textContent = formatCurrency(tipAmount);
  totalAmountEl.textContent = formatCurrency(total);
  perPersonEl.textContent = people > 0 ? formatCurrency(perPerson) : "$0.00";
}

function getTheme() {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme, persist) {
  document.documentElement.dataset.theme = theme;
  // Only write to storage when the user clicks the toggle, not on first paint.
  if (persist) {
    localStorage.setItem(THEME_KEY, theme);
  }

  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-pressed", String(isDark));
  // The label describes the action the button will take next.
  themeToggleLabel.textContent = isDark ? "Light mode" : "Dark mode";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

function toggleTheme() {
  applyTheme(getTheme() === "dark" ? "light" : "dark", true);
}

// Preset buttons set the tip and clear the custom field so the two inputs don't fight.
tipButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedTipPercent = Number(button.dataset.tip);
    customTipInput.value = "";
    setActiveTipButton(selectedTipPercent);
    calculate();
  });
});

// Typing a custom tip deselects the preset buttons.
customTipInput.addEventListener("input", () => {
  if (customTipInput.value.trim() !== "") {
    setActiveTipButton(null);
  } else {
    setActiveTipButton(selectedTipPercent);
  }
  calculate();
});

billInput.addEventListener("input", calculate);
peopleInput.addEventListener("input", calculate);
themeToggle.addEventListener("click", toggleTheme);

// Match the toggle label to the theme already applied in the <head> script.
applyTheme(getTheme(), false);

// Run once on load so the default values show immediately.
calculate();
