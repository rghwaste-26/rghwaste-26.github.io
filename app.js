const PRODUCTS = ["20-yard roll-off","30-yard roll-off","Grapple / tight-access dumpster","Compactor","Portable toilets","Bulk / grapple truck","Recycling","Event / community service"];
const $ = function(id){ return document.getElementById(id); };
const store = {
  get: function(k, f){ try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch(e){ return f; } },
  set: function(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};
function leads(){ return store.get("expoLeads", []); }
function emails(){ return store.get("expoEmails", []); }
function esc(s){ return String(s || "").replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">"); }
function toast(m){ var t = $("toast"); t.textContent = m; t.className = "toast show"; setTimeout(function(){ t.className = "toast"; }, 1800); }
function status(){
  var e = emails();
  $("sendStatus").textContent = e.length ? (e.length + " emails stored on this iPad") : "Save a lead and the email is stored on this iPad.";
}
function render(){
  var all = leads().slice().reverse();
  $("leadCount").textContent = all.length;
  if (!all.length) { $("previewList").innerHTML = "<div class=\"meta\">No leads yet.</div>"; return; }
  $("previewList").innerHTML = all.slice(0,5).map(function(l){
    return "<div class=\"lead\"><b>" + esc(l.firstName) + " " + esc(l.lastName) + "</b><div class=\"meta\">" + esc(l.company) + " · " + esc(l.repName) + "</div></div>";
  }).join("");
}
PRODUCTS.forEach(function(p){
  var b = document.createElement("button");
  b.type = "button"; b.className = "chip"; b.setAttribute("data-value", p); b.textContent = p;
  b.addEventListener("click", function(){ b.classList.toggle("on"); });
  $("interestChips").appendChild(b);
});
document.querySelectorAll(".heat button").forEach(function(btn){
  btn.addEventListener("click", function(){
    document.querySelectorAll(".heat button").forEach(function(b){ b.classList.remove("on"); });
    btn.classList.add("on");
    $("heat").value = btn.getAttribute("data-heat");
  });
});
function mailBody(l){
  return [
    "Assigned to: " + l.repName + " <" + l.repEmail + ">",
    "Name: " + l.firstName + " " + l.lastName,
    "Email: " + l.email,
    "Phone: " + (l.phone || ""),
    "Company: " + l.company,
    "Title: " + (l.title || ""),
    "Products: " + (l.interests || []).join(", "),
    "Temperature: " + l.heat,
    "Follow up: " + l.followUp,
    "Captured by: " + l.staff,
    "Captured at: " + l.capturedAt,
    "",
    l.notes || ""
  ].join("\n");
}
$("leadForm").addEventListener("submit", function(e){
  e.preventDefault();
  var interests = [];
  document.querySelectorAll(".chip.on").forEach(function(x){ interests.push(x.getAttribute("data-value")); });
  if (!interests.length) { toast("Select at least one product"); return; }
  var rep = $("rep");
  var opt = rep.options[rep.selectedIndex];
  var lead = {
    id: Date.now().toString(36),
    firstName: $("firstName").value.trim(),
    lastName: $("lastName").value.trim(),
    email: $("email").value.trim(),
    phone: $("phone").value.trim(),
    company: $("company").value.trim(),
    title: $("title").value.trim(),
    interests: interests,
    heat: $("heat").value,
    followUp: $("followUp").value,
    staff: $("staff").value,
    repName: opt.textContent.trim(),
    repEmail: rep.value,
    notes: $("notes").value.trim(),
    capturedAt: new Date().toISOString()
  };
  store.set("expoLeads", leads().concat(lead));
  store.set("expoEmails", emails().concat({
    id: "m-" + lead.id,
    to: lead.repEmail,
    cc: "robert@rghwaste.com",
    subject: "RGH Expo lead for " + lead.repName + ": " + lead.firstName + " " + lead.lastName + " - " + lead.company,
    body: mailBody(lead),
    repName: lead.repName,
    status: "stored",
    createdAt: lead.capturedAt
  }));
  $("leadForm").reset();
  $("heat").value = "Warm";
  document.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("on"); });
  document.querySelectorAll(".heat button").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-heat") === "Warm"); });
  render(); status(); toast("Saved locally in Email outbox");
});
$("resetBtn").addEventListener("click", function(){
  $("leadForm").reset();
  $("heat").value = "Warm";
  document.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("on"); });
  document.querySelectorAll(".heat button").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-heat") === "Warm"); });
});
function openMail(m){
  location.href = "mailto:" + encodeURIComponent(m.to) + "?cc=" + encodeURIComponent(m.cc || "") + "&subject=" + encodeURIComponent(m.subject) + "&body=" + encodeURIComponent(m.body);
}
$("viewBtn").addEventListener("click", function(){
  var all = leads().slice().reverse();
  var html = "<h2>Saved leads</h2>";
  html += all.length ? all.map(function(l){ return "<div class=\"lead\"><b>" + esc(l.firstName) + " " + esc(l.lastName) + "</b><div class=\"meta\">" + esc(l.company) + " · " + esc(l.email) + " · " + esc(l.repName) + "</div></div>"; }).join("") : "<p>No leads yet.</p>";
  $("boxFull").innerHTML = html;
  $("boxDlg").showModal();
});
$("emailBoxBtn").addEventListener("click", function(){
  var all = emails().slice().reverse();
  var html = "<h2>Email outbox</h2>";
  html += all.length ? all.map(function(m){ return "<div class=\"lead\"><b>" + esc(m.subject) + "</b><div class=\"meta\">To " + esc(m.to) + " · CC " + esc(m.cc) + "</div><button type=\"button\" class=\"ghost js-mail\" data-id=\"" + esc(m.id) + "\">Open in Mail</button></div>"; }).join("") : "<p>No emails yet.</p>";
  $("boxFull").innerHTML = html;
  $("boxFull").querySelectorAll(".js-mail").forEach(function(b){
    b.addEventListener("click", function(){
      var found = emails().filter(function(x){ return x.id === b.getAttribute("data-id"); })[0];
      if (found) openMail(found);
    });
  });
  $("boxDlg").showModal();
});
$("closeBox").addEventListener("click", function(){ $("boxDlg").close(); });
$("exportBtn").addEventListener("click", function(){
  var all = leads();
  if (!all.length) { toast("No leads to export"); return; }
  var headers = ["capturedAt","firstName","lastName","email","phone","company","title","interests","heat","followUp","staff","repName","repEmail","notes"];
  var csv = [headers.join(",")].concat(all.map(function(l){
    return headers.map(function(h){
      var v = h === "interests" ? (l.interests || []).join("; ") : (l[h] == null ? "" : l[h]);
      return '"' + String(v).replace(/"/g, '""') + '"';
    }).join(",");
  })).join("\n");
  var file = new File([csv], "expo-leads.csv", { type: "text/csv" });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: "RGH expo leads" });
  } else {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = "expo-leads.csv";
    a.click();
  }
});
render();
status();
