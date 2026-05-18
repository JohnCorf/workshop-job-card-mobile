const fields = [
  "companyName",
  "jobNumber",
  "jobDate",
  "engineer",
  "labourHours",
  "machineHours",
  "customerName",
  "contactDetails",
  "address",
  "machine",
  "serialNumber",
  "faultReported",
  "workCarriedOut",
  "partsUsed",
  "notes"
];

const storageKey = "southworx-workshop-job-card-v1";

const today = new Date().toISOString().slice(0, 10);
document.getElementById("jobDate").value = today;

function clean(value) {
  return value && value.trim() ? value.trim() : "-";
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value + "T00:00:00");
  return date.toLocaleDateString("en-GB");
}

function getData() {
  const data = {};
  fields.forEach((id) => {
    data[id] = document.getElementById(id).value;
  });
  return data;
}

function setData(data) {
  fields.forEach((id) => {
    const el = document.getElementById(id);
    if (el && data[id] !== undefined) {
      el.value = data[id];
    }
  });
  updatePreview();
}

function updatePreview() {
  const data = getData();

  document.querySelectorAll("[data-preview]").forEach((el) => {
    const key = el.getAttribute("data-preview");
    let value = data[key];

    if (key === "companyName" && !clean(value).replace("-", "")) {
      el.textContent = "Your Workshop Name";
      return;
    }

    if (key === "jobDate") {
      el.textContent = formatDate(value);
      return;
    }

    el.textContent = clean(value);
  });

  localStorage.setItem(storageKey, JSON.stringify(data));
  const status = document.getElementById("saveStatus");
  status.textContent = "Saved locally";
}

function loadSaved() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return;

  try {
    const data = JSON.parse(saved);
    setData(data);
  } catch {
    localStorage.removeItem(storageKey);
  }
}

function loadSample() {
  setData({
    companyName: "SouthWorx Workshop Services",
    jobNumber: "J-000124",
    jobDate: today,
    engineer: "J. Smith",
    labourHours: "3.5",
    machineHours: "4,280",
    customerName: "Greenfield Farm",
    contactDetails: "office@example.co.uk / 01234 567890",
    address: "Greenfield Farm\nWinchester Road\nHampshire",
    machine: "Massey Ferguson Large Square Baler",
    serialNumber: "MF2270-123456",
    faultReported: "Customer reported inconsistent knotter performance and intermittent missed bales during operation.",
    workCarriedOut: "Inspected knotter assembly, checked twine path, adjusted tension settings, cleaned debris from knotter area and carried out operational test.",
    partsUsed: "2 × Twine discs\n1 × Spring\nWorkshop consumables",
    notes: "Machine tested after adjustment. Customer advised to monitor knotter performance during next working session."
  });
}

function clearForm() {
  fields.forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("jobDate").value = today;
  updatePreview();
}

function sendEmail() {
  const data = getData();

  const subject = `Workshop Job Card ${clean(data.jobNumber)} - ${clean(data.customerName)}`;

  const body = [
    "Workshop Job Card",
    "",
    `Company: ${clean(data.companyName)}`,
    `Job Number: ${clean(data.jobNumber)}`,
    `Date: ${formatDate(data.jobDate)}`,
    `Engineer: ${clean(data.engineer)}`,
    `Labour Hours: ${clean(data.labourHours)}`,
    "",
    `Customer: ${clean(data.customerName)}`,
    `Contact: ${clean(data.contactDetails)}`,
    `Address: ${clean(data.address)}`,
    "",
    `Machine / Asset: ${clean(data.machine)}`,
    `Serial Number: ${clean(data.serialNumber)}`,
    `Machine Hours: ${clean(data.machineHours)}`,
    "",
    "Fault Reported:",
    clean(data.faultReported),
    "",
    "Work Carried Out:",
    clean(data.workCarriedOut),
    "",
    "Parts Used:",
    clean(data.partsUsed),
    "",
    "Additional Notes:",
    clean(data.notes)
  ].join("\n");

  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

fields.forEach((id) => {
  document.getElementById(id).addEventListener("input", updatePreview);
});

document.getElementById("printBtn").addEventListener("click", () => window.print());
document.getElementById("emailBtn").addEventListener("click", sendEmail);
document.getElementById("sampleBtn").addEventListener("click", loadSample);
document.getElementById("clearBtn").addEventListener("click", clearForm);

loadSaved();
updatePreview();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // App still works without service worker.
    });
  });
}
