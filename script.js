const API = "/api";
const config = window.CAPACITY_CONNECT_CONFIG || {};
const supabaseClient = window.supabase && config.supabaseUrl && !config.supabaseUrl.includes("YOUR_")
  ? window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey)
  : null;
let authenticatedUser = null;
let authenticatedProfile = null;
let selectedLoginRole = "student";

const routeForRole = {student:"/student-dashboard", trainer:"/trainer-dashboard", admin:"/admin-dashboard"};

function showAuthForm(name){
  document.querySelectorAll(".auth-form").forEach(form=>form.classList.toggle("hidden", form.id !== name));
  document.getElementById("authNotice").textContent = "";
}

function authMessage(message, type="error"){
  const notice=document.getElementById("authNotice");
  notice.textContent=message;
  notice.className=`auth-notice ${type}`;
}

function setLoading(form, loading){
  const button=form.querySelector(".auth-submit");
  button.disabled=loading;
  button.textContent=loading?"Please wait…":(form.id==="loginForm"?"Sign in":form.id==="signupForm"?"Create account":"Send recovery link");
}

async function loadProfile(user){
  const {data, error}=await supabaseClient.from("profiles").select("id,full_name,email,role,approval_status,avatar_url").eq("id",user.id).single();
  if(error || !data) throw new Error("Your account profile could not be loaded. Run auth_schema.sql in Supabase.");
  authenticatedProfile=data;
  return data;
}

function redirectForProfile(profile){
  if(profile.role==="trainer" && profile.approval_status!=="approved"){
    showLogin(`Trainer account status: ${profile.approval_status}. An administrator must approve this account before dashboard access.`);
    return;
  }
  const expected=Object.entries(routeForRole).find(([,path])=>location.pathname===path)?.[0];
  if(expected && expected!==profile.role){
    authMessage(`This account is not registered as a ${expected}. Redirecting to your dashboard.`);
    history.replaceState({},"",routeForRole[profile.role]);
  } else if(location.pathname==="/login" || location.pathname==="/signup" || location.pathname==="/reset-password" || location.pathname==="/"){
    history.replaceState({},"",routeForRole[profile.role]);
  }
  document.getElementById("authShell").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");
  document.getElementById("userGreeting").textContent=`${profile.full_name || profile.email} · ${profile.role}`;
  document.body.dataset.role=profile.role;
  showRoleDashboard(profile.role);
  const workspace=document.getElementById("roleWorkspace");
  const workspaceCopy={
    student:["Student workspace","Skill Gap Analyzer, personalized learning paths, projects, assessments, certifications and opportunity matching.","Continue learning"],
    trainer:["Trainer workspace","Manage assigned learning content, practical assessments, trainee participation, feedback and your Trainer Quality Score.","Open trainer tools"],
    admin:["Admin workspace","Platform overview, user approvals, course governance, assessment oversight, certifications and analytics.","Open administration"]
  }[profile.role];
  workspace.innerHTML=`<div><p class="eyebrow">${profile.role.toUpperCase()} DASHBOARD</p><h2>Welcome, ${profile.full_name || profile.email}</h2><p class="muted">${workspaceCopy[1]}</p></div><button class="secondary" onclick="scrollToId('dashboard')">${workspaceCopy[2]}</button>`;
}

function showLogin(message=""){
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("authShell").classList.remove("hidden");
  document.getElementById("trainerDashboard").classList.add("hidden");
  document.getElementById("adminDashboard").classList.add("hidden");
  showAuthForm("loginForm");
  if(message) authMessage(message);
}

async function handleSession(session){
  if(!supabaseClient){
    showLogin("Add your Supabase URL and publishable key to supabase-config.js to enable authentication.");
    return;
  }
  if(!session){
    authenticatedUser=null; authenticatedProfile=null; showLogin(); return;
  }
  try{ authenticatedUser=session.user; redirectForProfile(await loadProfile(session.user)); }
  catch(error){ await supabaseClient.auth.signOut(); showLogin(error.message); }
}

