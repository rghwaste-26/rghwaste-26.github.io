const PRODUCTS = ["20-yard roll-off","30-yard roll-off","Grapple / tight-access dumpster","Compactor","Portable toilets","Bulk / grapple truck","Recycling","Event / community service"];
const $ = function(id){ return document.getElementById(id); };
const store = {
  get: function(k, f){ try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? f : v; } catch(e){ return f; } },
  set: function(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};
function leads(){ return store.get("expoLeads", []); }
function emails(){ return store.get("expoEmails", []); }
function esc(s){ return String(s || "").replace(/&/g,"&").replace(/</g,"<").replace(/>/g,">"); }
function toast(m){ var t = $("toast"); t.textContent = m; t.className = "toast show"; setTimeout(function(){ t.className = "toast"; }, 2200); }
function status(){
  var e = emails();
  $("sendStatus").textContent = e.length ? (e.length + " emails stored on this iPad") : "Save a lead and the email is stored on this iPad.";
}
function render(){
  var all = leads().slice().reverse();
  $("leadCount").textContent = all.length;
  if (!all.length) { $("previewList").innerHTML = "<div class=\"meta\">No leads yet.</div>"; return; }
  $("previewList").innerHTML = all.slice(0,5).map(function(l){
    return "<div class=\"lead\"><b>" + esc(l.firstName) + " " + esc(l.lastName) + "</b><div class=\"meta\">" + esc(l.company) + " \u00b7 " + esc(l.repName) + "</div></div>";
  }).join("");
}
function bindGroup(boxId, kind){
  var box = $(boxId);
  if (!box) return;
  box.querySelectorAll(".pick").forEach(function(btn){
    btn.addEventListener("click", function(){
      box.querySelectorAll(".pick").forEach(function(b){ b.classList.remove("on"); });
      btn.classList.add("on");
      if (kind === "followUp") $("followUp").value = btn.getAttribute("data-value");
      if (kind === "staff") $("staff").value = btn.getAttribute("data-value");
      if (kind === "rep") {
        $("repEmail").value = btn.getAttribute("data-value");
        $("repName").value = btn.getAttribute("data-name");
      }
    });
  });
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
bindGroup("followPicks", "followUp");
bindGroup("repPicks", "rep");
bindGroup("staffPicks", "staff");
function parseCard(text) {
  var raw = String(text || "").replace(/\r/g, "\n");
  var emailMatch = raw.match(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i);
  var email = emailMatch ? emailMatch[0] : "";
  var phoneMatch = raw.match(/(?:\+?1[\s.\-]?)?(?:\(?\d{3}\)?[\s.\-]?)?\d{3}[\s.\-]?\d{4}/);
  var phone = phoneMatch ? phoneMatch[0] : "";
  var lines = raw.split(/\n/).map(function(s){ return s.replace(/\s+/g," ").trim(); }).filter(Boolean);
  var junk = /^(email|phone|tel|fax|mobile|cell|www|http|https|qr)/i;
  var titleRe = /\b(ceo|cfo|coo|president|owner|founder|director|manager|vp|vice president|sales|estimator|superintendent|project manager|partner)\b/i;
  var coRe = /\b(llc|l\.l\.c|inc|corp|ltd|company|co\.|construction|builders|waste|services|group|homes|properties|management)\b/i;
  var nameRe = /^[A-Za-z][A-Za-z.'\-]+(?:\s+[A-Za-z][A-Za-z.'\-]+){0,3}$/;
  var title = ""; var company = ""; var name = "";
  lines.forEach(function(line){
    if (/@/.test(line) || /\d{3}[\s.\-]?\d{3}/.test(line) || junk.test(line)) return;
    if (!title && titleRe.test(line) && line.length < 60) title = line;
    else if (!company && coRe.test(line) && line.length < 70) company = line;
    else if (!name && nameRe.test(line) && line.split(" ").length >= 2 && line.split(" ").length <= 4 && line.length < 40) name = line;
  });
  if (!company && email && email.indexOf("@") > -1) {
    var dom = email.split("@")[1].split(".")[0];
    if (dom && !/gmail|yahoo|hotmail|outlook|icloud|aol|me/.test(dom)) {
      company = dom.replace(/[-_]/g, " ");
      company = company.charAt(0).toUpperCase() + company.slice(1);
    }
  }
  var first = ""; var last = "";
  if (name) { var parts = name.split(/\s+/); first = parts[0]; last = parts.slice(1).join(" "); }
  return { firstName: first, lastName: last, email: email, phone: phone, company: company, title: title, raw: raw };
}
function shrinkImage(file, done) {
  var img = new Image();
  var url = URL.createObjectURL(file);
  img.onload = function() {
    var max = 1400; var w = img.width; var h = img.height;
    if (w > max || h > max) { var s = Math.min(max / w, max / h); w = Math.round(w * s); h = Math.round(h * s); }
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);
    c.toBlob(function(blob){ done(blob || file); }, "image/jpeg", 0.85);
  };
  img.onerror = function(){ URL.revokeObjectURL(url); done(file); };
  img.src = url;
}
function applyCard(parsed) {
  if (parsed.firstName) $("firstName").value = parsed.firstName;
  if (parsed.lastName) $("lastName").value = parsed.lastName;
  if (parsed.email) $("email").value = parsed.email;
  if (parsed.phone) $("phone").value = parsed.phone;
  if (parsed.company) $("company").value = parsed.company;
  if (parsed.title) $("title").value = parsed.title;
  if (!$("notes").value && parsed.raw) $("notes").value = "Card scan:\n" + parsed.raw;
  var filled = [];
  if (parsed.firstName) filled.push("name");
  if (parsed.email) filled.push("email");
  if (parsed.phone) filled.push("phone");
  if (parsed.company) filled.push("company");
  toast(filled.length ? ("Filled " + filled.join(", ") + ". Check and save.") : "Could not read the card. Type it in.");
}
if ($("scanBtn")) {
  $("scanBtn").addEventListener("click", function(){ $("cardCam").click(); });
  $("cardCam").addEventListener("change", function(){
    var file = this.files && this.files[0];
    this.value = "";
    if (!file) return;
    if (typeof Tesseract === "undefined") { toast("Card reader did not load. Check Wi-Fi and refresh."); return; }
    var thumb = $("cardThumb");
    thumb.src = URL.createObjectURL(file);
    thumb.style.display = "block";
    $("scanBtn").disabled = true;
    toast("Reading card... hold still, 5-15 seconds");
    shrinkImage(file, function(imgBlob){
      Tesseract.recognize(imgBlob, "eng", {
        logger: function(m){
          if (m.status === "recognizing text" && m.progress) {
            $("sendStatus").textContent = "Reading card... " + Math.round(m.progress * 100) + "%";
          }
        }
      }).then(function(result){
        var text = result && result.data ? result.data.text : "";
        applyCard(parseCard(text));
        status();
      }).catch(function(){
        toast("Could not read that photo. Try again in better light.");
      }).finally(function(){
        $("scanBtn").disabled = false;
      });
    });
  });
}
function mailBody(l){
  return ["Assigned to: " + l.repName + " <" + l.repEmail + ">","Name: " + l.firstName + " " + l.lastName,"Email: " + l.email,"Phone: " + (l.phone || ""),"Company: " + l.company,"Title: " + (l.title || ""),"Products: " + (l.interests || []).join(", "),"Temperature: " + l.heat,"Follow up: " + l.followUp,"Captured by: " + l.staff,"Captured at: " + l.capturedAt,"",l.notes || ""].join("\n");
}
$("leadForm").addEventListener("submit", function(e){
  e.preventDefault();
  var interests = [];
  document.querySelectorAll(".chip.on").forEach(function(x){ interests.push(x.getAttribute("data-value")); });
  if (!interests.length) { toast("Select at least one product"); return; }
  var lead = { id: Date.now().toString(36), firstName: $("firstName").value.trim(), lastName: $("lastName").value.trim(), email: $("email").value.trim(), phone: $("phone").value.trim(), company: $("company").value.trim(), title: $("title").value.trim(), interests: interests, heat: $("heat").value, followUp: $("followUp").value, staff: $("staff").value, repName: $("repName").value, repEmail: $("repEmail").value, notes: $("notes").value.trim(), capturedAt: new Date().toISOString() };
  store.set("expoLeads", leads().concat(lead));
  store.set("expoEmails", emails().concat({ id: "m-" + lead.id, to: lead.repEmail, cc: "robert@rghwaste.com", subject: "RGH Expo lead for " + lead.repName + ": " + lead.firstName + " " + lead.lastName + " - " + lead.company, body: mailBody(lead), repName: lead.repName, status: "stored", createdAt: lead.capturedAt }));
  $("leadForm").reset();
  $("heat").value = "Warm"; $("followUp").value = "Call with quote"; $("staff").value = "Keith"; $("repEmail").value = "keith@rghwaste.com"; $("repName").value = "Keith";
  if ($("cardThumb")) $("cardThumb").style.display = "none";
  document.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("on"); });
  document.querySelectorAll(".heat button").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-heat") === "Warm"); });
  document.querySelectorAll("#followPicks .pick").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-value") === "Call with quote"); });
  document.querySelectorAll("#repPicks .pick").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-name") === "Keith"); });
  document.querySelectorAll("#staffPicks .pick").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-value") === "Keith"); });
  render(); status(); toast("Saved locally in Email outbox");
});
$("resetBtn").addEventListener("click", function(){
  $("leadForm").reset();
  $("heat").value = "Warm"; $("followUp").value = "Call with quote"; $("staff").value = "Keith"; $("repEmail").value = "keith@rghwaste.com"; $("repName").value = "Keith";
  if ($("cardThumb")) $("cardThumb").style.display = "none";
  document.querySelectorAll(".chip").forEach(function(c){ c.classList.remove("on"); });
  document.querySelectorAll(".heat button").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-heat") === "Warm"); });
  document.querySelectorAll("#followPicks .pick").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-value") === "Call with quote"); });
  document.querySelectorAll("#repPicks .pick").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-name") === "Keith"); });
  document.querySelectorAll("#staffPicks .pick").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-value") === "Keith"); });
});
function openMail(m){
  location.href = "mailto:" + encodeURIComponent(m.to) + "?cc=" + encodeURIComponent(m.cc || "") + "&subject=" + encodeURIComponent(m.subject) + "&body=" + encodeURIComponent(m.body);
}
$("viewBtn").addEventListener("click", function(){
  var all = leads().slice().reverse();
  var html = "<h2>Saved leads</h2>";
  html += all.length ? all.map(function(l){ return "<div class=\"lead\"><b>" + esc(l.firstName) + " " + esc(l.lastName) + "</b><div class=\"meta\">" + esc(l.company) + " \u00b7 " + esc(l.email) + " \u00b7 " + esc(l.repName) + "</div></div>"; }).join("") : "<p>No leads yet.</p>";
  $("boxFull").innerHTML = html;
  $("boxDlg").showModal();
});
$("emailBoxBtn").addEventListener("click", function(){
  var all = emails().slice().reverse();
  var html = "<h2>Email outbox</h2>";
  html += all.length ? all.map(function(m){ return "<div class=\"lead\"><b>" + esc(m.subject) + "</b><div class=\"meta\">To " + esc(m.to) + " \u00b7 CC " + esc(m.cc) + "</div><button type=\"button\" class=\"ghost js-mail\" data-id=\"" + esc(m.id) + "\">Open in Mail</button></div>"; }).join("") : "<p>No emails yet.</p>";
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
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], title: "RGH expo leads" });
  else { var a = document.createElement("a"); a.href = URL.createObjectURL(file); a.download = "expo-leads.csv"; a.click(); }
});
render();
status();
