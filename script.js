(() => {
  const $ = (id) => document.getElementById(id);
  const promptBox = $("prompt"), sendBtn = $("sendBtn"), messagesEl = $("messages");
  let history = [], busy = false, dark = true;
  const toast = (message) => { const el=$("toast"); el.textContent=message; el.style.display="block"; clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.style.display="none",2600); };
  function addMessage(role, text, typing=false) {
    const row=document.createElement("div"); row.className=`message ${role}`;
    const avatar=document.createElement("div"); avatar.className="avatar"; avatar.textContent=role==="user"?"Y":"✦";
    const wrap=document.createElement("div"); wrap.style.minWidth="0"; wrap.style.flex="1";
    const bubble=document.createElement("div"); bubble.className="bubble"+(typing?" typing":""); bubble.textContent=text;
    wrap.appendChild(bubble);
    if(role==="assistant"&&!typing){const actions=document.createElement("div");actions.className="msg-actions";const copy=document.createElement("button");copy.className="tinybtn";copy.textContent="Copiar resposta";copy.onclick=async()=>{try{await navigator.clipboard.writeText(text);toast("Resposta copiada!")}catch{toast("Não foi possível copiar neste navegador.")}};actions.appendChild(copy);wrap.appendChild(actions);}
    row.append(avatar,wrap); messagesEl.appendChild(row); row.scrollIntoView({behavior:"smooth",block:"end"}); return {row,bubble};
  }
  function setBusy(value){busy=value;sendBtn.disabled=value;sendBtn.textContent=value?"Pensando…":"Enviar ↗";}
  function reset(){history=[];messagesEl.replaceChildren();$("welcome").classList.remove("hidden");$("suggestions").classList.remove("hidden");promptBox.value="";promptBox.focus();}
  async function send(textOverride) {
    const text=(textOverride ?? promptBox.value).trim(); if(!text||busy)return;
    $("welcome").classList.add("hidden");$("suggestions").classList.add("hidden");
    promptBox.value=""; promptBox.style.height="auto"; addMessage("user",text); history.push({role:"user",content:text});
    setBusy(true); const loading=addMessage("assistant","A YOX YOSA AI está pensando",true);
    try{
      const response=await fetch("/.netlify/functions/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error(data.error||`Erro no servidor (${response.status}).`);
      if(typeof data.reply!=="string"||!data.reply.trim())throw new Error("A IA retornou uma resposta vazia. Tente novamente.");
      loading.row.remove(); addMessage("assistant",data.reply); history.push({role:"assistant",content:data.reply});
    }catch(err){loading.row.remove();const msg=err.message||"Não foi possível conectar à IA.";addMessage("assistant",`Não consegui responder: ${msg}\n\nConfira se OPENROUTER_API_KEY está configurada nas variáveis de ambiente do Netlify e se a função foi publicada.`);history.pop();toast("Falha ao conectar com a IA.");}
    finally{setBusy(false);promptBox.focus();}
  }
  sendBtn.addEventListener("click",()=>send());
  promptBox.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}});
  promptBox.addEventListener("input",()=>{promptBox.style.height="auto";promptBox.style.height=Math.min(promptBox.scrollHeight,180)+"px";});
  document.querySelectorAll("[data-prompt]").forEach(btn=>btn.addEventListener("click",()=>send(btn.dataset.prompt)));
  $("newChat").addEventListener("click",reset); $("clearBtn").addEventListener("click",reset); $("historyBtn").addEventListener("click",()=>{messagesEl.lastElementChild?.scrollIntoView({behavior:"smooth",block:"end"});if(!messagesEl.children.length)toast("Esta conversa ainda está vazia.");});
  $("exportBtn").addEventListener("click",()=>{if(!history.length){toast("Não há mensagens para exportar.");return;}const content=history.map(m=>`${m.role==="user"?"Você":"YOX YOSA AI"}:\n${m.content}`).join("\n\n---\n\n");const blob=new Blob([content],{type:"text/plain;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="yox-yosa-conversa.txt";a.click();URL.revokeObjectURL(url);});
  $("themeBtn").addEventListener("click",()=>{dark=!dark;document.body.style.filter=dark?"none":"brightness(1.22) saturate(.7)";toast(dark?"Aparência padrão":"Aparência clara simulada");});
})();