const accessPassword = "lurch2026";
const accessStorageKey = "southworx-job-card-access-v4";
const storageKey = "southworx-workshop-current-job-v4";
const jobsKey = "southworx-workshop-saved-jobs-v4";
const customersKey = "southworx-workshop-customers-v4";
const settingsKey = "southworx-workshop-settings-v6";
const photosKey = "southworx-workshop-photos-v6";
let photos = [];

const fields = ["companyName","jobNumber","jobDate","engineer","labourHours","machineHours","customerName","contactDetails","address","machine","serialNumber","faultReported","workCarriedOut","notes"];
let parts = [];
const today = new Date().toISOString().slice(0,10);

function qs(id){return document.getElementById(id);}
function clean(v){return v && String(v).trim() ? String(v).trim() : "-";}
function formatDate(v){if(!v)return "-";return new Date(v+"T00:00:00").toLocaleDateString("en-GB");}
function escapeHtml(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function makeId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}

function unlockApp(){const entered=qs("accessCode").value.trim();if(entered===accessPassword){localStorage.setItem(accessStorageKey,"unlocked");showApp();}else{qs("lockError").textContent="Incorrect access code.";}}
function showApp(){qs("lockScreen").style.display="none";qs("appContent").classList.remove("locked");}
function checkAccess(){if(localStorage.getItem(accessStorageKey)==="unlocked")showApp();}

function getJobComplete(){return document.querySelector('input[name="jobComplete"]:checked')?.value || "no";}
function getData(){
  const data={}; fields.forEach(id=>data[id]=qs(id).value);
  data.jobComplete=getJobComplete(); data.parts=parts; data.photos=photos; data.updatedAt=new Date().toISOString();
  return data;
}
function setData(data){
  fields.forEach(id=>{if(qs(id)&&data[id]!==undefined)qs(id).value=data[id];});
  const radio=document.querySelector(`input[name="jobComplete"][value="${data.jobComplete||"no"}"]`); if(radio)radio.checked=true;
  parts=Array.isArray(data.parts)&&data.parts.length?data.parts:[{partNumber:"",description:"",quantity:""}];
  photos=Array.isArray(data.photos)?data.photos:[];
  renderPhotoPreviews();
  renderPartsEditor(); updatePreview();
}
function loadSavedCurrent(){
  const saved=localStorage.getItem(storageKey);
  if(saved){try{setData(JSON.parse(saved));return;}catch{localStorage.removeItem(storageKey);}}
  qs("jobDate").value=today; parts=[{partNumber:"",description:"",quantity:""}]; renderPartsEditor(); updatePreview();
}

function updatePreview(){
  const data=getData();
  document.querySelectorAll("[data-preview]").forEach(el=>{
    const key=el.getAttribute("data-preview");
    if(key==="companyName" && clean(data[key])==="-"){el.textContent="Your Workshop Name";return;}
    el.textContent=key==="jobDate"?formatDate(data[key]):clean(data[key]);
  });
  const status=qs("previewStatus");
  if(data.jobComplete==="yes"){status.textContent="COMPLETE";status.classList.add("complete");}else{status.textContent="IN PROGRESS";status.classList.remove("complete");}
  renderPartsPreview();
  renderPhotoPreviews();
  loadSettingsIntoPreview();
  localStorage.setItem(storageKey,JSON.stringify(data));
  qs("saveStatus").textContent="Saved locally";
}