function showRoleDashboard(role){
  document.getElementById("trainerDashboard").classList.toggle("hidden",role!=="trainer");
  document.getElementById("adminDashboard").classList.toggle("hidden",role!=="admin");
  document.querySelectorAll("main > section:not(#roleWorkspace):not(#trainerDashboard):not(#adminDashboard)").forEach(section=>section.classList.toggle("role-hidden",role!=="student"));
  if(role==="trainer") loadTrainerDashboard();
  if(role==="admin") loadAdminDashboard();
}

async function login(event){
  event.preventDefault(); const form=event.currentTarget; setLoading(form,true);
  const {error}=await supabaseClient.auth.signInWithPassword({email:loginEmail.value.trim(),password:loginPassword.value});
  setLoading(form,false);
  if(error){authMessage(error.message);return;}
  try{
    const {data:{user}}=await supabaseClient.auth.getUser();
    const profile=await loadProfile(user);
    if(profile.role!==selectedLoginRole){
      await supabaseClient.auth.signOut();
      authMessage(`This account is not registered as a ${selectedLoginRole}.`); return;
    }
    redirectForProfile(profile);
  }catch(error){await supabaseClient.auth.signOut();authMessage(error.message);}
}

async function signup(event){
  event.preventDefault(); const form=event.currentTarget; const password=signupPassword.value;
  if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)){authMessage("Password must be at least 8 characters and include uppercase, lowercase, and a number.");return;}
  if(password!==signupConfirm.value){authMessage("Passwords do not match.");return;}
  setLoading(form,true);
  const {data,error}=await supabaseClient.auth.signUp({email:signupEmail.value.trim(),password,options:{data:{full_name:signupName.value.trim(),role:signupRole.value}}});
  setLoading(form,false);
  if(error){authMessage(error.message);return;}
  if(data.session) redirectForProfile(await loadProfile(data.user));
  else {showLogin();authMessage(`Account created successfully. Check ${signupEmail.value.trim()} for the confirmation email, click its link, then sign in.`,"success");}
}

async function resetPassword(event){
  event.preventDefault(); const form=event.currentTarget; setLoading(form,true);
  const {error}=await supabaseClient.auth.resetPasswordForEmail(resetEmail.value.trim(),{redirectTo:`${location.origin}/reset-password`});
  setLoading(form,false);
  if(error){authMessage(error.message);return;}
  authMessage("Check your email for a secure password reset link.","success");
}

async function updatePassword(event){
  event.preventDefault(); const form=event.currentTarget;
  if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword.value)){authMessage("Password must be at least 8 characters and include uppercase, lowercase, and a number.");return;}
  if(newPassword.value!==newPasswordConfirm.value){authMessage("Passwords do not match.");return;}
  setLoading(form,true); const {error}=await supabaseClient.auth.updateUser({password:newPassword.value}); setLoading(form,false);
  if(error){authMessage(error.message);return;}
  await supabaseClient.auth.signOut(); showLogin("Password updated successfully. Please sign in.");
}

function wireAuth(){
  document.querySelectorAll("[data-login-role]").forEach(button=>button.addEventListener("click",()=>{
    selectedLoginRole=button.dataset.loginRole;
    document.querySelectorAll("[data-login-role]").forEach(item=>item.classList.toggle("active",item===button));
  }));
  document.querySelectorAll(".password-toggle").forEach(button=>button.addEventListener("click",()=>{
    const input=document.getElementById(button.dataset.target); const visible=input.type==="text";
    input.type=visible?"password":"text";button.textContent=visible?"Show":"Hide";
  }));
  signupPassword.addEventListener("input",()=>{passwordStrength.textContent=/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(signupPassword.value)?"Strong password":"Use 8+ characters with uppercase, lowercase and a number.";});
  signupRole.addEventListener("change",()=>{if(signupRole.value==="admin"){signupRole.value="student";authMessage("Admin accounts can only be created or promoted by an existing administrator.");}});
  loginForm.addEventListener("submit",login); signupForm.addEventListener("submit",signup); resetForm.addEventListener("submit",resetPassword); updatePasswordForm.addEventListener("submit",updatePassword);
  signupLink.addEventListener("click",()=>showAuthForm("signupForm")); loginLink.addEventListener("click",()=>showAuthForm("loginForm"));
  forgotLink.addEventListener("click",()=>showAuthForm("resetForm")); resetBackLink.addEventListener("click",()=>showAuthForm("loginForm"));
  logoutButton.addEventListener("click",async()=>{await supabaseClient.auth.signOut();history.replaceState({},"","/login");});
  if(supabaseClient) supabaseClient.auth.onAuthStateChange((event,session)=>{
    if(event==="PASSWORD_RECOVERY"){showAuthForm("updatePasswordForm");return;}
    handleSession(session);
  });
  if(supabaseClient) supabaseClient.auth.getSession().then(({data})=>handleSession(data.session)); else handleSession(null);
}

