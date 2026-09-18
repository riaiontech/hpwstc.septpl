/* IONTECH Catalog Admin */

const ADMIN_PASSWORD = "CHANGE-ME-1234";
let products = [];
let editingIndex = -1;

const $ = id => document.getElementById(id);

function source(){
  if(typeof PRODUCTS!=="undefined") return PRODUCTS;
  if(typeof productsData!=="undefined") return productsData;
  if(typeof products!=="undefined") return products;
  return [];
}

function settings(){
  return JSON.parse(localStorage.getItem("iontechSiteSettings")||"{}");
}

function normalizeProduct(p){
  return {
    ...p,
    sku:p.sku||p.SKU||p.productCode||"",
    model:p.model||p.Model||p.productName||p.name||"",
    category:p.category||p.Category||"",
    description:p.description||p.Description||"",
    features:p.features||p.Features||[],
    specs:p.specs||p.specifications||p.Specifications||p.components||[],
    image1:p.image1||p.image||p.Image1||"",
    image2:p.image2||p.Image2||p.image1||p.image||"",
    onhandPrice:p.onhandPrice||p.onHandPrice||p.dpWithVat||p.DPwithVAT||p.price||"",
    orderBasisPrice:p.orderBasisPrice||p.orderPrice||p.srp||p.SRP||"",
    seoTitle:p.seoTitle||"",
    seoDescription:p.seoDescription||"",
    seoOnhandTitle:p.seoOnhandTitle||"",
    seoOnhandDescription:p.seoOnhandDescription||"",
    seoOrderTitle:p.seoOrderTitle||"",
    seoOrderDescription:p.seoOrderDescription||""
  };
}

function asText(v){
  if(Array.isArray(v)) return v.map(x=>typeof x==="string"?x:(x.name?`${x.name}: ${x.value||""}`:JSON.stringify(x))).join("\n");
  if(v && typeof v==="object") return Object.entries(v).map(([k,val])=>`${k}: ${val}`).join("\n");
  return v||"";
}

function isLoggedIn(){return sessionStorage.getItem("iontechAdminLoggedIn")==="1"}

function showAdmin(){
  $("loginBox").classList.add("hidden-admin");
  $("adminPanel").classList.remove("hidden-admin");
  loadSiteForm();
  renderList();
}

function login(){
  if($("adminPassword").value===ADMIN_PASSWORD){
    sessionStorage.setItem("iontechAdminLoggedIn","1");
    showAdmin();
  }else{
    $("loginMessage").textContent="Incorrect password.";
    $("loginMessage").classList.remove("hidden-admin");
  }
}

function loadSiteForm(){
  const s=settings();
  const defaults={
    brandName:"IONTECH",
    brandTagline:"Professional Computing Solutions",
    heroEyebrow:"PROFESSIONAL COMPUTING",
    heroHeading:"Professional Workstations & Thin Clients",
    heroSubheading:"High-performance computing solutions designed for professional workloads.",
    priceListDate:"Updated as of September 16, 2026",
    catalogHeading:"Workstations & Thin Clients",
    catalogSubheading:"Browse our current product selection.",
    logo:"",
    heroImage:""
  };
  Object.entries({...defaults,...s}).forEach(([k,v])=>{if($(k))$(k).value=v||""});
}

function saveSite(){
  const keys=["brandName","brandTagline","heroEyebrow","heroHeading","heroSubheading","priceListDate","catalogHeading","catalogSubheading","logo","heroImage"];
  const s={};
  keys.forEach(k=>s[k]=$(k).value);
  localStorage.setItem("iontechSiteSettings",JSON.stringify(s));
  alert("Website settings saved on this browser.");
}

function resetSite(){
  if(confirm("Reset the website settings saved in this browser?")){
    localStorage.removeItem("iontechSiteSettings");
    loadSiteForm();
  }
}

function renderList(){
  const q=($("productSearch").value||"").toLowerCase();
  const list=products.map((p,i)=>({p,i})).filter(({p})=>
    !q || `${p.sku} ${p.model} ${p.category}`.toLowerCase().includes(q)
  );
  $("productList").innerHTML=list.map(({p,i})=>`
    <div class="admin-product">
      <img src="${p.image1||"./assets/logo-placeholder.svg"}" onerror="this.src='./assets/logo-placeholder.svg'">
      <div><b>${escapeHtml(p.sku||"No SKU")}</b><span>${escapeHtml(p.model||"")} · ${escapeHtml(p.category||"")}</span></div>
      <button class="admin-button" data-edit="${i}">Edit</button>
    </div>
  `).join("") || `<div class="admin-note">No matching products.</div>`;

  document.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editProduct(Number(b.dataset.edit))));
}