function renderPartsEditor(){
  const list=qs("partsList"); list.innerHTML="";
  parts.forEach((part,index)=>{
    const div=document.createElement("div"); div.className="part-card";
    div.innerHTML=`
      <div class="part-card-top">
        <div class="part-card-title">Part ${index+1}</div>
        <button class="btn danger small" type="button" data-delete-part="${index}">Delete</button>
      </div>
      <div class="part-card-grid">
        <label><span>Part Number</span><input type="text" value="${escapeHtml(part.partNumber)}" data-part-field="partNumber" data-part-index="${index}" placeholder="e.g. 123456" /></label>
        <label><span>Description</span><input type="text" value="${escapeHtml(part.description)}" data-part-field="description" data-part-index="${index}" placeholder="Part description" /></label>
        <label><span>Qty</span><input type="text" inputmode="numeric" value="${escapeHtml(part.quantity)}" data-part-field="quantity" data-part-index="${index}" placeholder="1" /></label>
      </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll("[data-part-field]").forEach(input=>input.addEventListener("input",e=>{const i=+e.target.dataset.partIndex;parts[i][e.target.dataset.partField]=e.target.value;updatePreview();}));
  list.querySelectorAll("[data-delete-part]").forEach(btn=>btn.addEventListener("click",e=>{parts.splice(+e.target.dataset.deletePart,1);if(!parts.length)parts.push({partNumber:"",description:"",quantity:""});renderPartsEditor();updatePreview();}));
  }
function renderPartsPreview(){
  const usable=parts.filter(p=>clean(p.partNumber)!=="-"||clean(p.description)!=="-"||clean(p.quantity)!=="-");
  if(!usable.length){qs("partsPreview").innerHTML='<div class="parts-empty">-</div>';return;}
  const rows = usable.map(p=>`
    <tr>
      <td>${escapeHtml(clean(p.partNumber))}</td>
      <td>${escapeHtml(clean(p.description))}</td>
      <td class="qty-cell">${escapeHtml(clean(p.quantity))}</td>
    </tr>
  `).join("");
  qs("partsPreview").innerHTML=`
    <table>
      <thead>
        <tr>
          <th>Part Number</th>
          <th>Part Description</th>
          <th class="qty-cell">Qty Used</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
function addPart(){parts.push({partNumber:"",description:"",quantity:""});renderPartsEditor();updatePreview();}

function getSavedJobs(){try{return JSON.parse(localStorage.getItem(jobsKey))||[];}catch{return[];}}
function setSavedJobs(jobs){localStorage.setItem(jobsKey,JSON.stringify(jobs));renderSavedJobs();}
function saveJob(){
  const data=getData(); const jobs=getSavedJobs();
  const existing=jobs.findIndex(j=>j.jobNumber && j.jobNumber===data.jobNumber);
  const record={...data,id:existing>=0?jobs[existing].id:makeId(),savedAt:new Date().toISOString()};
  if(existing>=0)jobs[existing]=record; else jobs.unshift(record);
  setSavedJobs(jobs); qs("saveStatus").textContent="Job saved";
}
function renderSavedJobs(){
  const list=qs("savedJobsList"), jobs=getSavedJobs(); list.innerHTML="";
  if(!jobs.length){list.innerHTML='<p class="helper">No saved jobs yet.</p>';return;}
  jobs.forEach(j=>{
    const row=document.createElement("div"); row.className="saved-item";
    row.innerHTML=`<div><strong>${escapeHtml(clean(j.jobNumber))} — ${escapeHtml(clean(j.customerName))}</strong><span>${formatDate(j.jobDate)} · ${escapeHtml(clean(j.machine))}</span></div><button class="btn small" data-load-job="${j.id}">Load</button><button class="btn danger small" data-delete-job="${j.id}">Delete</button>`;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-load-job]").forEach(b=>b.onclick=()=>{const job=getSavedJobs().find(j=>j.id===b.dataset.loadJob);if(job)setData(job);});
  list.querySelectorAll("[data-delete-job]").forEach(b=>b.onclick=()=>setSavedJobs(getSavedJobs().filter(j=>j.id!==b.dataset.deleteJob)));
}

function getCustomers(){try{return JSON.parse(localStorage.getItem(customersKey))||[];}catch{return[];}}
function setCustomers(c){localStorage.setItem(customersKey,JSON.stringify(c));renderCustomers();}
function saveCustomer(){
  const c={id:makeId(),customerName:qs("customerName").value,contactDetails:qs("contactDetails").value,address:qs("address").value,machine:qs("machine").value,serialNumber:qs("serialNumber").value};
  if(clean(c.customerName)==="-"){alert("Enter a customer name first.");return;}
  const customers=getCustomers().filter(x=>x.customerName!==c.customerName); customers.unshift(c); setCustomers(customers);
}
function renderCustomers(){
  const list=qs("customerList"), customers=getCustomers(); list.innerHTML="";
  if(!customers.length){list.innerHTML='<p class="helper">No customers saved yet.</p>';return;}
  customers.forEach(c=>{
    const row=document.createElement("div"); row.className="saved-item";
    row.innerHTML=`<div><strong>${escapeHtml(clean(c.customerName))}</strong><span>${escapeHtml(clean(c.contactDetails))}</span></div><button class="btn small" data-load-customer="${c.id}">Use</button><button class="btn danger small" data-delete-customer="${c.id}">Delete</button>`;
    list.appendChild(row);
  });
  list.querySelectorAll("[data-load-customer]").forEach(b=>b.onclick=()=>{const c=getCustomers().find(x=>x.id===b.dataset.loadCustomer);if(c){["customerName","contactDetails","address","machine","serialNumber"].forEach(id=>qs(id).value=c[id]||"");updatePreview();}});
  list.querySelectorAll("[data-delete-customer]").forEach(b=>b.onclick=()=>setCustomers(getCustomers().filter(c=>c.id!==b.dataset.deleteCustomer)));
}




function getSettings(){
  try{
    return JSON.parse(localStorage.getItem(settingsKey)) || {};
  }catch{return {};}
}

function saveSettings(){
  const settings = {
    workshopPhone: qs("workshopPhone").value,
    workshopEmail: qs("workshopEmail").value,
    footerText: qs("footerText").value,
    logo: localStorage.getItem("southworx-logo-v6") || ""
  };
  localStorage.setItem(settingsKey, JSON.stringify(settings));
  loadSettingsIntoPreview();
  qs("settingsModal").classList.add("hidden");
}

function loadSettingsIntoFields(){
  const s = getSettings();
  qs("workshopPhone").value = s.workshopPhone || "";
  qs("workshopEmail").value = s.workshopEmail || "";
  qs("footerText").value = s.footerText || "";
}

function loadSettingsIntoPreview(){
  const s = getSettings();
  if(qs("previewWorkshopPhone")) qs("previewWorkshopPhone").textContent = s.workshopPhone || "-";
  if(qs("previewWorkshopEmail")) qs("previewWorkshopEmail").textContent = s.workshopEmail || "-";
  const footer = document.querySelector(".footer-note");
  if(footer) footer.textContent = s.footerText || "Created with SouthWorx Workshop Job Card Generator";

  const logo = qs("previewLogo");
  if(s.logo){
    logo.src = s.logo;
    logo.classList.remove("hidden");
  }else{
    logo.classList.add("hidden");
  }
}

function handleLogoUpload(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    localStorage.setItem("southworx-logo-v6", reader.result);
    const settings = getSettings();
    settings.logo = reader.result;
    localStorage.setItem(settingsKey, JSON.stringify(settings));
    loadSettingsIntoPreview();
  };
  reader.readAsDataURL(file);
}

function handlePhotoUpload(files){
  const selected = Array.from(files).slice(0,3);
  photos = [];
  if(!selected.length){
    renderPhotoPreviews();
    return;
  }

  let loaded = 0;
  selected.forEach(file=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      photos.push(reader.result);
      loaded++;
      if(loaded === selected.length){
        renderPhotoPreviews();
        updatePreview();
      }
    };
    reader.readAsDataURL(file);
  });
}

function renderPhotoPreviews(){
  const inline = qs("inlinePhotoPreview");
  const preview = qs("previewPhotos");

  if(!inline || !preview) return;

  if(!photos.length){
    inline.innerHTML = '<p class="helper">No photos added.</p>';
    preview.innerHTML = '<div class="parts-empty">-</div>';
    return;
  }

  const imgs = photos.map(p=>`<img src="${p}" />`).join("");
  inline.innerHTML = imgs;
  preview.innerHTML = imgs;
}


function clearForm(){
  fields.forEach(id=>qs(id).value=""); qs("jobDate").value=today; document.querySelector('input[name="jobComplete"][value="no"]').checked=true;
  parts=[{partNumber:"",description:"",quantity:""}]; renderPartsEditor(); updatePreview();
}
function loadSample(){
  setData({companyName:"SouthWorx Workshop Services",jobNumber:"J-000124",jobDate:today,engineer:"J. Smith",labourHours:"3.5",machineHours:"4,280",jobComplete:"yes",customerName:"Greenfield Farm",contactDetails:"office@example.co.uk / 01234 567890",address:"Greenfield Farm\nWinchester Road\nHampshire",machine:"Massey Ferguson Large Square Baler",serialNumber:"MF2270-123456",faultReported:"Customer reported inconsistent knotter performance and intermittent missed bales during operation.",workCarriedOut:"Inspected knotter assembly, checked twine path, adjusted tension settings, cleaned debris from knotter area and carried out operational test.",parts:[{partNumber:"TW-2451",description:"Twine disc",quantity:"2"},{partNumber:"SP-1098",description:"Knotter spring",quantity:"1"},{partNumber:"CONS",description:"Workshop consumables",quantity:"1"}],notes:"Machine tested after adjustment. Customer advised to monitor knotter performance during next working session."});
}

function makePartsEmailTable(usableParts){
  if(!usableParts.length) return "-";
  const headers = ["Part Number", "Part Description", "Quantity Used"];
  const rows = usableParts.map(p => [clean(p.partNumber), clean(p.description), clean(p.quantity)]);
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map(r => r[i].length)) + 4);
  const formatRow = row => row.map((cell, i) => String(cell).padEnd(widths[i], " ")).join("");
  return [formatRow(headers), formatRow(widths.map(w => "-".repeat(Math.max(3, w - 4)))), ...rows.map(formatRow)].join("\n");
}