async function apiFetch(path, options={}){
  const {data}=await supabaseClient.auth.getSession();
  const headers=new Headers(options.headers || {});
  if(data.session) headers.set("Authorization",`Bearer ${data.session.access_token}`);
  return fetch(path,{...options,headers});
}

function dashboardStats(items){
  return items.map(([label,value])=>`<div class="stat"><small>${label}</small><strong>${value}</strong></div>`).join("");
}

async function loadTrainerDashboard(){
  const response=await apiFetch(`${API}/trainer/courses`);
  if(!response.ok){document.getElementById("trainerStats").innerHTML=`<div class="panel dashboard-error">Unable to load trainer data.</div>`;return;}
  const courses=await response.json();
  document.getElementById("trainerStats").innerHTML=dashboardStats([["Total courses",courses.length],["Published",courses.filter(c=>c.status==="published").length],["Drafts",courses.filter(c=>c.status==="draft").length],["Pending review",courses.filter(c=>c.status==="pending").length]]);
  document.getElementById("trainerActivity").innerHTML=`<h3>Recent activity</h3><p class="muted">${courses.length?"Your latest course updates are ready in My Courses.":"Create your first course to begin teaching."}</p>`;
  renderTrainerCourses(courses);
  document.getElementById("trainerProfileText").textContent=`Signed in as ${authenticatedProfile.full_name || authenticatedProfile.email}. Course ownership and publishing are enforced by the API.`;
}

function renderTrainerCourses(courses){
  document.getElementById("trainerCourses").innerHTML=courses.length?courses.map(course=>`<article class="card course-card"><span class="badge">${course.status.toUpperCase()}</span><h3>${escapeHtml(course.title)}</h3><p class="muted">${escapeHtml(course.category)} · ${escapeHtml(course.difficulty)} · ${course.duration_minutes} min</p><p>${escapeHtml(course.description || "No description yet.")}</p><div class="course-actions"><button class="secondary" data-course-status="${course.id}" data-status="${course.status==="published"?"draft":"published"}">${course.status==="published"?"Unpublish":"Publish"}</button><button class="text-button" data-course-delete="${course.id}">Delete</button></div></article>`).join(""):"<div class=\"panel empty-state\"><h3>No courses yet</h3><p class=\"muted\">Create a draft course to get started.</p></div>";
  document.querySelectorAll("[data-course-status]").forEach(button=>button.addEventListener("click",async()=>{await apiFetch(`${API}/trainer/courses/${button.dataset.courseStatus}/status`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:button.dataset.status})});loadTrainerDashboard();}));
  document.querySelectorAll("[data-course-delete]").forEach(button=>button.addEventListener("click",async()=>{if(confirm("Delete this course?")){await apiFetch(`${API}/trainer/courses/${button.dataset.courseDelete}`,{method:"DELETE"});loadTrainerDashboard();}}));
}

async function loadAdminDashboard(){
  const [overviewResponse,usersResponse,coursesResponse]=await Promise.all([apiFetch(`${API}/admin/overview`),apiFetch(`${API}/admin/users`),apiFetch(`${API}/trainer/courses`)]);
  if(!overviewResponse.ok){document.getElementById("adminStats").innerHTML=`<div class="panel dashboard-error">Unable to load admin data.</div>`;return;}
  const overview=await overviewResponse.json(); const users=await usersResponse.json(); const courses=await coursesResponse.json();
  document.getElementById("adminStats").innerHTML=dashboardStats([["Students",overview.students],["Trainers",overview.trainers],["Admins",overview.admins],["Courses",overview.courses],["Published",overview.published_courses],["Pending trainers",overview.pending_trainers],["Enrollments",overview.enrollments],["Completion",`${overview.completion_rate}%`]]);
  renderAdminUsers(users);renderAdminApprovals(users);document.getElementById("adminCourses").innerHTML=courses.length?courses.map(course=>`<p><b>${escapeHtml(course.title)}</b> · ${course.status} · ${course.category}</p>`).join(""):"<p class=\"muted\">No courses created yet.</p>";
}

