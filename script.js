/* ================================================================
   CAPACITY CONNECT — Complete Frontend Logic
   Single script.js: Router + Demo + Auth + All Feature Screens
   ================================================================ */

/* §1 ── CONFIG ─────────────────────────────────────────────────── */
const CFG = window.CAPACITY_CONNECT_CONFIG || {};
const API = '/api';
const DEMO_KEY    = CFG.demoStorageKey    || 'cc_demo_mode';
const JOURNEY_KEY = CFG.journeyStorageKey || 'cc_journey';
const BW_KEY      = CFG.bandwidthStorageKey || 'cc_lowbw';

/* §2 ── ROLE REQUIREMENTS ──────────────────────────────────────── */
const ROLE_REQUIREMENTS = {
  'Full Stack Developer': { HTML:70, CSS:70, JavaScript:85, Python:75, SQL:70, 'REST API':80, Git:65, FastAPI:70, Authentication:65 },
  'Frontend Developer':   { HTML:80, CSS:80, JavaScript:90, Git:70, Authentication:60 },
  'Backend Developer':    { Python:80, FastAPI:75, SQL:85, 'REST API':85, Git:70, Authentication:75 },
  'Data Analyst':         { Python:80, SQL:85, Git:60 }
};

/* §3 ── DEMO DATA ───────────────────────────────────────────────── */
const DEMO_STUDENT = {
  name: 'Alex Johnson', role: 'Full Stack Developer',
  skills: { HTML:90, CSS:85, JavaScript:72, Python:65, SQL:48, 'REST API':40, Git:75, FastAPI:45, Authentication:35 },
  skill_readiness: 72, skill_gaps: 4, learning_progress: 58, learning_effectiveness: 84,
  journey: { assessment:true, gap_analysis:true, learning_path:true, learn_practice:58, project:35, competency:false, passport:true, opportunities:6 }
};

const DEMO_TRAINER = {
  name: 'Dr. Priya Sharma', expertise: ['Python','FastAPI','REST API','Backend Development'],
  active_learners:24, avg_improvement:27, projects_to_review:6, avg_feedback:4.6, quality_score:88,
  quality_breakdown: { learner_improvement:90, course_completion:85, learner_feedback:89 },
  learners: [
    { name:'Alex Johnson',  role:'Full Stack Developer', progress:58, skill_readiness:72, last_active:'2h ago' },
    { name:'Priya Nair',    role:'Backend Developer',    progress:82, skill_readiness:85, last_active:'1d ago' },
    { name:'Arjun Patel',   role:'Frontend Developer',   progress:45, skill_readiness:61, last_active:'3h ago' },
    { name:'Sneha Reddy',   role:'Full Stack Developer', progress:71, skill_readiness:78, last_active:'5h ago' },
    { name:'Kiran Kumar',   role:'Data Analyst',         progress:90, skill_readiness:91, last_active:'30m ago' }
  ],
  projects_pending: [
    { student:'Alex Johnson', project:'Full Stack Task Manager', submitted:'2h ago', status:'pending' },
    { student:'Arjun Patel',  project:'Portfolio Website',       submitted:'1d ago', status:'pending' }
  ]
};

const TRAINER_EXPERTISE = {
  Python: 92,
  FastAPI: 95,
  'REST API': 94,
  'Backend Development': 91,
  Authentication: 87,
  SQL: 76
};

const TRAINER_LEARNERS = [
  {
    id: 'l1',
    name: 'Alex Johnson',
    avatar: 'AJ',
    role: 'Full Stack Developer',
    readiness: 72,
    progress: 58,
    focus: 'REST API & Authentication',
    status: 'Active',
    lastActive: 'Today',
    gapsCount: 4,
    skills: { HTML:90, CSS:85, JavaScript:72, Python:65, SQL:48, 'REST API':40, Git:75, FastAPI:45, Authentication:35 },
    completedModules: ['REST API Fundamentals'],
    currentProject: 'Full Stack Task Manager',
    practicalStatus: 'Pending',
    competencyStatus: 'Not Verified'
  },
  {
    id: 'l2',
    name: 'Priya Das',
    avatar: 'PD',
    role: 'Backend Developer',
    readiness: 81,
    progress: 74,
    focus: 'FastAPI',
    status: 'Active',
    lastActive: 'Yesterday',
    gapsCount: 2,
    skills: { Python:85, FastAPI:70, SQL:85, 'REST API':85, Git:80, Authentication:75 },
    completedModules: ['REST API Fundamentals', 'SQL & Database Design'],
    currentProject: 'E-commerce Microservices',
    practicalStatus: 'Passed (88%)',
    competencyStatus: 'Verified ✓'
  },
  {
    id: 'l3',
    name: 'Rahul Sharma',
    avatar: 'RS',
    role: 'Frontend Developer',
    readiness: 64,
    progress: 45,
    focus: 'JavaScript',
    status: 'Needs Attention',
    lastActive: '5 days ago',
    gapsCount: 5,
    skills: { HTML:85, CSS:80, JavaScript:64, Git:70, Authentication:50 },
    completedModules: ['HTML/CSS Basics'],
    currentProject: 'Portfolio Website',
    practicalStatus: 'Pending',
    competencyStatus: 'Not Verified'
  },
  {
    id: 'l4',
    name: 'Sneha Roy',
    avatar: 'SR',
    role: 'Data Analyst',
    readiness: 77,
    progress: 69,
    focus: 'SQL',
    status: 'Active',
    lastActive: '2 days ago',
    gapsCount: 3,
    skills: { Python:75, SQL:70, Git:80 },
    completedModules: ['SQL & Database Design'],
    currentProject: 'Data Analysis Pipeline',
    practicalStatus: 'Passed (79%)',
    competencyStatus: 'Verified ✓'
  }
];

const PROJECT_REVIEWS_DATA = [
  {
    id: 'pr1',
    learner: 'Alex Johnson',
    project: 'Full Stack Task Manager',
    submitted: '2 hours ago',
    technologies: ['HTML', 'CSS', 'JavaScript', 'Python', 'FastAPI'],
    completion: 92,
    status: 'Pending Review',
    description: 'A complete task management application with REST API backend, JWT authentication, and Supabase integration.',
    criteria: {
      functionality: 85,
      codeQuality: 78,
      uiUx: 88,
      apiIntegration: 82,
      security: 70
    },
    overallScore: 81,
    feedback: ''
  },
  {
    id: 'pr2',
    learner: 'Arjun Patel',
    project: 'Portfolio Website',
    submitted: '1 day ago',
    technologies: ['HTML', 'CSS', 'JavaScript'],
    completion: 80,
    status: 'Pending Review',
    description: 'Responsive portfolio website showcasing projects with clean animations and contact form.',
    criteria: {
      functionality: 80,
      codeQuality: 82,
      uiUx: 85,
      apiIntegration: 60,
      security: 65
    },
    overallScore: 74,
    feedback: ''
  }
];

const TRAINER_FEEDBACK_DATA = [
  {
    id: 'fb1',
    learner: 'Alex Johnson',
    rating: 5,
    comment: 'REST API modules were very useful and the practical assessment helped me understand my weak areas.',
    date: 'Yesterday',
    response: ''
  },
  {
    id: 'fb2',
    learner: 'Priya Das',
    rating: 4,
    comment: 'The learning resources were well structured. More FastAPI examples would be helpful.',
    date: '3 days ago',
    response: ''
  },
  {
    id: 'fb3',
    learner: 'Rahul Sharma',
    rating: 4,
    comment: 'The project review feedback helped me improve my implementation.',
    date: '1 week ago',
    response: ''
  },
  {
    id: 'fb4',
    learner: 'Sneha Roy',
    rating: 5,
    comment: 'Great platform and personalized learning path!',
    date: '2 weeks ago',
    response: ''
  }
];

