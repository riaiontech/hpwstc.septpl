/* IONTECH redesigned catalog */

let PRODUCTS_DATA = [];
let selectedCategory = "all";
let selectedModel = "all";
let currentProduct = null;

const $ = id => document.getElementById(id);

function sourceProducts(){
  if (typeof PRODUCTS !== "undefined") return PRODUCTS;
  if (typeof products !== "undefined") return products;
  if (typeof productData !== "undefined") return productData;
  return [];
}

function arr(v){
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return String(v).split(/\n|•|\|/).map(x=>x.trim()).filter(Boolean);
}

function specs(v){
  if (!v) return [];
  if (Array.isArray(v)) return v.map(x => {
    if (typeof x === "string") {
      const i=x.indexOf(":");
      return {name:i>=0?x.slice(0,i).trim():"Specification", value:i>=0?x.slice(i+1).trim():x};
    }
    return {name:x.name||x.label||x.key||"", value:x.value||x.spec||""};
  }).filter(x=>x.name);
  if (typeof v === "object") return Object.entries(v).map(([name,value])=>({name,value}));
  return String(v).split("\n").map(line=>{
    const i=line.indexOf(":");
    return {name:i>=0?line.slice(0,i).trim():"Specification",value:i>=0?line.slice(i+1).trim():line};
  }).filter(x=>x.name);
}