function renderAdminUsers(users){
  const render=filter=>{const visible=users.filter(user=>(`${user.full_name||""} ${user.email||""}`).toLowerCase().includes(filter.toLowerCase()));document.getElementById("adminUsers").innerHTML=visible.map(user=>`<div class="table-row"><span><b>${escapeHtml(user.full_name||"Unnamed")}</b><small>${escapeHtml(user.email||"")}</small></span><span class="badge">${user.role}</span><span>${user.approval_status}</span></div>`).join("")||"<p class=\"muted\">No matching users.</p>";};render("");userSearch.oninput=()=>render(userSearch.value);}

function renderAdminApprovals(users){
  const pending=users.filter(user=>user.role==="trainer"&&user.approval_status==="pending");document.getElementById("adminApprovals").innerHTML=pending.length?pending.map(user=>`<article class="card"><span class="badge">PENDING</span><h3>${escapeHtml(user.full_name||"Unnamed trainer")}</h3><p class="muted">${escapeHtml(user.email||"")}</p><button class="primary" data-approve-user="${user.id}">Approve trainer</button><button class="secondary" data-reject-user="${user.id}">Reject</button></article>`).join(""):"<div class=\"panel empty-state\"><h3>Approval queue is clear</h3><p class=\"muted\">No trainers are waiting for review.</p></div>";
  document.querySelectorAll("[data-approve-user],[data-reject-user]").forEach(button=>button.addEventListener("click",async()=>{await apiFetch(`${API}/admin/users/${button.dataset.approveUser||button.dataset.rejectUser}/approval`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:button.dataset.approveUser?"approved":"rejected"})});loadAdminDashboard();}));
}

function escapeHtml(value){return String(value).replace(/[&<>'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[character]));}

function wireDashboard(){
  document.querySelectorAll("[data-trainer-view]").forEach(button=>button.addEventListener("click",()=>{const view=button.dataset.trainerView;document.querySelectorAll("#trainerDashboard .dashboard-view").forEach(item=>item.classList.add("hidden"));document.getElementById(`trainer${view[0].toUpperCase()+view.slice(1)}View`).classList.remove("hidden");}));
  document.querySelectorAll("[data-admin-view]").forEach(button=>button.addEventListener("click",()=>{const view=button.dataset.adminView;document.querySelectorAll("#adminDashboard .dashboard-view").forEach(item=>item.classList.add("hidden"));document.getElementById(`admin${view[0].toUpperCase()+view.slice(1)}View`).classList.remove("hidden");}));
  courseForm.addEventListener("submit",async event=>{event.preventDefault();const response=await apiFetch(`${API}/trainer/courses`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:courseTitle.value,description:courseDescription.value,category:courseCategory.value,difficulty:courseDifficulty.value,duration_minutes:Number(courseDuration.value)})});if(response.ok){courseForm.reset();loadTrainerDashboard();document.querySelector('[data-trainer-view="courses"]').click();}else{alert("Course could not be saved. Ensure your trainer account is approved.");}});
}

function wireBandwidth(){
  const enabled=localStorage.getItem("capacity-connect-low-bandwidth")==="true";
  document.body.classList.toggle("low-bandwidth",enabled);lowBandwidthToggle.checked=enabled;
  lowBandwidthToggle.addEventListener("change",()=>{document.body.classList.toggle("low-bandwidth",lowBandwidthToggle.checked);localStorage.setItem("capacity-connect-low-bandwidth",String(lowBandwidthToggle.checked));});
}

wireAuth();
wireDashboard();
wireBandwidth();

const roleSkills = {
  fullstack: {
    "HTML":70,"CSS":70,"JavaScript":85,"React":80,"Node.js":75,"SQL":70,"Git":65,"Testing":60
  },
  frontend: {
    "HTML":80,"CSS":80,"JavaScript":90,"React":85,"Git":70,"Testing":65
  },
  backend: {
    "Python":80,"FastAPI":75,"SQL":85,"APIs":85,"Git":70,"Testing":70
  },
  data: {
    "Python":80,"SQL":85,"Statistics":75,"Pandas":80,"Data Visualization":75,"Git":60
  }
};