function sendEmail(){
  const d=getData(); const usable=parts.filter(p=>clean(p.partNumber)!=="-"||clean(p.description)!=="-"||clean(p.quantity)!=="-");
  const partsText=makePartsEmailTable(usable);
  const settings = getSettings();
  const subject=`Workshop Job Card ${clean(d.jobNumber)} - ${clean(d.customerName)}`;
  const body=["Workshop Job Card","",
`Workshop Phone: ${settings.workshopPhone || "-"}`,
`Workshop Email: ${settings.workshopEmail || "-"}`,"",`Status: ${d.jobComplete==="yes"?"Complete":"In Progress"}`,`Company: ${clean(d.companyName)}`,`Job Number: ${clean(d.jobNumber)}`,`Date: ${formatDate(d.jobDate)}`,`Engineer: ${clean(d.engineer)}`,`Labour Hours: ${clean(d.labourHours)}`,"",`Customer: ${clean(d.customerName)}`,`Contact: ${clean(d.contactDetails)}`,`Address: ${clean(d.address)}`,"",`Machine: ${clean(d.machine)}`,`Serial Number: ${clean(d.serialNumber)}`,`Machine Hours: ${clean(d.machineHours)}`,"","Fault Reported:",clean(d.faultReported),"","Work Carried Out:",clean(d.workCarriedOut),"","Parts Used:",partsText,"","Additional Notes:",clean(d.notes),"","Note: To send a PDF copy, use Print / Save PDF first and attach the saved PDF manually."].join("\n");
  window.location.href=`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

qs("unlockBtn").onclick=unlockApp; qs("accessCode").onkeydown=e=>{if(e.key==="Enter")unlockApp();};
fields.forEach(id=>qs(id).addEventListener("input",updatePreview));
document.querySelectorAll('input[name="jobComplete"]').forEach(r=>r.addEventListener("change",updatePreview));
qs("addPartBtn").onclick=addPart; qs("printBtn").onclick=()=>window.print(); qs("emailBtn").onclick=sendEmail; qs("sampleBtn").onclick=loadSample; qs("clearBtn").onclick=clearForm;
qs("saveJobBtn").onclick=saveJob; qs("saveCustomerBtn").onclick=saveCustomer;
qs("jobDate").value=today; checkAccess(); loadSavedCurrent(); renderSavedJobs(); renderCustomers(); updatePreview();

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));}


qs("settingsBtn").onclick=()=>{
  loadSettingsIntoFields();
  qs("settingsModal").classList.remove("hidden");
};

qs("closeSettingsBtn").onclick=()=>qs("settingsModal").classList.add("hidden");
qs("saveSettingsBtn").onclick=saveSettings;

qs("logoUpload").onchange=e=>{
  if(e.target.files[0]) handleLogoUpload(e.target.files[0]);
};

qs("managePhotosBtn").onclick=()=>qs("photoModal").classList.remove("hidden");
qs("closePhotoBtn").onclick=()=>qs("photoModal").classList.add("hidden");

qs("photoUpload").onchange=e=>{
  handlePhotoUpload(e.target.files);
};

loadSettingsIntoPreview();
