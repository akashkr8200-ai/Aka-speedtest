const $ = (id) => document.getElementById(id);
const CIRC = 679;
let testing = false;

function setRing(percent){
  const p = Math.max(0, Math.min(percent, 1));
  $("ring").style.strokeDashoffset = CIRC * (1 - p);
}
function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
function fmt(n){ return Number.isFinite(n) ? n.toFixed(2) : "--"; }

async function getInfo(){
  try{
    const r = await fetch("/api/info", {cache:"no-store"});
    const d = await r.json();
    $("ip").textContent = d.ip || "Unavailable";
    $("location").textContent = [d.city,d.country].filter(Boolean).join(", ") || "Unavailable";
    $("isp").textContent = d.network || "Connected";
  }catch{
    $("ip").textContent = "Unavailable";
    $("location").textContent = "Unavailable";
    $("isp").textContent = navigator.connection?.effectiveType || "Connected";
  }
}

async function pingTest(){
  const samples = [];
  for(let i=0;i<6;i++){
    const t = performance.now();
    try { await fetch(`/api/ping?t=${Date.now()}${i}`, {cache:"no-store"}); } catch(e) {}
    samples.push(performance.now()-t);
    await wait(100);
  }
  samples.shift(); // warmup
  const avg = samples.reduce((a,b)=>a+b,0)/samples.length;
  const jitter = samples.slice(1).reduce((a,v,i)=>a+Math.abs(v-samples[i]),0)/(samples.length-1);
  return {ping:Math.round(avg), jitter:Math.round(jitter)};
}

async function downloadTest(){
  const duration = 8000, start = performance.now();
  let total = 0;
  const controllers = new Set();
  const update = () => {
    const sec=(performance.now()-start)/1000;
    const mbps=(total*8/1e6)/Math.max(sec,.2);
    $("speed").textContent=fmt(mbps); setRing(Math.min(mbps/500,1));
  };
  const timer = setInterval(update,180);

  async function stream(){
    while(performance.now()-start<duration){
      const c=new AbortController(); controllers.add(c);
      try{
        const r=await fetch(`/api/download?bytes=25000000&x=${Math.random()}`,{signal:c.signal,cache:"no-store"});
        if(!r.ok || !r.body) break;
        const reader=r.body.getReader();
        while(performance.now()-start<duration){
          const {done,value}=await reader.read();
          if(done) break;
          total += value.byteLength;
        }
        c.abort();
      }catch(e){} finally{controllers.delete(c)}
    }
  }
  await Promise.all([stream(),stream(),stream(),stream()]);
  clearInterval(timer);
  controllers.forEach(c=>c.abort());
  const sec=(performance.now()-start)/1000;
  return (total*8/1e6)/Math.max(sec,.2);
}

async function uploadTest(){
  const duration=6000, chunkSize=2*1024*1024;
  const data=new Uint8Array(chunkSize); crypto.getRandomValues(data);
  const start=performance.now(); let total=0;
  while(performance.now()-start<duration){
    const c=new AbortController();
    const kill=setTimeout(()=>c.abort(), Math.max(1000,duration-(performance.now()-start)+500));
    try{
      const r=await fetch("/api/upload",{method:"POST",body:data,signal:c.signal,headers:{"content-type":"application/octet-stream"}});
      if(!r.ok) break;
      total += chunkSize;
      const sec=(performance.now()-start)/1000, mbps=(total*8/1e6)/Math.max(sec,.2);
      $("speed").textContent=fmt(mbps); setRing(Math.min(mbps/500,1));
    }catch(e){} finally{clearTimeout(kill)}
  }
  const sec=(performance.now()-start)/1000;
  return (total*8/1e6)/Math.max(sec,.2);
}

function history(){
  return JSON.parse(localStorage.getItem("akaHistory") || "[]");
}
function renderHistory(){
  const h=history(), box=$("historyList");
  if(!h.length){box.innerHTML="<p>No completed tests yet.</p>";return}
  box.innerHTML=h.map(x=>`<div class="history-row"><span>${x.time}</span><span>↓ <b>${x.down} Mbps</b></span><span>↑ <b>${x.up} Mbps</b></span><span>Ping <b>${x.ping} ms</b></span></div>`).join("");
}
function saveResult(down,up,ping){
  const h=history(); h.unshift({down:down.toFixed(2),up:up.toFixed(2),ping,time:new Date().toLocaleString()});
  localStorage.setItem("akaHistory",JSON.stringify(h.slice(0,10))); renderHistory();
}

async function start(){
  if(testing)return; testing=true;
  $("goBtn").disabled=true;$("status").textContent="TESTING";$("download").textContent="--";$("upload").textContent="--";
  $("live-speed").classList.add("show");

  $("phase").textContent="PING";$("phaseSub").textContent="MEASURING LATENCY";$("speed").textContent="0.00";setRing(.08);
  const lat=await pingTest(); $("ping").textContent=lat.ping;$("jitter").textContent=lat.jitter;

  $("phase").textContent="DOWN";$("phaseSub").textContent="TESTING DOWNLOAD";setRing(0);$("speed").textContent="0.00";
  const down=await downloadTest(); $("download").textContent=fmt(down);

  $("phase").textContent="UP";$("phaseSub").textContent="TESTING UPLOAD";setRing(0);$("speed").textContent="0.00";
  const up=await uploadTest(); $("upload").textContent=fmt(up);

  $("phase").textContent="DONE";$("phaseSub").textContent="TEST COMPLETE";$("speed").textContent=fmt(down);setRing(Math.min(down/500,1));
  $("status").textContent="COMPLETE"; saveResult(down,up,lat.ping);
  $("goBtn").disabled=false;testing=false;
}
$("goBtn").addEventListener("click",start);
$("clearHistory").addEventListener("click",()=>{localStorage.removeItem("akaHistory");renderHistory()});
$("year").textContent=new Date().getFullYear();
getInfo();renderHistory();