function escapeHtml(v){
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function editProduct(i){
  editingIndex=i;
  const p=products[i];
  $("productEditor").classList.remove("hidden-admin");
  $("pSku").value=p.sku||"";
  $("pModel").value=p.model||"";
  $("pCategory").value=p.category||"";
  $("pDescription").value=p.description||"";
  $("pFeatures").value=asText(p.features);
  $("pSpecs").value=asText(p.specs);
  $("pOnhand").value=p.onhandPrice||"";
  $("pOrder").value=p.orderBasisPrice||"";
  $("pImage1").value=p.image1||"";
  $("pImage2").value=p.image2||"";
  $("pSeoTitle").value=p.seoTitle||"";
  $("pSeoDescription").value=p.seoDescription||"";
  $("pSeoOnTitle").value=p.seoOnhandTitle||"";
  $("pSeoOrderTitle").value=p.seoOrderTitle||"";
  $("pSeoOnDescription").value=p.seoOnhandDescription||"";
  $("pSeoOrderDescription").value=p.seoOrderDescription||"";
  window.scrollTo({top:$("productEditor").offsetTop-20,behavior:"smooth"});
}

function parseFeatures(v){
  return String(v||"").split("\n").map(x=>x.trim()).filter(Boolean);
}

function parseSpecs(v){
  return String(v||"").split("\n").map(line=>{
    const i=line.indexOf(":");
    return {name:i>=0?line.slice(0,i).trim():"Specification",value:i>=0?line.slice(i+1).trim():line.trim()};
  }).filter(x=>x.name);
}

function saveProduct(){
  if(editingIndex<0)return;
  const old=products[editingIndex];
  products[editingIndex]={
    ...old,
    sku:$("pSku").value,
    model:$("pModel").value,
    category:$("pCategory").value,
    description:$("pDescription").value,
    features:parseFeatures($("pFeatures").value),
    specs:parseSpecs($("pSpecs").value),
    onhandPrice:$("pOnhand").value,
    orderBasisPrice:$("pOrder").value,
    image1:$("pImage1").value,
    image2:$("pImage2").value,
    seoTitle:$("pSeoTitle").value,
    seoDescription:$("pSeoDescription").value,
    seoOnhandTitle:$("pSeoOnTitle").value,
    seoOnhandDescription:$("pSeoOnDescription").value,
    seoOrderTitle:$("pSeoOrderTitle").value,
    seoOrderDescription:$("pSeoOrderDescription").value
  };

  /*
   * Static GitHub Pages cannot rewrite products.js from the browser.
   * Save the edited catalog locally so the current browser can display it.
   */
  localStorage.setItem("iontechProductOverrides",JSON.stringify(products));
  $("saveMessage").textContent="Product saved for this browser.";
  $("saveMessage").classList.remove("hidden-admin");
  renderList();
}

function cancelProduct(){
  editingIndex=-1;
  $("productEditor").classList.add("hidden-admin");
}

function init(){
  const saved=localStorage.getItem("iontechProductOverrides");
  let raw=source();
  if(saved){
    try{raw=JSON.parse(saved)}catch(e){}
  }
  products=raw.map(normalizeProduct);

  $("loginButton").addEventListener("click",login);
  $("adminPassword").addEventListener("keydown",e=>{if(e.key==="Enter")login()});
  $("logoutButton").addEventListener("click",()=>{
    sessionStorage.removeItem("iontechAdminLoggedIn");
    location.reload();
  });
  $("saveSite").addEventListener("click",saveSite);
  $("resetSite").addEventListener("click",resetSite);
  $("productSearch").addEventListener("input",renderList);
  $("saveProduct").addEventListener("click",saveProduct);
  $("cancelProduct").addEventListener("click",cancelProduct);

  if(isLoggedIn())showAdmin();
}

document.addEventListener("DOMContentLoaded",init);