function normalize(p){
  return {
    raw:p,
    sku:p.sku||p.SKU||p.productCode||p.product_code||"",
    model:p.model||p.Model||p.productName||p.name||"",
    category:p.category||p.Category||"",
    description:p.description||p.Description||p.shortDescription||"",
    features:arr(p.features||p.Features||p.feature||p.highlights),
    specs:specs(p.specs||p.specifications||p.Specifications||p.components),
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

function cleanCategory(c){
  const s=String(c||"").toLowerCase();
  if(s.includes("thin")) return "Thin Clients";
  if(s.includes("mobile")) return "Mobile Workstations";
  if(s.includes("desktop")||s.includes("tower")) return "Desktop Workstations";
  return c||"";
}

/* Family labels keep navigation short and organized. */
function familyName(model, category){
  const m=String(model||"");
  const c=cleanCategory(category);
  if(c==="Mobile Workstations"){
    if(/zbook\s*8/i.test(m)) return "ZBook 8";
    if(/zbook\s*x/i.test(m)) return "ZBook X";
    if(/ultra/i.test(m)) return "ZBook Ultra";
  }
  if(c==="Desktop Workstations"){
    if(/z1\s*tower/i.test(m)) return "Z1 Tower";
    if(/z2\s*mini/i.test(m)) return "Z2 Mini";
    if(/z2\s*tower/i.test(m)) return "Z2 Tower";
    if(/z2\s*sff/i.test(m)) return "Z2 SFF";
  }
  if(c==="Thin Clients"){
    if(/t755/i.test(m)) return "Elite t755";
    if(/t660/i.test(m)) return "Elite t660";
    if(/t655/i.test(m)) return "Elite t655";
    if(/pd5|prodesk\s*5/i.test(m)) return "ProDesk 5";
  }
  return m;
}

function price(v){
  if(v===null||v===undefined||v==="") return "—";
  const s=String(v).trim();
  if(/[₱$€£]|^\s*\d[\d,]*\.\d{2}\s*$/.test(s)) return s;
  const n=Number(s.replace(/[^0-9.-]/g,""));
  if(Number.isFinite(n) && n!==0) return "₱"+n.toLocaleString("en-PH",{minimumFractionDigits:2,maximumFractionDigits:2});
  return s;
}

function escapeHtml(v){
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
}

function placeholder(){
  return "data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="100%" height="100%" fill="#f1f3f4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#777" font-family="Arial" font-size="24">Product image</text></svg>`
  );
}

function renderModels(){
  const area=$("modelArea"), buttons=$("modelButtons");
  if(selectedCategory==="all"){area.classList.add("hidden");buttons.innerHTML="";selectedModel="all";return;}

  const families=[...new Set(PRODUCTS_DATA
    .filter(p=>cleanCategory(p.category)===selectedCategory)
    .map(p=>familyName(p.model,p.category))
    .filter(Boolean))];

  area.classList.remove("hidden");
  $("modelLabel").textContent=selectedCategory;
  buttons.innerHTML=`<button class="model-tab ${selectedModel==="all"?"active":""}" data-model="all">All Models</button>`+
    families.map(f=>`<button class="model-tab ${selectedModel===f?"active":""}" data-model="${escapeHtml(f)}">${escapeHtml(f)}</button>`).join("");

  buttons.querySelectorAll(".model-tab").forEach(b=>b.addEventListener("click",()=>{
    selectedModel=b.dataset.model;
    renderModels();
    renderProducts();
  }));
}

function filteredProducts(){
  const q=($("searchInput").value||"").trim().toLowerCase();
  return PRODUCTS_DATA.filter(p=>{
    const categoryOK=selectedCategory==="all"||cleanCategory(p.category)===selectedCategory;
    const modelOK=selectedModel==="all"||familyName(p.model,p.category)===selectedModel;
    const hay=[p.sku,p.model,p.category,p.description,...p.features,...p.specs.map(s=>`${s.name} ${s.value}`)].join(" ").toLowerCase();
    return categoryOK && modelOK && (!q||hay.includes(q));
  });
}

function card(p,index){
  const img=p.image1||placeholder();
  return `<article class="product-card">
    <div class="product-image"><img src="${escapeHtml(img)}" alt="${escapeHtml(p.model||p.sku)}" loading="lazy" onerror="this.src='${placeholder()}'"></div>
    <div class="product-body">
      <div class="product-sku">${escapeHtml(p.sku||"SKU")}</div>
      <div class="product-model">${escapeHtml(p.model||"Product")}</div>
      <div class="product-description">${escapeHtml(p.description||"Professional computing solution.")}</div>
      <div class="price-row">
        <div class="card-price"><span>ON-HAND</span><strong>${escapeHtml(price(p.onhandPrice))}</strong></div>
        <div class="card-price"><span>ORDER BASIS</span><strong>${escapeHtml(price(p.orderBasisPrice))}</strong></div>
      </div>
      <button class="view-button" data-index="${index}">View Details →</button>
    </div>
  </article>`;
}

function renderProducts(){
  renderModels();
  const list=filteredProducts();
  $("productCount").textContent=list.length;
  const q=($("searchInput").value||"").trim();
  $("activeFilter").textContent=q?`Showing results for “${q}”`:selectedCategory==="all"?"":`${selectedCategory}${selectedModel!=="all"?" · "+selectedModel:""}`;

  const grid=$("productGrid"), empty=$("emptyState");
  if(!list.length){grid.innerHTML="";empty.classList.remove("hidden");return;}
  empty.classList.add("hidden");

  grid.innerHTML=list.map((p)=>{
    const original=PRODUCTS_DATA.indexOf(p);
    return card(p,original);
  }).join("");

  grid.querySelectorAll(".view-button").forEach(btn=>btn.addEventListener("click",()=>openProduct(Number(btn.dataset.index))));
}

function setSiteText(){
  const settings=JSON.parse(localStorage.getItem("iontechSiteSettings")||"{}");
  const set=(id,key)=>{if(settings[key]!==undefined && $(id)) $(id).textContent=settings[key]};
  set("brandName","brandName");set("brandTagline","brandTagline");
  set("heroEyebrow","heroEyebrow");set("heroHeading","heroHeading");set("heroSubheading","heroSubheading");
  set("catalogHeading","catalogHeading");set("catalogSubheading","catalogSubheading");
  set("priceListDate","priceListDate");set("footerBrand","brandName");set("footerText","brandTagline");

  if(settings.logo) $("companyLogo").src=settings.logo;
  if(settings.heroImage) $("heroImage").src=settings.heroImage;
}

function openProduct(index){
  currentProduct=PRODUCTS_DATA[index];
  if(!currentProduct)return;

  $("modalCategory").textContent=cleanCategory(currentProduct.category);
  $("modalSku").textContent=currentProduct.sku||"";
  $("modalModel").textContent=currentProduct.model||"";
  $("modalDescription").textContent=currentProduct.description||"";
  $("modalOnhandPrice").textContent=price(currentProduct.onhandPrice);
  $("modalOrderPrice").textContent=price(currentProduct.orderBasisPrice);

  const features=currentProduct.features||[];
  $("modalFeaturesSection").style.display=features.length?"block":"none";
  $("modalFeatures").innerHTML=features.map(f=>`<li>${escapeHtml(f)}</li>`).join("");

  const ss=currentProduct.specs||[];
  $("modalSpecs").innerHTML=ss.length
    ? ss.map(s=>`<div class="spec-row"><div class="spec-name">${escapeHtml(s.name)}</div><div class="spec-value">${escapeHtml(s.value)}</div></div>`).join("")
    : `<div class="spec-row"><div class="spec-name">Specifications</div><div class="spec-value">See product details or contact us.</div></div>`;

  const i1=currentProduct.image1||placeholder(), i2=currentProduct.image2||i1;
  $("modalImage1").src=i1;$("modalThumb1").src=i1;$("modalThumb2").src=i2;
  $("modalImage1").alt=currentProduct.model||currentProduct.sku;
  $("modalThumb1").parentElement.onclick=()=>setMainImage(i1);
  $("modalThumb2").parentElement.onclick=()=>setMainImage(i2);

  $("productModal").classList.add("open");
  $("productModal").setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";

  if(currentProduct.seoTitle) document.title=currentProduct.seoTitle;
  if(currentProduct.seoDescription){
    let meta=document.querySelector('meta[name="description"]');
    if(meta)meta.content=currentProduct.seoDescription;
  }
}

function setMainImage(src){
  $("modalImage1").src=src;
  document.querySelectorAll(".thumb").forEach(x=>x.classList.remove("active"));
  if($("modalThumb1").src===src) $("modalThumb1").parentElement.classList.add("active");
  else $("modalThumb2").parentElement.classList.add("active");
}

function closeModal(){
  $("productModal").classList.remove("open");
  $("productModal").setAttribute("aria-hidden","true");
  document.body.style.overflow="";
  document.title="Professional Workstations & Thin Clients | IONTECH";
}

function init(){
  PRODUCTS_DATA=sourceProducts().map(normalize);
  setSiteText();

  document.querySelectorAll(".category-tab").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".category-tab").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory=btn.dataset.category;
    selectedModel="all";
    renderProducts();
  }));

  $("searchInput").addEventListener("input",renderProducts);
  $("modalClose").addEventListener("click",closeModal);
  document.querySelector("[data-close-modal]").addEventListener("click",closeModal);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});

  renderProducts();
}

document.addEventListener("DOMContentLoaded",init);
