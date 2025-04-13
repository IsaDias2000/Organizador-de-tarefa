
document.addEventListener("DOMContentLoaded", () => {
  const tabs = {
    "finance-tab": "finance-section",
    "payment-tab": "payment-section",
    "reminder-tab": "reminder-section"
  };
  for (let btn in tabs) {
    document.getElementById(btn).addEventListener("click", () => {
      document.querySelectorAll(".tab-section").forEach(s => s.classList.remove("active"));
      document.getElementById(tabs[btn]).classList.add("active");
    });
  }
});