const currentSkills = {HTML:90,CSS:85,JavaScript:60,React:20,"Node.js":10,SQL:50,Git:65,Testing:25,
Python:45,FastAPI:15,APIs:30,Statistics:25,Pandas:20,"Data Visualization":30};

let state = {gap:0, practical:0, path:0, project:50, retention:60, verified:false, role:"fullstack"};

function scrollToId(id){document.getElementById(id).scrollIntoView({behavior:"smooth"})}

function renderSkillForm(){
  const role=document.getElementById("targetRole").value;
  state.role=role;
  const required=roleSkills[role];
  document.getElementById("skillsForm").innerHTML=Object.entries(required).map(([skill,target])=>{
    const value=currentSkills[skill] ?? 20;
    return `<div class="skill-row"><label><span>${skill}</span><b>${value}%</b></label>
    <input type="range" min="0" max="100" value="${value}" data-skill="${skill}"
      oninput="this.previousElementSibling.querySelector('b').textContent=this.value+'%'"></div>`;
  }).join("");
}
document.getElementById("targetRole").addEventListener("change",renderSkillForm);
renderSkillForm();

async function analyzeSkills(){
  const inputs=[...document.querySelectorAll("[data-skill]")];
  const skills=Object.fromEntries(inputs.map(i=>[i.dataset.skill,Number(i.value)]));
  const target=roleSkills[state.role];
  const gaps=Object.entries(target).map(([skill,required])=>({
    skill,current:skills[skill]||0,required,gap:Math.max(0,required-(skills[skill]||0))
  }));
  state.gap=Math.round(gaps.reduce((a,x)=>a+x.gap,0)/gaps.length);
  state.path=0;
  document.getElementById("currentScore").textContent=Math.max(0,100-state.gap)+"%";
  document.getElementById("gapScore").textContent=state.gap+"%";
  document.getElementById("gapResults").innerHTML=`<div class="panel"><h3>Your biggest gaps</h3><div class="gap-grid">
    ${gaps.sort((a,b)=>b.gap-a.gap).map(x=>`<div class="gap-item"><b>${x.skill}</b>
    <div class="bar"><i style="width:${Math.min(100,(x.current/x.required)*100)}%"></i></div>
    <small>${x.current}% current • ${x.required}% target • ${x.gap}% gap</small></div>`).join("")}</div></div>`;
  renderPath(gaps);
  renderOpportunities(gaps);
  updateEffectiveness();
  try{await apiFetch(API+"/skill-gap",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({role:state.role,skills})})}catch(e){}
}

function renderPath(gaps=[]){
  const top=(gaps.length?gaps:[{skill:"JavaScript",gap:25},{skill:"React",gap:20},{skill:"Testing",gap:15}])
    .sort((a,b)=>b.gap-a.gap).slice(0,5);
  const names=top.map(x=>x.skill);
  document.getElementById("learningPath").innerHTML=names.map((s,i)=>`
    <div class="step"><div class="step-number">${i+1}</div>
      <div><b>${s} mastery</b><p class="muted">Learn core concepts → guided practice → mini project → competency check.</p></div>
      <button class="secondary" onclick="completeStep(this)">Start</button>
    </div>`).join("");
}
function completeStep(btn){
  btn.textContent="Completed ✓";btn.disabled=true;state.path=Math.min(100,state.path+20);
  document.getElementById("pathProgress").textContent=state.path+"%";updateEffectiveness();
}

function renderProjects(){
  const projects=[
    ["Skill Project","Build a responsive role-based dashboard","Frontend + API integration"],
    ["Practical Project","Create a REST API with authentication","Backend + database"],
    ["Capstone","Build a complete learning workflow","Full-stack competency"]
  ];
  document.getElementById("projects").innerHTML=projects.map((p,i)=>`<div class="card">
    <span class="badge">PROJECT ${i+1}</span><h3>${p[0]}</h3><p>${p[1]}</p><p class="muted">${p[2]}</p>
    <button class="secondary" onclick="markProject(this)">Mark progress</button></div>`).join("");
}
function markProject(btn){btn.textContent="Project submitted ✓";state.project=Math.min(100,state.project+15);updateEffectiveness()}

