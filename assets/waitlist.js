"use strict";
// NITE Academy prelaunch waitlist: no Auth session, no passwords, no purchases.
// Public Supabase publishable key. The database function is idempotent and exposes no rows.
const ENDPOINT="https://succvbtctjkzsowotcsy.supabase.co/rest/v1/rpc/join_nite_academy_waitlist";
const PUBLISHABLE_KEY="sb_publishable_0TNBWdAUGNot0IxoyFDpEw_9bRDTOVu";
const allowedSources=new Set(["website","tiktok","youtube","instagram","other"]);
const params=new URLSearchParams(location.search);
const fromQuery=(params.get("source")||params.get("src")||"website").toLowerCase();
const source=allowedSources.has(fromQuery)?fromQuery:"other";
const form=document.getElementById("waitlist-form");
const emailInput=document.getElementById("waitlist-email");
const checkbox=document.getElementById("waitlist-consent");
const companyInput=document.getElementById("waitlist-company");
const button=document.getElementById("waitlist-submit");
const feedback=document.getElementById("waitlist-feedback");
const success=document.getElementById("waitlist-success");
let submitting=false;
form.addEventListener("submit",async event=>{
  event.preventDefault();
  if(submitting)return;
  const email=emailInput.value.trim().toLowerCase();
  if(!email||email.length>254||!emailInput.checkValidity()){
    feedback.textContent="Enter a valid email address to join.";
    emailInput.focus();
    return;
  }
  if(!checkbox.checked){
    feedback.textContent="Please agree to receive waitlist updates before joining.";
    checkbox.focus();
    return;
  }
  feedback.textContent="";
  submitting=true;
  button.disabled=true;
  button.textContent="Joining…";
  try{
    const response=await fetch(ENDPOINT,{
      method:"POST",
      headers:{"apikey":PUBLISHABLE_KEY,"Content-Type":"application/json","Accept":"application/json"},
      body:JSON.stringify({
        p_email:email,
        p_source:source,
        p_consent:true,
        p_company:companyInput.value
      })
    });
    if(!response.ok)throw new Error("Waitlist server unavailable");
    form.hidden=true;
    success.hidden=false;
    success.scrollIntoView({block:"nearest",behavior:"smooth"});
  }catch{
    feedback.textContent="We couldn't add you right now. Please try again, or email chayson@niterun.com.";
    button.disabled=false;
    button.textContent="Join the waitlist ↗";
  }finally{submitting=false;}
});