const TRAINER_COURSES_DATA = [
  {
    id: 'tc1',
    title: 'REST API Fundamentals',
    category: 'Backend Development',
    instructor: 'Dr. Priya Sharma',
    learners: 18,
    modulesCount: 6,
    completion: 76,
    rating: 4.8,
    status: 'Published',
    description: 'Learn HTTP methods, status codes, request/response cycles and RESTful architectural principles.',
    objectives: [
      'Understand HTTP GET, POST, PUT, DELETE',
      'Design clean resource URLs',
      'Handle HTTP status codes correctly',
      'Build JSON API endpoints'
    ],
    resources: [
      { title: 'REST Design Guide (PDF)', type: 'document', url: 'https://restfulapi.net' },
      { title: 'MDN HTTP Overview', type: 'external', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview' }
    ],
    modules: [
      { title: '1. Introduction to REST', duration: '45m' },
      { title: '2. Core HTTP Concepts', duration: '1h' },
      { title: '3. Designing Endpoint URLs', duration: '1h 15m' },
      { title: '4. Hands-on API Design', duration: '1h 30m' },
      { title: '5. Assessment', duration: '45m' },
      { title: '6. Final Project', duration: '2h' }
    ]
  },
  {
    id: 'tc2',
    title: 'FastAPI Backend Development',
    category: 'Python',
    instructor: 'Dr. Priya Sharma',
    learners: 14,
    modulesCount: 8,
    completion: 63,
    rating: 4.7,
    status: 'Published',
    description: 'Build high-performance async Python web APIs with FastAPI and Pydantic validation.',
    objectives: [
      'Build asynchronous API routes',
      'Use Pydantic request/response models',
      'Implement FastAPI dependency injection',
      'Auto-generate Swagger/OpenAPI docs'
    ],
    resources: [
      { title: 'FastAPI Official Guide', type: 'external', url: 'https://fastapi.tiangolo.com' }
    ],
    modules: [
      { title: '1. Getting Started with FastAPI', duration: '45m' },
      { title: '2. Request & Response Models', duration: '1h' },
      { title: '3. Dependency Injection', duration: '1h' },
      { title: '4. Database Integration', duration: '2h' }
    ]
  },
  {
    id: 'tc3',
    title: 'Authentication & Security',
    category: 'Web Security',
    instructor: 'Dr. Priya Sharma',
    learners: 11,
    modulesCount: 5,
    completion: 58,
    rating: 4.6,
    status: 'Draft',
    description: 'Implement JWT tokens, password hashing, CORS, and role-based access control.',
    objectives: [
      'Hash passwords securely with bcrypt',
      'Issue and verify JWT access tokens',
      'Protect routes with bearer authentication',
      'Configure CORS & security headers'
    ],
    resources: [
      { title: 'JWT Intro', type: 'external', url: 'https://jwt.io' }
    ],
    modules: [
      { title: '1. Auth Fundamentals', duration: '45m' },
      { title: '2. JWT Architecture', duration: '1h' },
      { title: '3. Password Hashing', duration: '1h' }
    ]
  }
];

const ASSESSMENT_QUESTIONS = [
  { id:'q1', skill:'REST API',        question:'What HTTP method should be used to retrieve data from an API without side effects?',     options:['POST','GET','PUT','DELETE'],                       correct:1 },
  { id:'q2', skill:'REST API',        question:'A REST API returns status code 404. What does this mean?',                              options:['Server error','Unauthorized','Resource not found','Success'], correct:2 },
  { id:'q3', skill:'SQL',             question:'Which SQL clause filters rows AFTER aggregation?',                                       options:['WHERE','HAVING','GROUP BY','ORDER BY'],            correct:1 },
  { id:'q4', skill:'SQL',             question:'What is the purpose of a database index?',                                              options:['Store backups','Speed up query lookups','Encrypt data','Create relationships'], correct:1 },
  { id:'q5', skill:'JavaScript',      question:'Which JavaScript concept handles asynchronous operations?',                              options:['Closures','Prototypes','Promises / async-await','Symbols'], correct:2 },
  { id:'q6', skill:'JavaScript',      question:'What does the Array.map() method return?',                                              options:['The original array mutated','A new array with transformed elements','A single value','A boolean'], correct:1 },
  { id:'q7', skill:'Python',          question:'Which Python keyword is used to define a generator function?',                           options:['return','async','yield','lambda'],                 correct:2 },
  { id:'q8', skill:'Python',          question:'What does FastAPI use to validate request body data?',                                   options:['Marshmallow','Pydantic','Cerberus','Voluptuous'], correct:1 },
  { id:'q9', skill:'Git',             question:'Which Git command integrates changes from one branch into another?',                     options:['git clone','git push','git merge','git fetch'],   correct:2 },
  { id:'q10',skill:'Authentication',  question:'Where should a JWT access token be stored in a browser for security?',                  options:['localStorage','sessionStorage','Memory (JS variable)','URL query string'], correct:2 }
];

const PRACTICAL_QUESTIONS = [
  { id:'p1', skill:'REST API', scenario:'You are designing an API endpoint to create a new user account.',
    question:'Which HTTP method and URL pattern is most RESTful?',
    options:['GET /users/create','POST /users','PUT /user/new','PATCH /accounts'], correct:1 },
  { id:'p2', skill:'SQL', scenario:'A table "orders" has 10 million rows. Queries filtering by customer_id are very slow.',
    question:'What is the most effective solution?',
    options:['Add more RAM to the server','Use SELECT * instead of specific columns','Create an index on customer_id','Split the table into two tables'], correct:2 },
  { id:'p3', skill:'JavaScript', scenario:'Your fetch() call to an API sometimes returns data and sometimes throws an error.',
    question:'What is the correct way to handle both cases?',
    options:['Use try/catch with async/await','Call the API twice','Check navigator.online before fetching','Use synchronous XMLHttpRequest'], correct:0 }
];

const LEARNING_MODULES = [
  { id:'m1', skill:'REST API', title:'REST API Fundamentals', description:'Learn HTTP methods, status codes, request/response cycles and how to design clean REST endpoints.', difficulty:'Beginner', duration_hrs:3, position:1,
    objectives:['Understand HTTP methods: GET, POST, PUT, DELETE','Design resource-based URL structures','Handle status codes (200, 201, 400, 401, 404, 500)','Parse JSON request and response bodies','Test endpoints with Postman'],
    resources:[{title:'MDN HTTP Overview',url:'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview'},{title:'REST API Design Guide',url:'https://restfulapi.net'}] },
  { id:'m2', skill:'SQL', title:'SQL & Database Design', description:'Master SELECT, JOIN, GROUP BY, indexes and schema design patterns used in real production databases.', difficulty:'Beginner', duration_hrs:4, position:2,
    objectives:['Write SELECT queries with WHERE and ORDER BY','Use INNER JOIN, LEFT JOIN across related tables','Aggregate data with GROUP BY and HAVING','Create indexes for query performance','Design normalized schemas'],
    resources:[{title:'SQLZoo Interactive Tutorial',url:'https://sqlzoo.net'},{title:'PostgreSQL Docs',url:'https://www.postgresql.org/docs/current/tutorial.html'}] },
  { id:'m3', skill:'FastAPI', title:'FastAPI Backend Development', description:'Build async Python APIs with FastAPI, Pydantic models, dependency injection, and auto-generated OpenAPI docs.', difficulty:'Intermediate', duration_hrs:5, position:3,
    objectives:['Create GET and POST endpoints','Define Pydantic request and response models','Use dependency injection for auth and DB','Return structured JSON responses','Use FastAPI /docs'],
    resources:[{title:'FastAPI Official Tutorial',url:'https://fastapi.tiangolo.com/tutorial/'},{title:'Pydantic Docs',url:'https://docs.pydantic.dev'}] },
  { id:'m4', skill:'Authentication', title:'Authentication & Security', description:'Implement JWT auth, secure password hashing, session management and role-based access control.', difficulty:'Intermediate', duration_hrs:3, position:4,
    objectives:['Hash passwords with bcrypt','Issue and verify JWT tokens','Protect routes with Bearer token middleware','Implement role-based access','Understand CORS and security headers'],
    resources:[{title:'JWT Introduction',url:'https://jwt.io/introduction'},{title:'OWASP Auth Cheat Sheet',url:'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html'}] },
  { id:'m5', skill:'Full Stack', title:'Full Stack Integration', description:'Connect a JavaScript frontend to a FastAPI backend backed by PostgreSQL. Deploy end-to-end.', difficulty:'Advanced', duration_hrs:8, position:5,
    objectives:['Wire fetch() calls from HTML/JS to FastAPI endpoints','Handle auth tokens in frontend requests','Display API data with DOM manipulation','Connect FastAPI to Supabase/PostgreSQL','Deploy frontend and backend together'],
    resources:[{title:'MDN Fetch API',url:'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch'},{title:'Supabase Quickstart',url:'https://supabase.com/docs/guides/getting-started'}] }
];

const OPPORTUNITIES_DATA = [
  { id:'o1', title:'Frontend Developer Internship', company:'TechStart India',        type:'Internship', required_skills:[{skill:'HTML',level:70},{skill:'CSS',level:70},{skill:'JavaScript',level:80},{skill:'Git',level:60}] },
  { id:'o2', title:'Backend Developer Internship',  company:'DataBridge Solutions',   type:'Internship', required_skills:[{skill:'Python',level:75},{skill:'FastAPI',level:70},{skill:'SQL',level:75},{skill:'REST API',level:80},{skill:'Git',level:65}] },
  { id:'o3', title:'Junior Full Stack Internship',  company:'BuildFast Technologies', type:'Internship', required_skills:[{skill:'JavaScript',level:75},{skill:'Python',level:70},{skill:'SQL',level:70},{skill:'REST API',level:75},{skill:'Git',level:65}] },
  { id:'o4', title:'Python Developer Internship',   company:'Analytics Hub',          type:'Internship', required_skills:[{skill:'Python',level:80},{skill:'SQL',level:70},{skill:'Git',level:65}] },
  { id:'o5', title:'Web Development Project',       company:'GovTech Initiative',     type:'Project',    required_skills:[{skill:'HTML',level:70},{skill:'CSS',level:70},{skill:'JavaScript',level:75},{skill:'REST API',level:65}] }
];

/* §4 ── STATE ───────────────────────────────────────────────────── */
const state = {
  currentScreen: 'landing',
  demoRole: null,               // 'student' | 'trainer' | null
  assessmentAnswers: [],        // index per question
  currentQuestion: 0,
  assessmentScores: {},         // { skill: score }
  skillGaps: [],                // computed gaps array
  moduleProgress: {},           // { moduleId: true/false }
  projectTasks: {},             // { taskId: true/false }
  practicalAnswers: {},         // { qId: answerIndex }
  practicalScore: 0,
  projectSubmitted: false,
  starRating: 4,
  trainerActiveTab: 'overview',
  journeyProgress: loadJourney(),
  supabaseClient: null
};

function loadJourney() {
  try { return JSON.parse(localStorage.getItem(JOURNEY_KEY)) || {}; } catch { return {}; }
}
function saveJourney() {
  localStorage.setItem(JOURNEY_KEY, JSON.stringify(state.journeyProgress));
}

/* §5 ── ROUTER ─────────────────────────────────────────────────── */
const ALL_SCREENS = ['landing','login','student','assessment','skill-gap','learning-path','project','practical','passport','opportunities','trainer'];
const STUDENT_SCREENS = ['student','assessment','skill-gap','learning-path','project','practical','passport','opportunities'];
const JOURNEY_MAP = { 'assessment':1, 'skill-gap':2, 'learning-path':3, 'project':4, 'practical':5, 'passport':6, 'opportunities':7 };

const CC = {
  go(screen) {
    // Hide all screens
    ALL_SCREENS.forEach(s => {
      const el = document.getElementById('screen-' + s);
      if (el) el.classList.add('hidden');
    });

    // Show target screen
    const target = document.getElementById('screen-' + screen);
    if (target) target.classList.remove('hidden');
    state.currentScreen = screen;

    // Nav bar visibility
    const nav = document.getElementById('global-nav');
    const journeyBar = document.getElementById('journey-bar');
    if (screen === 'landing') {
      nav.classList.add('hidden');
      journeyBar.classList.add('hidden');
    } else {
      nav.classList.remove('hidden');
      // Show journey bar only on student screens
      const isStudentScreen = STUDENT_SCREENS.includes(screen);
      journeyBar.classList.toggle('hidden', !isStudentScreen || state.demoRole === 'trainer');
    }

    // Update journey bar active step
    const step = JOURNEY_MAP[screen];
    if (step) updateJourneyBar(step);

    // Show correct nav buttons
    updateNavButtons();

    // Initialize screen content
    initScreen(screen);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  enterDemo(role) {
    state.demoRole = role;
    localStorage.setItem(DEMO_KEY, role);
    document.getElementById('demo-modal').classList.add('hidden');
    document.getElementById('demo-badge').classList.remove('hidden');
    if (role === 'student') {
      CC.go('student');
    } else {
      CC.go('trainer');
    }
  },

  exitDemo() {
    state.demoRole = null;
    localStorage.removeItem(DEMO_KEY);
    document.getElementById('demo-badge').classList.add('hidden');
    CC.go('landing');
  },

  login() {
    const email = document.getElementById('login-email').value.trim();
    const pw    = document.getElementById('login-password').value;
    if (!email || !pw) { showAuthMsg('Enter email and password.'); return; }
    if (!state.supabaseClient) { showAuthMsg('Supabase not configured. Use Demo Login.'); return; }
    state.supabaseClient.auth.signInWithPassword({ email, password: pw })
      .then(({ data, error }) => {
        if (error) { showAuthMsg(error.message); return; }
        CC.go('student');
      });
  },

  signup() {
    const name  = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pw    = document.getElementById('signup-password').value;
    const role  = document.getElementById('signup-role').value;
    if (!name || !email || !pw) { showAuthMsg('Fill all fields.'); return; }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pw)) {
      showAuthMsg('Password: 8+ chars, uppercase, lowercase, number.'); return;
    }
    if (!state.supabaseClient) { showAuthMsg('Supabase not configured. Use Demo Login.'); return; }
    state.supabaseClient.auth.signUp({ email, password: pw, options: { data: { full_name: name, role } } })
      .then(({ error }) => {
        if (error) { showAuthMsg(error.message); return; }
        showAuthMsg('Account created! Check email for confirmation link.', 'success');
      });
  },

  showForm(form) {
    document.getElementById('login-form').classList.toggle('hidden', form !== 'login');
    document.getElementById('signup-form').classList.toggle('hidden', form !== 'signup');
    document.getElementById('auth-notice').textContent = '';
  },

  // Assessment
  nextQ() {
    const opts = document.querySelectorAll('.option-btn');
    const hasAnswer = [...opts].some(b => b.classList.contains('selected'));
    if (!hasAnswer) {
      highlightNoSelection(); return;
    }
    if (state.currentQuestion < ASSESSMENT_QUESTIONS.length - 1) {
      state.currentQuestion++;
      renderQuestion(state.currentQuestion);
    } else {
      finishAssessment();
    }
  },
  prevQ() {
    if (state.currentQuestion > 0) {
      state.currentQuestion--;
      renderQuestion(state.currentQuestion);
    }
  },
  retakeAssessment() {
    state.assessmentAnswers = [];
    state.currentQuestion = 0;
    document.getElementById('assessment-in-progress').classList.remove('hidden');
    document.getElementById('assessment-results').classList.add('hidden');
    renderQuestion(0);
  },

  // Project
  submitProject() {
    const github = document.getElementById('proj-github').value.trim();
    const demo   = document.getElementById('proj-demo').value.trim();
    const desc   = document.getElementById('proj-desc').value.trim();
    if (!github && !desc) {
      alert('Please provide a GitHub URL or description before submitting.'); return;
    }
    state.projectSubmitted = true;
    state.journeyProgress.project = true;
    saveJourney();
    const result = document.getElementById('submission-result');
    result.classList.remove('hidden');
    result.innerHTML = `<strong style="color:var(--accent)">✅ Project Submitted!</strong><br>
      <span style="font-size:.85rem;color:var(--muted2)">Score: 85/100 · Feedback: Strong implementation. All required skills demonstrated.</span>`;
    document.querySelector('.project-submission-panel .btn-primary').textContent = '✓ Submitted';
    document.querySelector('.project-submission-panel .btn-primary').disabled = true;
  },

  // Practical
  submitPractical() {
    let correct = 0;
    const total = PRACTICAL_QUESTIONS.length;
    PRACTICAL_QUESTIONS.forEach(q => {
      const ans = state.practicalAnswers[q.id];
      if (ans !== undefined && ans === q.correct) correct++;
    });
    const score = Math.round((correct / total) * 100);
    const finalScore = Math.max(score, state.practicalAnswers && Object.keys(state.practicalAnswers).length > 0 ? 50 : 0);
    state.practicalScore = finalScore;
    state.journeyProgress.practical = true;
    state.journeyProgress.competency = finalScore >= 70;
    saveJourney();

    const composite = Math.round(90*0.25 + 82*0.25 + finalScore*0.30 + 85*0.20);
    const verified = composite >= 75;

    document.getElementById('practical-in-progress').classList.add('hidden');
    document.getElementById('practical-result').classList.remove('hidden');
    document.getElementById('cb-practical').textContent = finalScore + '%';
    document.getElementById('composite-bar').style.width = composite + '%';
    document.getElementById('composite-score').textContent = composite + ' / 100';
    document.getElementById('competency-icon').textContent = verified ? '✅' : '⚠️';
    document.getElementById('competency-title').textContent = verified ? 'COMPETENCY VERIFIED ✓' : 'ASSESSMENT COMPLETE';
    document.getElementById('competency-subtitle').textContent = verified
      ? 'Your practical skills meet the competency threshold. Certificate unlocked.'
      : `Score ${composite}/100 is below the 75-point threshold. Keep learning and re-assess.`;

    // Save to API
    apiFetch(`${API}/practical/evaluate`, { method:'POST', body: JSON.stringify({ answers: state.practicalAnswers }) }).catch(()=>{});
  },

  // Passport
  downloadPassport() {
    const text = `CAPACITY CONNECT — SKILL PASSPORT
${'─'.repeat(40)}
Name: ${DEMO_STUDENT.name}
Target Role: ${DEMO_STUDENT.role}
Issue Date: ${new Date().toLocaleDateString()}
${'─'.repeat(40)}

VERIFIED SKILLS
REST API:       78%  ✓ Verified
JavaScript:     82%  ✓ Verified
Python:         76%  ✓ Verified
Git:            84%  ✓ Verified
HTML:           90%  ✓ Verified
CSS:            85%  ✓ Verified
SQL:            68%
FastAPI:        72%

PROJECTS COMPLETED
✓ Full Stack Task Manager (Score: 85/100)

CERTIFICATIONS
✓ Backend Development Certificate · ID: CC-DEMO0001

COMPETENCIES VERIFIED
✓ REST API Development
✓ Backend Development
${'─'.repeat(40)}
Issued by Capacity Connect · SIH 2026`;
    const blob = new Blob([text], { type:'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'CapacityConnect-SkillPassport-AlexJohnson.txt';
    a.click(); URL.revokeObjectURL(url);
  },

  // Trainer tabs
  trainerTab(tab) {
    state.trainerActiveTab = tab;
    document.querySelectorAll('.trainer-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    const view = document.getElementById('tv-' + tab);
    if (view) view.classList.add('active');
    const btn = [...document.querySelectorAll('.sidebar-btn')].find(b => b.textContent.toLowerCase().includes(tab.substring(0,4)));
    if (btn) btn.classList.add('active');

    if (tab === 'learners') renderLearners();
    if (tab === 'projects') renderProjectReviews();
    if (tab === 'feedback') renderTrainerFeedback('All');
    if (tab === 'quality') renderTrainerQuality();
    if (tab === 'courses') renderTrainerCourses();
    if (tab === 'competency') renderCompetencyMap();
  },

  // Feedback
  submitFeedback() {
    const learner = document.getElementById('fb-learner').value.trim();
    const comment = document.getElementById('fb-comment').value.trim();
    if (!learner || !comment) { alert('Fill learner name and comment.'); return; }
    const result = document.getElementById('fb-result');
    result.classList.remove('hidden');
    result.innerHTML = `<strong style="color:var(--accent)">✅ Feedback submitted for ${escHtml(learner)}</strong><br>
      <span style="font-size:.82rem;color:var(--muted)">Rating: ${state.starRating}/5 · Thank you for helping learners grow.</span>`;
    apiFetch(`${API}/trainer/feedback`, { method:'POST', body: JSON.stringify({ learner_name: learner, rating: state.starRating, comment }) }).catch(()=>{});
  }
};

/* §6 ── SCREEN INITIALIZERS ────────────────────────────────────── */
function initScreen(screen) {
  switch(screen) {
    case 'student':       initStudentDashboard(); break;
    case 'assessment':    initAssessment(); break;
    case 'skill-gap':     initSkillGap(); break;
    case 'learning-path': initLearningPath(); break;
    case 'project':       initProject(); break;
    case 'practical':     initPractical(); break;
    case 'passport':      initPassport(); break;
    case 'opportunities': initOpportunities(); break;
    case 'trainer':       initTrainer(); break;
  }
}

/* §7 ── STUDENT DASHBOARD ──────────────────────────────────────── */
function initStudentDashboard() {
  const d = DEMO_STUDENT;
  document.getElementById('student-name').textContent = d.name.split(' ')[0];
  document.getElementById('student-role').textContent = d.role;
  document.getElementById('stat-readiness').textContent    = d.skill_readiness + '%';
  document.getElementById('stat-gaps').textContent         = d.skill_gaps;
  document.getElementById('stat-progress').textContent     = d.learning_progress + '%';
  document.getElementById('stat-effectiveness').textContent = d.learning_effectiveness + '%';
  renderJourneyChecklist();
}

function renderJourneyChecklist() {
  const items = [
    { label:'Skill Assessment',       sub:'10 questions · MCQ + Scenarios', screen:'assessment',    status:'done',   statusLabel:'✓ Completed' },
    { label:'Skill Gap Analysis',     sub:'Current vs Required skills',      screen:'skill-gap',     status:'done',   statusLabel:'✓ Completed' },
    { label:'Personalized Path',      sub:'5 modules · Gap-prioritized',     screen:'learning-path', status:'active', statusLabel:'Active' },
    { label:'Learn & Practice',       sub:'Modules + Resources',             screen:'learning-path', status:'pct',    statusLabel:'58%', pct:58 },
    { label:'Project-Based Learning', sub:'Full Stack Task Manager',         screen:'project',       status:'pct',    statusLabel:'35%', pct:35 },
    { label:'Competency Verification',sub:'Practical assessment required',   screen:'practical',     status:'locked', statusLabel:'Locked' },
    { label:'Skill Passport',         sub:'Verified skill record',           screen:'passport',      status:'done',   statusLabel:'Active' },
    { label:'Opportunities',          sub:'6 matching opportunities',        screen:'opportunities', status:'active', statusLabel:'6 Matches' }
  ];

  document.getElementById('journey-checklist').innerHTML = items.map((item, i) => `
    <div class="journey-item ${item.status}" onclick="${item.status !== 'locked' ? `CC.go('${item.screen}')` : ''}">
      <div class="ji-num">${i+1}</div>
      <div class="ji-info">
        <strong>${escHtml(item.label)}</strong>
        <small>${escHtml(item.sub)}</small>
      </div>
      ${item.pct !== undefined ? `<div class="ji-progress"><div class="progress-wrap thin"><div class="progress-fill" style="width:${item.pct}%"></div></div></div>` : '<div></div>'}
      <div class="ji-status ${item.status}">${item.statusLabel}</div>
    </div>
  `).join('');
}

/* §8 ── SKILL ASSESSMENT ───────────────────────────────────────── */
function initAssessment() {
  state.currentQuestion = 0;
  state.assessmentAnswers = new Array(ASSESSMENT_QUESTIONS.length).fill(undefined);
  document.getElementById('assessment-in-progress').classList.remove('hidden');
  document.getElementById('assessment-results').classList.add('hidden');
  renderQuestion(0);
}

function renderQuestion(idx) {
  const q = ASSESSMENT_QUESTIONS[idx];
  const total = ASSESSMENT_QUESTIONS.length;

  document.getElementById('q-counter').textContent = `Question ${idx + 1} of ${total}`;
  document.getElementById('q-bar-fill').style.width = ((idx + 1) / total * 100) + '%';
  document.getElementById('q-skill-tag').textContent = q.skill;
  document.getElementById('q-text').textContent = q.question;
  document.getElementById('q-back-btn').disabled = idx === 0;
  document.getElementById('q-next-btn').textContent = idx === total - 1 ? 'Submit →' : 'Next →';

  const letters = ['A','B','C','D'];
  document.getElementById('q-options').innerHTML = q.options.map((opt, i) => `
    <button class="option-btn ${state.assessmentAnswers[idx] === i ? 'selected' : ''}"
            onclick="selectOption(${idx}, ${i}, this)">
      <span class="option-letter">${letters[i]}</span>
      ${escHtml(opt)}
    </button>
  `).join('');
}

function selectOption(qIdx, optIdx, btn) {
  state.assessmentAnswers[qIdx] = optIdx;
  document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function highlightNoSelection() {
  const opts = document.querySelectorAll('.option-btn');
  opts.forEach(b => { b.style.borderColor = 'var(--danger)'; setTimeout(() => b.style.borderColor = '', 1200); });
}

function finishAssessment() {
  const scores = calculateAssessmentScores();
  state.assessmentScores = scores;
  state.journeyProgress.assessment = true;
  saveJourney();

  const correct = ASSESSMENT_QUESTIONS.filter((q, i) => state.assessmentAnswers[i] === q.correct).length;
  document.getElementById('result-correct').textContent = correct + '/10';

  const skillKeys = [...new Set(ASSESSMENT_QUESTIONS.map(q => q.skill))];
  document.getElementById('skill-score-grid').innerHTML = skillKeys.map(skill => {
    const s = scores[skill] || 0;
    const color = s >= 80 ? 'green' : s >= 60 ? 'yellow' : 'red';
    return `<div class="skill-score-row">
      <div class="skill-score-name">${skill}</div>
      <div class="skill-score-bar"><div class="progress-wrap"><div class="progress-fill ${color}" style="width:${s}%"></div></div></div>
      <div class="skill-score-pct ${s>=80?'accent':''}">${Math.round(s)}%</div>
    </div>`;
  }).join('');

  document.getElementById('assessment-in-progress').classList.add('hidden');
  document.getElementById('assessment-results').classList.remove('hidden');

  // Push to API silently
  apiFetch(`${API}/assessment/score`, { method:'POST', body: JSON.stringify({ answers: state.assessmentAnswers }) }).catch(()=>{});
}

function calculateAssessmentScores() {
  const skillMap = {};
  ASSESSMENT_QUESTIONS.forEach((q, i) => {
    if (!skillMap[q.skill]) skillMap[q.skill] = { correct:0, total:0 };
    skillMap[q.skill].total++;
    if (state.assessmentAnswers[i] === q.correct) skillMap[q.skill].correct++;
  });
  const scores = {};
  // Blend with demo base scores for realistic presentation
  const base = DEMO_STUDENT.skills;
  Object.entries(skillMap).forEach(([skill, { correct, total }]) => {
    const assessPct = (correct / total) * 100;
    const basePct   = base[skill] || 50;
    scores[skill] = Math.round(basePct * 0.6 + assessPct * 0.4);
  });
  return scores;
}

/* §9 ── SKILL GAP ANALYZER ─────────────────────────────────────── */
function initSkillGap() {
  const currentSkills = Object.keys(state.assessmentScores).length
    ? { ...DEMO_STUDENT.skills, ...state.assessmentScores }
    : DEMO_STUDENT.skills;

  const req = ROLE_REQUIREMENTS[DEMO_STUDENT.role];
  const gaps = Object.entries(req).map(([skill, required]) => {
    const current = currentSkills[skill] || 0;
    const gap = Math.max(0, required - current);
    let status = 'mastered', color = 'green';
    if (gap > 25)      { status = 'critical';    color = 'red'; }
    else if (gap > 5)  { status = 'needs_work';  color = 'yellow'; }
    return { skill, current, required, gap, status, color };
  }).sort((a,b) => b.gap - a.gap);

  state.skillGaps = gaps;
  state.journeyProgress.gap_analysis = true;
  saveJourney();

  const biggest = gaps.find(g => g.gap > 0);
  document.getElementById('gap-insight-text').innerHTML = biggest
    ? `Your biggest skill gap is <strong>${biggest.skill}</strong> — you are at <strong>${biggest.current}%</strong> and your target role requires <strong>${biggest.required}%</strong> (gap: <strong style="color:var(--danger)">${biggest.gap} points</strong>).<br><span style="color:var(--muted2)">Capacity Connect will prioritize ${biggest.skill} in your personalized learning path.</span>`
    : 'All skills meet target requirements. Excellent!';

  document.getElementById('gap-grid').innerHTML = gaps.map(g => `
    <div class="gap-item">
      <div class="gap-item-header">
        <div class="gap-item-skill">${escHtml(g.skill)}</div>
        <div class="gap-item-status" style="color:${g.color==='green'?'var(--green)':g.color==='yellow'?'var(--warn)':'var(--danger)'}">
          ${g.status === 'mastered' ? '✓ Mastered' : g.status === 'critical' ? '🔴 Critical' : '🟡 Needs Work'}
        </div>
      </div>
      <div class="gap-bar-wrap">
        <div class="gap-bar-track">
          <div class="gap-bar-current ${g.color}" style="width:${Math.min(100, (g.current/g.required)*100)}%"></div>
          <div class="gap-bar-target-line" style="left:${g.required}%"></div>
        </div>
      </div>
      <div class="gap-item-scores">
        <span>Current: <strong>${g.current}%</strong></span>
        <span>Required: <strong>${g.required}%</strong></span>
        <span>Gap: <strong style="color:${g.gap>0?'var(--danger)':'var(--accent)'}">${g.gap > 0 ? '-'+g.gap : '✓ 0'}</strong></span>
      </div>
    </div>
  `).join('');

  // Push to API
  apiFetch(`${API}/skill-gap/analyze`, { method:'POST', body: JSON.stringify({ role: DEMO_STUDENT.role, current_skills: currentSkills }) }).catch(()=>{});
}

/* §10 ── LEARNING PATH ─────────────────────────────────────────── */
function initLearningPath() {
  const gaps = state.skillGaps.length ? state.skillGaps : Object.entries(ROLE_REQUIREMENTS[DEMO_STUDENT.role]).map(([skill,req]) => ({ skill, gap: Math.max(0, req - (DEMO_STUDENT.skills[skill]||0)) }));
  const gapBySkill = Object.fromEntries(gaps.map(g => [g.skill, g.gap]));

  // Sort modules by gap size
  const sortedModules = [...LEARNING_MODULES].sort((a, b) => (gapBySkill[b.skill]||0) - (gapBySkill[a.skill]||0));

  const completed = Object.values(state.moduleProgress).filter(Boolean).length;
  const pct = Math.round((completed / sortedModules.length) * 100);
  document.getElementById('path-pct').textContent = pct + '%';
  document.getElementById('path-summary-title').textContent = completed === 0
    ? 'Start with your biggest gap'
    : completed === sortedModules.length ? 'All modules complete!' : `${completed} of ${sortedModules.length} modules done`;

  document.getElementById('modules-list').innerHTML = sortedModules.map((m, idx) => {
    const gap = gapBySkill[m.skill] || 0;
    const done = !!state.moduleProgress[m.id];
    const gapBadge = gap > 0 ? `<span class="badge ${gap>25?'badge-red':gap>5?'badge-orange':'badge-green'}" style="margin-left:8px">Gap: ${gap}</span>` : `<span class="badge badge-accent" style="margin-left:8px">✓ Mastered</span>`;
    return `
    <div class="module-card ${done ? 'completed' : ''}" id="mc-${m.id}">
      <div class="module-card-header" onclick="toggleModule('${m.id}')">
        <div class="module-num">${done ? '✓' : (idx+1)}</div>
        <div class="module-info">
          <h4>${escHtml(m.title)} ${gapBadge}</h4>
          <div class="module-meta">
            <span>${m.difficulty}</span>
            <span>~${m.duration_hrs}h</span>
            <span>${m.skill}</span>
          </div>
        </div>
        <button class="btn ${done?'btn-ghost btn-sm':'btn-secondary btn-sm'}">${done ? '✓ Completed' : 'Expand'}</button>
      </div>
      <div class="module-body hidden" id="mb-${m.id}">
        <div class="module-body-inner">
          <p style="font-size:.88rem;color:var(--muted2);margin-bottom:16px">${escHtml(m.description)}</p>
          <div class="module-objectives">
            <h5>Learning Objectives</h5>
            <ul>${m.objectives.map(o => `<li>${escHtml(o)}</li>`).join('')}</ul>
          </div>
          <div class="module-resources">
            <h5>Resources</h5>
            ${m.resources.map(r => `<a href="${r.url}" target="_blank" rel="noopener" class="resource-link">↗ ${escHtml(r.title)}</a>`).join('')}
          </div>
          <button class="btn ${done?'btn-ghost':'btn-primary'} btn-sm" onclick="completeModule('${m.id}', this)" ${done?'disabled':''}>
            ${done ? '✓ Module Complete' : '✓ Mark as Complete'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleModule(id) {
  const body = document.getElementById('mb-' + id);
  if (body) body.classList.toggle('hidden');
}

function completeModule(id, btn) {
  state.moduleProgress[id] = true;
  state.journeyProgress.learning_path = true;
  saveJourney();
  btn.textContent = '✓ Module Complete';
  btn.disabled = true;
  btn.className = 'btn btn-ghost btn-sm';
  const card = document.getElementById('mc-' + id);
  if (card) { card.classList.add('completed'); card.querySelector('.module-num').textContent = '✓'; }
  // Update progress summary
  const done = Object.values(state.moduleProgress).filter(Boolean).length;
  const pct = Math.round((done / LEARNING_MODULES.length) * 100);
  document.getElementById('path-pct').textContent = pct + '%';
  document.getElementById('path-summary-title').textContent = `${done} of ${LEARNING_MODULES.length} modules done`;
  // Save to API
  apiFetch(`${API}/learning/progress`, { method:'POST', body: JSON.stringify({ module_id: id, score: 100 }) }).catch(()=>{});
}

/* §11 ── PROJECT ────────────────────────────────────────────────── */
const PROJECT_TASKS = [
  { id:'t1', label:'Create responsive HTML/CSS frontend with task list UI' },
  { id:'t2', label:'Build REST API with FastAPI (GET, POST, PUT, DELETE tasks)' },
  { id:'t3', label:'Connect PostgreSQL database via Supabase' },
  { id:'t4', label:'Implement full CRUD for tasks' },
  { id:'t5', label:'Add JWT authentication for protected routes' }
];

const SKILL_TAGS = ['HTML','CSS','JavaScript','Python','FastAPI','SQL','REST API','Authentication'];
const EVAL_CRITERIA = ['Working CRUD endpoints (all 4 methods)','JWT authentication implemented','Database connected and persisting data','Responsive UI on mobile and desktop','Clean, readable code structure'];

function initProject() {
  // Skills
  document.getElementById('project-skills').innerHTML = SKILL_TAGS.map(s => `<span class="badge badge-accent">${s}</span>`).join('');
  // Tasks
  document.getElementById('task-list').innerHTML = PROJECT_TASKS.map(t => `
    <div class="task-item ${state.projectTasks[t.id] ? 'done' : ''}" id="ti-${t.id}" onclick="toggleTask('${t.id}')">
      <div class="task-check">${state.projectTasks[t.id] ? '✓' : ''}</div>
      <span>${escHtml(t.label)}</span>
    </div>
  `).join('');
  // Eval criteria
  document.getElementById('eval-criteria-list').innerHTML = EVAL_CRITERIA.map(c => `<li>${escHtml(c)}</li>`).join('');
  updateProjectProgress();
}

function toggleTask(id) {
  state.projectTasks[id] = !state.projectTasks[id];
  const item = document.getElementById('ti-' + id);
  if (item) {
    item.classList.toggle('done', state.projectTasks[id]);
    item.querySelector('.task-check').textContent = state.projectTasks[id] ? '✓' : '';
  }
  updateProjectProgress();
}

function updateProjectProgress() {
  const done = Object.values(state.projectTasks).filter(Boolean).length;
  const total = PROJECT_TASKS.length;
  const pct = Math.round((done / total) * 100);
  const bar = document.getElementById('proj-progress-bar');
  const txt = document.getElementById('proj-progress-text');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = `${done} of ${total} tasks completed · ${pct}%`;
}

/* §12 ── PRACTICAL ASSESSMENT ──────────────────────────────────── */
function initPractical() {
  state.practicalAnswers = {};
  document.getElementById('practical-in-progress').classList.remove('hidden');
  document.getElementById('practical-result').classList.add('hidden');

  const letters = ['A','B','C','D'];
  document.getElementById('practical-questions').innerHTML = PRACTICAL_QUESTIONS.map((q, qi) => `
    <div class="practical-question-card">
      <div class="badge badge-blue mb-16">Q${qi+1} · ${q.skill}</div>
      <div class="scenario-box">
        <strong>Scenario</strong>
        ${escHtml(q.scenario)}
      </div>
      <div class="question-text" style="font-size:1rem">${escHtml(q.question)}</div>
      <div class="options-list" style="margin-top:16px">
        ${q.options.map((opt, i) => `
          <button class="option-btn" onclick="selectPractical('${q.id}', ${i}, this)">
            <span class="option-letter">${letters[i]}</span>
            ${escHtml(opt)}
          </button>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function selectPractical(qId, optIdx, btn) {
  state.practicalAnswers[qId] = optIdx;
  // Deselect siblings in same question
  btn.closest('.practical-question-card').querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

/* §13 ── SKILL PASSPORT ────────────────────────────────────────── */
const PASSPORT_DATA = {
  verified_skills: [
    { skill:'JavaScript', score:82, verified:true,  trend:'+10' },
    { skill:'Python',     score:76, verified:true,  trend:'+11' },
    { skill:'SQL',        score:68, verified:false, trend:'+20' },
    { skill:'REST API',   score:78, verified:true,  trend:'+38' },
    { skill:'Git',        score:84, verified:true,  trend:'+9'  },
    { skill:'FastAPI',    score:72, verified:false, trend:'+27' },
    { skill:'HTML',       score:90, verified:true,  trend:'+0'  },
    { skill:'CSS',        score:85, verified:true,  trend:'+0'  }
  ],
  projects:       ['Full Stack Task Manager (85/100)'],
  certifications: ['Backend Development Certificate · CC-DEMO0001'],
  competencies:   ['REST API Development','Backend Development']
};

function initPassport() {
  state.journeyProgress.passport = true;
  saveJourney();

  document.getElementById('passport-name').textContent = DEMO_STUDENT.name;
  document.getElementById('passport-role').textContent = DEMO_STUDENT.role;

  document.getElementById('passport-skills').innerHTML = PASSPORT_DATA.verified_skills.map(s => `
    <div class="passport-skill-item ${s.verified ? 'verified' : ''}">
      <div class="passport-skill-name">${escHtml(s.skill)}</div>
      <div class="passport-skill-score ${s.verified ? 'verified' : ''}">${s.score}%</div>
      <div class="passport-skill-check">${s.verified ? '<span class="badge badge-green" style="font-size:.6rem;padding:2px 6px">✓</span>' : ''}</div>
    </div>
  `).join('');

  document.getElementById('passport-projects').innerHTML = PASSPORT_DATA.projects.map(p => `<div class="passport-tag">✓ ${escHtml(p)}</div>`).join('');
  document.getElementById('passport-certs').innerHTML = PASSPORT_DATA.certifications.map(c => `<div class="passport-tag">🏅 ${escHtml(c)}</div>`).join('');
  document.getElementById('passport-competencies').innerHTML = PASSPORT_DATA.competencies.map(c => `<div class="passport-tag">⭐ ${escHtml(c)}</div>`).join('');

  // Fetch from API too
  apiFetch(`${API}/skill-passport?demo=true`).catch(()=>{});
}

/* §14 ── OPPORTUNITIES ─────────────────────────────────────────── */
const EFFECTIVENESS_DATA = [
  { skill:'REST API',   before:40, after:78, improvement:38 },
  { skill:'SQL',        before:48, after:68, improvement:20 },
  { skill:'FastAPI',    before:45, after:72, improvement:27 },
  { skill:'JavaScript', before:72, after:82, improvement:10 },
  { skill:'Python',     before:65, after:76, improvement:11 }
];

function initOpportunities() {
  const currentSkills = Object.keys(state.assessmentScores).length
    ? { ...DEMO_STUDENT.skills, ...state.assessmentScores }
    : DEMO_STUDENT.skills;

  const matches = OPPORTUNITIES_DATA.map(opp => {
    const metSkills     = opp.required_skills.filter(r => (currentSkills[r.skill]||0) >= r.level).map(r => r.skill);
    const missingSkills = opp.required_skills.filter(r => (currentSkills[r.skill]||0) < r.level);
    // Partial credit
    let matchScore = 0;
    opp.required_skills.forEach(r => {
      const cur = currentSkills[r.skill] || 0;
      matchScore += Math.min(1, cur / r.level);
    });
    const matchPct = Math.round((matchScore / opp.required_skills.length) * 100);
    const nextMissing = missingSkills.sort((a,b) => b.level - a.level)[0];
    return { ...opp, matchPct, metSkills, missingSkills: missingSkills.map(r=>r.skill), nextSkillTip: nextMissing ? `Learn ${nextMissing.skill} to increase your match to ${Math.min(99,matchPct+10)}%` : null };
  }).sort((a,b) => b.matchPct - a.matchPct);

  document.getElementById('opportunities-grid').innerHTML = matches.map(m => `
    <div class="opp-card ${m.matchPct >= 80 ? 'strong-match' : ''}">
      <div class="opp-match-pct ${m.matchPct>=80?'strong':m.matchPct>=60?'medium':''}">${m.matchPct}%</div>
      <div class="opp-match-bar"><div class="opp-match-fill" style="width:${m.matchPct}%"></div></div>
      <div class="badge badge-blue" style="font-size:.64rem">${m.type.toUpperCase()}</div>
      <div class="opp-title">${escHtml(m.title)}</div>
      <div class="opp-company">${escHtml(m.company)}</div>
      <div class="opp-skills">
        ${m.metSkills.map(s=>`<span class="opp-skill-tag met">✓ ${s}</span>`).join('')}
        ${m.missingSkills.map(s=>`<span class="opp-skill-tag missing">✗ ${s}</span>`).join('')}
      </div>
      ${m.nextSkillTip ? `<div class="opp-tip">💡 ${escHtml(m.nextSkillTip)}</div>` : ''}
    </div>
  `).join('');

  // Effectiveness
  document.getElementById('eff-score').textContent = '84';
  document.getElementById('eff-improvements').innerHTML = EFFECTIVENESS_DATA.map(e => `
    <div class="eff-row">
      <div class="eff-skill">${e.skill}</div>
      <div class="eff-before">${e.before}</div>
      <div class="eff-bar">
        <div class="progress-wrap thin">
          <div class="progress-fill" style="width:${e.after}%"></div>
        </div>
      </div>
      <div class="eff-after">${e.after}</div>
      <div class="eff-gain">+${e.improvement}</div>
    </div>
  `).join('');

  apiFetch(`${API}/opportunities/match`, { method:'POST', body: JSON.stringify({ skills: currentSkills }) }).catch(()=>{});
}

/* §15 ── TRAINER DASHBOARD ─────────────────────────────────────── */
function initTrainer() {
  renderLearners();
  renderProjectReviews();
  renderTrainerFeedback('All');
  renderTrainerQuality();
  renderTrainerCourses();
  renderCompetencyMap();
  wireStars();
}

/* Toast notification utility */
function showToast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

/* 1. MY LEARNERS */
function renderLearners() {
  const container = document.getElementById('learner-cards-container');
  if (!container) return;

  const search = (document.getElementById('learner-search')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('learner-status-filter')?.value || 'All';
  const roleFilter = document.getElementById('learner-role-filter')?.value || 'All';
  const sortBy = document.getElementById('learner-sort')?.value || 'readiness';

  let list = [...TRAINER_LEARNERS];

  if (search) {
    list = list.filter(l => l.name.toLowerCase().includes(search) || l.role.toLowerCase().includes(search));
  }
  if (statusFilter !== 'All') {
    list = list.filter(l => l.status === statusFilter);
  }
  if (roleFilter !== 'All') {
    list = list.filter(l => l.role === roleFilter);
  }

  if (sortBy === 'readiness') {
    list.sort((a, b) => b.readiness - a.readiness);
  } else if (sortBy === 'progress') {
    list.sort((a, b) => b.progress - a.progress);
  } else if (sortBy === 'name') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (list.length === 0) {
    container.innerHTML = '<div class="panel" style="grid-column:1/-1;text-align:center;color:var(--muted)">No learners match your search criteria.</div>';
    return;
  }

  container.innerHTML = list.map(l => `
    <div class="learner-card">
      <div>
        <div class="learner-card-header">
          <div class="learner-avatar">${escHtml(l.avatar)}</div>
          <div class="learner-card-info">
            <h4>${escHtml(l.name)}</h4>
            <p>${escHtml(l.role)}</p>
          </div>
          <span class="badge ${l.status === 'Active' ? 'badge-green' : 'badge-orange'}" style="margin-left:auto;font-size:.7rem">${escHtml(l.status)}</span>
        </div>
        <div class="learner-metrics" style="margin-top:14px">
          <div class="learner-metric-item">
            <small>Skill Readiness</small>
            <strong style="color:${l.readiness >= 80 ? 'var(--accent)' : 'var(--warn)'}">${l.readiness}%</strong>
          </div>
          <div class="learner-metric-item">
            <small>Learning Progress</small>
            <strong>${l.progress}%</strong>
          </div>
        </div>
        <div class="learner-focus-tag mt-12">
          <span>🎯 Current Focus:</span>
          <strong style="color:var(--text)">${escHtml(l.focus)}</strong>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:12px;border-top:1px solid var(--border)">
        <small style="color:var(--muted);font-size:.75rem">Active: ${escHtml(l.lastActive)}</small>
        <button class="btn btn-secondary btn-sm" onclick="openLearnerProfileModal('${l.id}')">View Profile</button>
      </div>
    </div>
  `).join('');
}

function openLearnerProfileModal(learnerId) {
  const learner = TRAINER_LEARNERS.find(l => l.id === learnerId);
  if (!learner) return;

  const content = document.getElementById('learner-profile-content');
  if (!content) return;

  const req = ROLE_REQUIREMENTS[learner.role] || {};

  content.innerHTML = `
    <div class="flex align-center gap-16 mb-20">
      <div class="learner-avatar" style="width:56px;height:56px;font-size:1.2rem">${escHtml(learner.avatar)}</div>
      <div>
        <h3 style="margin:0">${escHtml(learner.name)}</h3>
        <p style="margin:2px 0 0;color:var(--muted);font-size:.85rem">${escHtml(learner.role)} · <span class="badge ${learner.status === 'Active' ? 'badge-green' : 'badge-orange'}">${escHtml(learner.status)}</span></p>
      </div>
    </div>

    <div class="stats-grid mb-20" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card"><small>Readiness</small><strong style="color:var(--accent)">${learner.readiness}%</strong></div>
      <div class="stat-card"><small>Progress</small><strong>${learner.progress}%</strong></div>
      <div class="stat-card"><small>Skill Gaps</small><strong style="color:var(--danger)">${learner.gapsCount}</strong></div>
      <div class="stat-card"><small>Last Active</small><strong style="font-size:.85rem">${escHtml(learner.lastActive)}</strong></div>
    </div>

    <div class="panel mb-16">
      <h4 class="mb-12">Skill Breakdown vs Required</h4>
      <div style="display:grid;gap:10px">
        ${Object.entries(learner.skills).map(([sk, cur]) => {
          const target = req[sk] || 70;
          const isGap = cur < target;
          return `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:4px">
                <span>${escHtml(sk)}</span>
                <span>Current: <strong>${cur}%</strong> / Target: ${target}% ${isGap ? `<span style="color:var(--danger)">(Gap: -${target - cur})</span>` : '<span style="color:var(--green)">✓</span>'}</span>
              </div>
              <div class="progress-wrap thin"><div class="progress-fill ${isGap ? 'yellow' : ''}" style="width:${cur}%"></div></div>
            </div>`;
        }).join('')}
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="mb-16">
      <div class="panel">
        <h5 class="mb-8">Completed Modules</h5>
        <ul style="padding-left:16px;font-size:.82rem;color:var(--muted2);margin:0">
          ${learner.completedModules.map(m => `<li>${escHtml(m)}</li>`).join('')}
        </ul>
      </div>
      <div class="panel">
        <h5 class="mb-8">Status & Verification</h5>
        <div style="font-size:.82rem;color:var(--muted2);display:grid;gap:6px">
          <div>Project: <strong>${escHtml(learner.currentProject)}</strong></div>
          <div>Practical: <strong>${escHtml(learner.practicalStatus)}</strong></div>
          <div>Competency: <strong>${escHtml(learner.competencyStatus)}</strong></div>
        </div>
      </div>
    </div>

    <div style="text-align:right">
      <button class="btn btn-secondary" onclick="closeModal('modal-learner-profile')">Close</button>
    </div>
  `;

  openModal('modal-learner-profile');
}

/* 2. PROJECT REVIEWS */
function renderProjectReviews() {
  const container = document.getElementById('project-review-list');
  if (!container) return;

  if (PROJECT_REVIEWS_DATA.length === 0) {
    container.innerHTML = '<div class="panel" style="text-align:center;color:var(--muted)">No projects pending review.</div>';
    return;
  }

  container.innerHTML = PROJECT_REVIEWS_DATA.map(p => `
    <div class="project-review-card panel mb-16">
      <div class="flex justify-between align-center flex-wrap gap-12 mb-12">
        <div>
          <span class="badge ${p.status === 'Pending Review' ? 'badge-orange' : p.status === 'Reviewed' ? 'badge-green' : 'badge-red'}">${escHtml(p.status)}</span>
          <h4 style="margin:6px 0 2px">${escHtml(p.learner)} — ${escHtml(p.project)}</h4>
          <small style="color:var(--muted)">Submitted ${escHtml(p.submitted)} · Completion: ${p.completion}%</small>
        </div>
        <div>
          <button class="btn ${p.status === 'Pending Review' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="openProjectReviewModal('${p.id}')">
            ${p.status === 'Pending Review' ? 'Review Project' : 'View / Edit Review'}
          </button>
        </div>
      </div>
      <p style="font-size:.85rem;color:var(--muted2);margin-bottom:12px">${escHtml(p.description)}</p>
      <div class="flex gap-6 flex-wrap">
        ${p.technologies.map(t => `<span class="badge badge-accent" style="font-size:.72rem">${escHtml(t)}</span>`).join('')}
      </div>
      ${p.status !== 'Pending Review' ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:.82rem">
          Overall Score: <strong style="color:var(--accent)">${p.overallScore}/100</strong>
          ${p.feedback ? ` · <span style="color:var(--muted2)">"${escHtml(p.feedback)}"</span>` : ''}
        </div>
      ` : ''}
    </div>
  `).join('');
}

function openProjectReviewModal(projId) {
  const proj = PROJECT_REVIEWS_DATA.find(p => p.id === projId);
  if (!proj) return;

  const content = document.getElementById('project-review-content');
  if (!content) return;

  content.innerHTML = `
    <div class="mb-16">
      <span class="eyebrow">PROJECT EVALUATION</span>
      <h3 style="margin:4px 0">${escHtml(proj.project)}</h3>
      <p style="font-size:.85rem;color:var(--muted)">Submitted by <strong>${escHtml(proj.learner)}</strong> · ${escHtml(proj.submitted)}</p>
    </div>

    <div class="review-modal-grid">
      <div class="panel">
        <h5 class="mb-12">Submission Details</h5>
        <p style="font-size:.82rem;color:var(--muted2);margin-bottom:12px">${escHtml(proj.description)}</p>
        <div class="mb-12">
          <small style="color:var(--muted);display:block;margin-bottom:4px">Technologies Used:</small>
          <div class="flex gap-6 flex-wrap">
            ${proj.technologies.map(t => `<span class="badge badge-blue">${escHtml(t)}</span>`).join('')}
          </div>
        </div>
        <div>
          <small style="color:var(--muted);display:block;margin-bottom:4px">Links:</small>
          <a href="https://github.com" target="_blank" rel="noopener" class="resource-link" style="font-size:.8rem">↗ GitHub Repository</a>
          <a href="https://vercel.app" target="_blank" rel="noopener" class="resource-link" style="font-size:.8rem;margin-left:8px">↗ Live Demo</a>
        </div>
      </div>

      <div class="panel">
        <h5 class="mb-12">Evaluation Criteria</h5>
        
        <div class="criteria-input-row">
          <label>Functionality</label>
          <input type="range" id="rev-func" min="0" max="100" value="${proj.criteria.functionality}" oninput="updateReviewOverallScore('${proj.id}')">
          <span class="criteria-score-val" id="val-func">${proj.criteria.functionality}%</span>
        </div>

        <div class="criteria-input-row">
          <label>Code Quality</label>
          <input type="range" id="rev-code" min="0" max="100" value="${proj.criteria.codeQuality}" oninput="updateReviewOverallScore('${proj.id}')">
          <span class="criteria-score-val" id="val-code">${proj.criteria.codeQuality}%</span>
        </div>

        <div class="criteria-input-row">
          <label>UI / UX</label>
          <input type="range" id="rev-ui" min="0" max="100" value="${proj.criteria.uiUx}" oninput="updateReviewOverallScore('${proj.id}')">
          <span class="criteria-score-val" id="val-ui">${proj.criteria.uiUx}%</span>
        </div>

        <div class="criteria-input-row">
          <label>API Integration</label>
          <input type="range" id="rev-api" min="0" max="100" value="${proj.criteria.apiIntegration}" oninput="updateReviewOverallScore('${proj.id}')">
          <span class="criteria-score-val" id="val-api">${proj.criteria.apiIntegration}%</span>
        </div>

        <div class="criteria-input-row">
          <label>Security</label>
          <input type="range" id="rev-sec" min="0" max="100" value="${proj.criteria.security}" oninput="updateReviewOverallScore('${proj.id}')">
          <span class="criteria-score-val" id="val-sec">${proj.criteria.security}%</span>
        </div>

        <div style="background:var(--bg3);padding:12px;border-radius:var(--radius-sm);margin:16px 0;display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700">Calculated Overall Score:</span>
          <span style="font-size:1.2rem;font-weight:900;color:var(--accent)" id="val-overall">${proj.overallScore} / 100</span>
        </div>

        <div class="modal-form-row">
          <label>Feedback & Comments for Learner</label>
          <textarea id="rev-feedback" rows="3" placeholder="Write feedback on strengths, areas to improve, and code quality...">${escHtml(proj.feedback || 'Strong implementation. Good API architecture and clean code structure.')}</textarea>
        </div>

        <div class="flex gap-8 mt-16">
          <button class="btn btn-primary btn-full" onclick="submitProjectReview('${proj.id}', 'Reviewed')">Approve Project</button>
          <button class="btn btn-secondary btn-full" onclick="submitProjectReview('${proj.id}', 'Changes Requested')">Request Changes</button>
        </div>
      </div>
    </div>
  `;

  openModal('modal-project-review');
}

function updateReviewOverallScore(projId) {
  const func = parseInt(document.getElementById('rev-func')?.value || 0);
  const code = parseInt(document.getElementById('rev-code')?.value || 0);
  const ui   = parseInt(document.getElementById('rev-ui')?.value || 0);
  const api  = parseInt(document.getElementById('rev-api')?.value || 0);
  const sec  = parseInt(document.getElementById('rev-sec')?.value || 0);

  document.getElementById('val-func').textContent = func + '%';
  document.getElementById('val-code').textContent = code + '%';
  document.getElementById('val-ui').textContent   = ui + '%';
  document.getElementById('val-api').textContent  = api + '%';
  document.getElementById('val-sec').textContent = sec + '%';

  const overall = Math.round((func + code + ui + api + sec) / 5);
  document.getElementById('val-overall').textContent = overall + ' / 100';
}

function submitProjectReview(projId, newStatus) {
  const proj = PROJECT_REVIEWS_DATA.find(p => p.id === projId);
  if (!proj) return;

  const func = parseInt(document.getElementById('rev-func')?.value || 0);
  const code = parseInt(document.getElementById('rev-code')?.value || 0);
  const ui   = parseInt(document.getElementById('rev-ui')?.value || 0);
  const api  = parseInt(document.getElementById('rev-api')?.value || 0);
  const sec  = parseInt(document.getElementById('rev-sec')?.value || 0);
  const feedback = document.getElementById('rev-feedback')?.value.trim() || '';

  proj.criteria = { functionality: func, codeQuality: code, uiUx: ui, apiIntegration: api, security: sec };
  proj.overallScore = Math.round((func + code + ui + api + sec) / 5);
  proj.status = newStatus;
  proj.feedback = feedback;

  closeModal('modal-project-review');
  renderProjectReviews();
  showToast(`Project ${newStatus === 'Reviewed' ? 'Approved (Score: ' + proj.overallScore + '/100)' : 'marked as Changes Requested'}`, newStatus === 'Reviewed' ? 'success' : 'info');
}

/* 3. FEEDBACK */
let currentFeedbackFilter = 'All';

function filterTrainerFeedback(filter, btn) {
  currentFeedbackFilter = filter;
  document.querySelectorAll('.feedback-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTrainerFeedback(filter);
}

function renderTrainerFeedback(filter = 'All') {
  const container = document.getElementById('feedback-list-container');
  if (!container) return;

  let list = [...TRAINER_FEEDBACK_DATA];

  if (filter === '5 Stars') list = list.filter(f => f.rating === 5);
  if (filter === '4 Stars') list = list.filter(f => f.rating === 4);
  if (filter === '3 Stars') list = list.filter(f => f.rating === 3);
  if (filter === 'Needs Attention') list = list.filter(f => f.rating < 4);

  if (list.length === 0) {
    container.innerHTML = '<div class="panel" style="text-align:center;color:var(--muted)">No feedback found for this filter.</div>';
    return;
  }

  container.innerHTML = list.map(f => `
    <div class="panel mb-16">
      <div class="flex justify-between align-center mb-8 flex-wrap gap-8">
        <div>
          <strong>${escHtml(f.learner)}</strong>
          <small style="color:var(--muted);margin-left:8px">${escHtml(f.date)}</small>
        </div>
        <div style="color:#f59e0b;font-size:1rem">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</div>
      </div>
      <p style="font-size:.88rem;color:var(--muted2);margin-bottom:12px">"${escHtml(f.comment)}"</p>
      ${f.response ? `
        <div style="background:var(--bg3);padding:10px 14px;border-radius:var(--radius-sm);font-size:.82rem;border-left:3px solid var(--accent)">
          <strong style="color:var(--accent)">Your Response:</strong> "${escHtml(f.response)}"
        </div>
      ` : `
        <button class="btn btn-secondary btn-sm" onclick="openFeedbackRespondModal('${f.id}')">💬 Respond</button>
      `}
    </div>
  `).join('');
}

function openFeedbackRespondModal(fbId) {
  const item = TRAINER_FEEDBACK_DATA.find(f => f.id === fbId);
  if (!item) return;

  const content = document.getElementById('feedback-respond-content');
  if (!content) return;

  content.innerHTML = `
    <h4 class="mb-12">Respond to ${escHtml(item.learner)}</h4>
    <div class="panel mb-16" style="background:var(--bg3);padding:14px">
      <div style="color:#f59e0b;font-size:1rem;margin-bottom:4px">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</div>
      <p style="font-size:.85rem;color:var(--muted2);margin:0">"${escHtml(item.comment)}"</p>
    </div>
    <div class="modal-form-row">
      <label>Your Response</label>
      <textarea id="resp-text" rows="3" placeholder="Write a supportive response or answer their questions..."></textarea>
    </div>
    <div class="flex gap-8">
      <button class="btn btn-primary btn-full" onclick="submitFeedbackResponse('${item.id}')">Send Response</button>
    </div>
  `;

  openModal('modal-feedback-respond');
}

function submitFeedbackResponse(fbId) {
  const item = TRAINER_FEEDBACK_DATA.find(f => f.id === fbId);
  const resp = document.getElementById('resp-text')?.value.trim();
  if (!item || !resp) {
    showToast('Please enter a response message.', 'error');
    return;
  }
  item.response = resp;
  closeModal('modal-feedback-respond');
  renderTrainerFeedback(currentFeedbackFilter);
  showToast(`Response sent to ${item.learner}!`, 'success');
}

/* 4. TRAINER QUALITY */
function renderTrainerQuality() {
  // Static visual rendering already in HTML
}

/* 5. MY COURSES */
function renderTrainerCourses() {
  const container = document.getElementById('trainer-course-list');
  if (!container) return;

  if (TRAINER_COURSES_DATA.length === 0) {
    container.innerHTML = '<div class="panel" style="text-align:center;color:var(--muted)">No courses created yet.</div>';
    return;
  }

  container.innerHTML = TRAINER_COURSES_DATA.map(c => `
    <div class="course-card-trainer">
      <div>
        <span class="badge ${c.status === 'Published' ? 'badge-green' : 'badge-orange'}">${escHtml(c.status)}</span>
        <h4 style="margin:6px 0 2px">${escHtml(c.title)}</h4>
        <p>${escHtml(c.description)}</p>
        <div class="course-meta">
          Category: ${escHtml(c.category)} · ${c.learners} Learners · ${c.modulesCount} Modules · Avg Rating: ${c.rating} ★ · Completion: ${c.completion}%
        </div>
      </div>
      <div class="course-actions">
        <button class="btn btn-secondary btn-sm" onclick="openCourseViewModal('${c.id}')">View</button>
        <button class="btn btn-secondary btn-sm" onclick="openCourseEditModal('${c.id}')">Edit</button>
        <button class="btn btn-primary btn-sm" onclick="openCourseManageModal('${c.id}')">Manage Content</button>
      </div>
    </div>
  `).join('');
}

function openCourseViewModal(courseId) {
  const course = TRAINER_COURSES_DATA.find(c => c.id === courseId);
  if (!course) return;

  const content = document.getElementById('course-view-content');
  if (!content) return;

  content.innerHTML = `
    <div class="mb-16">
      <span class="badge ${course.status === 'Published' ? 'badge-green' : 'badge-orange'} mb-8">${escHtml(course.status)}</span>
      <h3 style="margin:4px 0">${escHtml(course.title)}</h3>
      <p style="color:var(--muted);font-size:.85rem">${escHtml(course.category)} · Instructor: <strong>${escHtml(course.instructor)}</strong></p>
    </div>

    <div class="stats-grid mb-20" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card"><small>Enrolled Learners</small><strong>${course.learners}</strong></div>
      <div class="stat-card"><small>Completion Rate</small><strong style="color:var(--accent)">${course.completion}%</strong></div>
      <div class="stat-card"><small>Rating</small><strong style="color:#f59e0b">${course.rating} ★</strong></div>
      <div class="stat-card"><small>Total Modules</small><strong>${course.modules.length}</strong></div>
    </div>

    <div class="panel mb-16">
      <h5 class="mb-8">Course Description</h5>
      <p style="font-size:.85rem;color:var(--muted2);margin:0">${escHtml(course.description)}</p>
    </div>

    <div class="panel mb-16">
      <h5 class="mb-8">Learning Objectives</h5>
      <ul style="padding-left:18px;font-size:.82rem;color:var(--muted2);margin:0">
        ${course.objectives.map(o => `<li>${escHtml(o)}</li>`).join('')}
      </ul>
    </div>

    <div class="panel mb-16">
      <h5 class="mb-8">Course Curriculum / Modules</h5>
      <div style="display:grid;gap:8px">
        ${course.modules.map(m => `
          <div style="display:flex;justify-content:space-between;padding:10px 14px;background:var(--bg3);border-radius:var(--radius-sm);font-size:.85rem">
            <span>${escHtml(m.title)}</span>
            <small style="color:var(--muted)">${escHtml(m.duration)}</small>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="text-align:right">
      <button class="btn btn-secondary" onclick="closeModal('modal-course-view')">Close</button>
    </div>
  `;

  openModal('modal-course-view');
}

function openCourseManageModal(courseId) {
  const course = TRAINER_COURSES_DATA.find(c => c.id === courseId);
  if (!course) return;

  const content = document.getElementById('course-manage-content');
  if (!content) return;

  content.innerHTML = `
    <div class="mb-16">
      <span class="eyebrow">CONTENT MANAGEMENT</span>
      <h3 style="margin:4px 0">${escHtml(course.title)}</h3>
      <p style="font-size:.85rem;color:var(--muted)">Add or edit modules, hands-on exercises, and external learning resources.</p>
    </div>

    <div class="panel mb-16">
      <div class="flex justify-between align-center mb-12">
        <h5 style="margin:0">Modules List (${course.modules.length})</h5>
        <button class="btn btn-secondary btn-sm" onclick="addCourseModulePrompt('${course.id}')">+ Add Module</button>
      </div>
      <div style="display:grid;gap:8px">
        ${course.modules.map((m, idx) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg3);border-radius:var(--radius-sm);font-size:.85rem">
            <div>
              <strong>${escHtml(m.title)}</strong>
              <small style="color:var(--muted);margin-left:8px">(${escHtml(m.duration)})</small>
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteCourseModule('${course.id}', ${idx})">Delete</button>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="panel mb-16">
      <div class="flex justify-between align-center mb-12">
        <h5 style="margin:0">Resources (${course.resources.length})</h5>
        <button class="btn btn-secondary btn-sm" onclick="addCourseResourcePrompt('${course.id}')">+ Add Resource</button>
      </div>
      <div style="display:grid;gap:8px">
        ${course.resources.map((r, idx) => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg3);border-radius:var(--radius-sm);font-size:.85rem">
            <div>
              <strong>${escHtml(r.title)}</strong>
              <small style="color:var(--muted);margin-left:8px">(${escHtml(r.type)})</small>
            </div>
            <a href="${r.url}" target="_blank" rel="noopener" class="resource-link" style="font-size:.8rem">↗ Link</a>
          </div>
        `).join('')}
      </div>
    </div>

    <div style="text-align:right">
      <button class="btn btn-primary" onclick="closeModal('modal-course-manage')">Done</button>
    </div>
  `;

  openModal('modal-course-manage');
}

function addCourseModulePrompt(courseId) {
  const title = prompt('Enter module title (e.g. 5. Advanced Practice):');
  if (!title) return;
  const duration = prompt('Enter estimated duration (e.g. 1h 15m):') || '1h';

  const course = TRAINER_COURSES_DATA.find(c => c.id === courseId);
  if (course) {
    course.modules.push({ title, duration });
    course.modulesCount = course.modules.length;
    openCourseManageModal(courseId);
    renderTrainerCourses();
    showToast('Module added successfully!', 'success');
  }
}

function deleteCourseModule(courseId, modIdx) {
  const course = TRAINER_COURSES_DATA.find(c => c.id === courseId);
  if (course && course.modules[modIdx]) {
    course.modules.splice(modIdx, 1);
    course.modulesCount = course.modules.length;
    openCourseManageModal(courseId);
    renderTrainerCourses();
    showToast('Module deleted', 'info');
  }
}

function addCourseResourcePrompt(courseId) {
  const title = prompt('Enter resource title (e.g. FastAPI Cheat Sheet):');
  if (!title) return;
  const url = prompt('Enter URL (e.g. https://fastapi.tiangolo.com):') || 'https://example.com';

  const course = TRAINER_COURSES_DATA.find(c => c.id === courseId);
  if (course) {
    course.resources.push({ title, type: 'external', url });
    openCourseManageModal(courseId);
    renderTrainerCourses();
    showToast('Resource added!', 'success');
  }
}

function openCreateCourseModal() {
  const content = document.getElementById('course-form-content');
  if (!content) return;

  content.innerHTML = `
    <h4 class="mb-16">Create New Course</h4>
    <div class="modal-form-row">
      <label>Course Title</label>
      <input type="text" id="new-course-title" placeholder="e.g. Advanced Microservices with FastAPI">
    </div>
    <div class="modal-form-row">
      <label>Category</label>
      <input type="text" id="new-course-cat" placeholder="e.g. Backend Development">
    </div>
    <div class="modal-form-row">
      <label>Description</label>
      <textarea id="new-course-desc" rows="3" placeholder="What will students learn in this course?"></textarea>
    </div>
    <button class="btn btn-primary btn-full" onclick="saveNewCourse()">Publish Course</button>
  `;

  openModal('modal-course-form');
}

function saveNewCourse() {
  const title = document.getElementById('new-course-title')?.value.trim();
  const cat   = document.getElementById('new-course-cat')?.value.trim() || 'Backend Development';
  const desc  = document.getElementById('new-course-desc')?.value.trim() || 'Comprehensive course on modern backend architecture.';

  if (!title) {
    showToast('Please enter a course title.', 'error');
    return;
  }

  const newCourse = {
    id: 'tc_' + Date.now(),
    title: title,
    category: cat,
    instructor: 'Dr. Priya Sharma',
    learners: 0,
    modulesCount: 4,
    completion: 0,
    rating: 5.0,
    status: 'Published',
    description: desc,
    objectives: ['Master key domain skills', 'Build real-world hands-on exercises'],
    resources: [{ title: 'Course Guide', type: 'document', url: 'https://example.com' }],
    modules: [
      { title: '1. Course Overview', duration: '30m' },
      { title: '2. Fundamentals', duration: '1h' },
      { title: '3. Hands-on Practice', duration: '1h 30m' },
      { title: '4. Final Assessment', duration: '45m' }
    ]
  };

  TRAINER_COURSES_DATA.unshift(newCourse);
  closeModal('modal-course-form');
  renderTrainerCourses();
  showToast(`Course "${title}" created and published!`, 'success');
}

function openCourseEditModal(courseId) {
  showToast('Course content management opened.', 'info');
  openCourseManageModal(courseId);
}

/* 6. COMPETENCY MAP */
function calculateCompetencyMatches() {
  return TRAINER_LEARNERS.map(l => {
    const req = ROLE_REQUIREMENTS[l.role] || {};
    const gaps = [];
    
    Object.entries(req).forEach(([sk, reqVal]) => {
      const curVal = l.skills[sk] || 0;
      if (curVal < reqVal) {
        gaps.push({ skill: sk, current: curVal, required: reqVal, gap: reqVal - curVal });
      }
    });

    let totalScore = 0;
    let count = 0;

    gaps.forEach(g => {
      const exp = TRAINER_EXPERTISE[g.skill] || 70;
      totalScore += exp;
      count++;
    });

    const matchPct = count > 0 ? Math.round(totalScore / count) : 90;
    let badgeClass = 'strong';
    let matchText = 'Strong Match';

    if (matchPct < 60) {
      badgeClass = 'low';
      matchText = 'Low Match';
    } else if (matchPct < 80) {
      badgeClass = 'good';
      matchText = 'Good Match';
    }

    return {
      learner: l,
      gaps: gaps,
      matchPct: matchPct,
      matchBadge: badgeClass,
      matchText: matchText
    };
  }).sort((a, b) => b.matchPct - a.matchPct);
}

function renderCompetencyMap() {
  const container = document.getElementById('competency-match-list');
  if (!container) return;

  const matches = calculateCompetencyMatches();

  container.innerHTML = matches.map(m => `
    <div class="competency-flow-card">
      <div class="competency-flow-header">
        <div>
          <h4 style="margin:0">${escHtml(m.learner.name)}</h4>
          <small style="color:var(--muted)">Target Role: <strong>${escHtml(m.learner.role)}</strong> · Readiness: ${m.learner.readiness}%</small>
        </div>
        <span class="match-badge ${m.matchBadge}">${m.matchPct}% ${m.matchText}</span>
      </div>

      <div class="competency-flow-grid">
        <div class="flow-step-box">
          <small>Learner Skill Gaps</small>
          <div>
            ${m.gaps.map(g => `<span class="gap-chip teachable">${escHtml(g.skill)} (-${g.gap}pts)</span>`).join('')}
          </div>
        </div>
        <div class="competency-flow-arrow">➔</div>
        <div class="flow-step-box">
          <small>Trainer Expertise</small>
          <div>
            ${m.gaps.map(g => `<span class="gap-chip teachable">${escHtml(g.skill)}: ${TRAINER_EXPERTISE[g.skill] || 70}%</span>`).join('')}
          </div>
        </div>
        <div class="competency-flow-arrow">➔</div>
        <div class="flow-step-box" style="text-align:right">
          <small>Recommendation</small>
          <strong style="color:var(--accent);display:block;margin-bottom:6px">${m.matchPct}% Competency Overlap</strong>
          <button class="btn btn-primary btn-sm" onclick="openRecommendModal('${m.learner.id}')">Recommend Training</button>
        </div>
      </div>
    </div>
  `).join('');
}

function openRecommendModal(learnerId) {
  const learner = TRAINER_LEARNERS.find(l => l.id === learnerId);
  if (!learner) return;

  const content = document.getElementById('recommend-training-content');
  if (!content) return;

  const req = ROLE_REQUIREMENTS[learner.role] || {};
  const gaps = Object.entries(req).filter(([sk, rVal]) => (learner.skills[sk] || 0) < rVal).map(([sk]) => sk);

  content.innerHTML = `
    <h4 class="mb-12">Recommend Training for ${escHtml(learner.name)}</h4>
    <p style="font-size:.85rem;color:var(--muted2);margin-bottom:16px">
      Target Role: <strong>${escHtml(learner.role)}</strong> · Detected Gaps: ${gaps.join(', ')}
    </p>

    <div class="panel mb-16" style="background:var(--bg3);padding:14px">
      <h5 class="mb-8">Recommended Courses & Modules</h5>
      <ul style="padding-left:18px;font-size:.82rem;color:var(--text);margin:0">
        <li>REST API Fundamentals</li>
        <li>FastAPI Backend Development</li>
        <li>Authentication & Security</li>
      </ul>
    </div>

    <div class="modal-form-row">
      <label>Personalized Recommendation Note</label>
      <textarea id="rec-note" rows="3" placeholder="Write a note to ${escHtml(learner.name)} explaining why these courses will bridge their gaps..."></textarea>
    </div>

    <button class="btn btn-primary btn-full" onclick="sendRecommendation('${learner.id}')">Send Recommendation</button>
  `;

  openModal('modal-recommend-training');
}

function sendRecommendation(learnerId) {
  const learner = TRAINER_LEARNERS.find(l => l.id === learnerId);
  closeModal('modal-recommend-training');
  showToast(`Training recommendations successfully sent to ${learner ? learner.name : 'learner'}!`, 'success');
}

function wireStars() {
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.star);
      state.starRating = val;
      document.querySelectorAll('.star-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.star) <= val);
      });
    });
  });
}

/* §16 ── JOURNEY BAR ───────────────────────────────────────────── */
function updateJourneyBar(activeStep) {
  for (let i = 1; i <= 7; i++) {
    const el = document.getElementById('js-' + i);
    if (!el) continue;
    el.classList.remove('active','done');
    if (i === activeStep) el.classList.add('active');
    else if (i < activeStep) el.classList.add('done');
  }
}

/* §17 ── NAV HELPERS ───────────────────────────────────────────── */
function updateNavButtons() {
  const s = state.demoRole;
  const isStudent = s === 'student';
  const isTrainer = s === 'trainer';

  const navIds = ['nav-student','nav-assess','nav-gap','nav-path','nav-passport','nav-opps','nav-trainer'];
  navIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  if (isStudent) {
    ['nav-student','nav-assess','nav-gap','nav-path','nav-passport','nav-opps'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    });
  }
  if (isTrainer) {
    const el = document.getElementById('nav-trainer');
    if (el) el.classList.remove('hidden');
  }
}

/* §18 ── AUTH (real Supabase, preserved) ───────────────────────── */
function showAuthMsg(msg, type = 'error') {
  const el = document.getElementById('auth-notice');
  if (el) { el.textContent = msg; el.className = 'auth-notice ' + (type === 'success' ? 'success' : ''); }
}

function initSupabase() {
  if (window.supabase && CFG.supabaseUrl && !CFG.supabaseUrl.includes('YOUR_')) {
    state.supabaseClient = window.supabase.createClient(CFG.supabaseUrl, CFG.supabasePublishableKey);
    state.supabaseClient.auth.onAuthStateChange((event, session) => {
      if (!session && state.demoRole) return; // demo mode — ignore
      if (session) CC.go('student');
    });
  }
}

async function apiFetch(path, opts = {}) {
  const headers = new Headers(opts.headers || { 'Content-Type': 'application/json' });
  if (state.supabaseClient) {
    const { data } = await state.supabaseClient.auth.getSession();
    if (data?.session) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  }
  return fetch(path, { ...opts, headers });
}

/* §19 ── BANDWIDTH TOGGLE ──────────────────────────────────────── */
function wireBandwidth() {
  const enabled = localStorage.getItem(BW_KEY) === 'true';
  document.body.classList.toggle('low-bandwidth', enabled);

  const allToggles = [document.getElementById('bw-toggle'), document.getElementById('bw-toggle-landing')];
  allToggles.forEach(t => { if (t) t.checked = enabled; });

  allToggles.forEach(t => {
    if (!t) return;
    t.addEventListener('change', () => {
      const on = t.checked;
      allToggles.forEach(other => { if (other) other.checked = on; });
      document.body.classList.toggle('low-bandwidth', on);
      localStorage.setItem(BW_KEY, String(on));
    });
  });
}

/* §20 ── UTILS ─────────────────────────────────────────────────── */
function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* §21 ── ROLE TABS (login) ─────────────────────────────────────── */
function wireRoleTabs() {
  document.querySelectorAll('.role-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.role-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

/* §22 ── RESTORE DEMO SESSION ──────────────────────────────────── */
function restoreSession() {
  const saved = localStorage.getItem(DEMO_KEY);
  if (saved === 'student' || saved === 'trainer') {
    state.demoRole = saved;
    document.getElementById('demo-badge').classList.remove('hidden');
    updateNavButtons();
    CC.go(saved === 'trainer' ? 'trainer' : 'landing');
  } else {
    CC.go('landing');
  }
}

/* §23 ── INIT ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSupabase();
  wireBandwidth();
  wireRoleTabs();
  restoreSession();
});