async function submitPractical(){
  const code=document.getElementById("codeAnswer").value.trim();
  let score=0, message="";
  // Demo grading: checks for a plausible array-max solution without executing user code.
  if(/function\s+largest/i.test(code) && /(Math\.max|for\s*\(|reduce\s*\(|sort\s*\()/i.test(code)){
    score=92;message="Excellent. Your solution contains the expected function and an array-processing strategy.";
  }else if(code.length>30){
    score=55;message="Partial credit. The solution needs a clearer array-max implementation.";
  }else{score=0;message="Submit a JavaScript function named largest(arr).";}
  state.practical=score;
  document.getElementById("practicalScore").textContent=score+"%";
  document.getElementById("assessmentResult").innerHTML=`<span class="badge">${score>=70?"PASSED":"NEEDS PRACTICE"}</span><h3>${score}%</h3><p>${message}</p>`;
  state.verified=score>=70;
  document.getElementById("certBtn").disabled=!state.verified;
  document.getElementById("certTitle").textContent=state.verified?"JavaScript Practical Competency":"Complete the assessment to unlock";
  document.getElementById("certText").textContent=state.verified?"Verified practical competency achieved. Certificate ID: CC-JS-"+Date.now().toString().slice(-8):"A certificate is issued only when the learner satisfies the competency threshold.";
  updateEffectiveness();
  try{await apiFetch(API+"/assessment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({score,skill:"JavaScript"})})}catch(e){}
}

function downloadCertificate(){
  const text=`CAPACITY CONNECT
VERIFIED COMPETENCY CERTIFICATE

This certifies that the learner has demonstrated practical competency in JavaScript.

Assessment Score: ${state.practical}%
Certificate ID: CC-JS-${Date.now().toString().slice(-8)}

Issued by Capacity Connect`;
  const blob=new Blob([text],{type:"text/plain"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="capacity-connect-certificate.txt";a.click();URL.revokeObjectURL(url);
}

function renderOpportunities(gaps=[]){
  const score=Math.max(0,100-state.gap);
  const opportunities=[
    ["Frontend Developer Intern",["HTML","CSS","JavaScript","React"],Math.min(98,score+8)],
    ["Full Stack Trainee",["JavaScript","Node.js","SQL","Git"],Math.min(95,score)],
    ["Web Application Project",["HTML","CSS","JavaScript","Testing"],Math.min(92,score+4)]
  ];
  document.getElementById("opportunitiesList").innerHTML=opportunities.map(o=>`<div class="card">
    <span class="badge">${o[2]}% MATCH</span><h3>${o[0]}</h3><p class="muted">Required: ${o[1].join(" • ")}</p>
    <button class="secondary">View opportunity</button></div>`).join("");
}

function updateEffectiveness(){
  const competency=Math.max(0,100-state.gap);
  const score=Math.round(competency*.25 + state.practical*.35 + state.project*.2 + state.path*.1 + state.retention*.1);
  document.getElementById("effectivenessScore").textContent=score;
  document.getElementById("heroScore").textContent=score+"%";
  document.getElementById("effectivenessBar").style.width=score+"%";
  document.getElementById("effectivenessBreakdown").innerHTML=[
    ["Competency",competency],["Practical",state.practical],["Projects",state.project],["Retention",state.retention]
  ].map(x=>`<div><small>${x[0]}</small><br><b>${x[1]}%</b></div>`).join("");
}

function renderTrainers(){
  const trainers=[
    ["Dr. Ananya Sen","JavaScript & Web Engineering",94,91],
    ["Rahul Mehta","Backend & APIs",89,88],
    ["Priya Das","Data & Analytics",92,86]
  ];
  document.getElementById("trainerCards").innerHTML=trainers.map(t=>`<div class="card">
    <span class="badge">TOP TRAINER</span><h3>${t[0]}</h3><p>${t[1]}</p>
    <div class="trainer-score">${t[2]}/100</div><p class="muted">Quality score</p>
    <p>Average learner improvement: <b>${t[3]}%</b></p>
  </div>`).join("");
}

renderPath();renderProjects();renderTrainers();renderOpportunities();updateEffectiveness();
