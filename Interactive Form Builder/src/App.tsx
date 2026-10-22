import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { api } from "./lib/api";

type Page = "home" | "dashboard" | "builder" | "responses";
type QuestionType = "text" | "email" | "choice" | "yesno";

type Question = {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[];
};

type FormRecord = {
  id: string;
  title: string;
  description: string;
  status: "Published" | "Draft";
  responses: number;
  updated: string;
  color: string;
  welcome: string;
  questions: Question[];
};

type Submission = {
  id: string;
  formId: string;
  name: string;
  email: string;
  source: string;
  submittedAt: string;
  answers: Record<string, string>;
};

type ApiForm = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  color?: string | null;
  welcome?: string | null;
  questions?: Question[] | null;
  created_at?: string;
  updated_at?: string;
};
type ApiSubmission = {
  id: string;
  form_id: string;
  answers: Record<string, string>;
  source?: string | null;
  created_at?: string;
};

function formatUpdated(date?: string): string {
  if (!date) return "Recently";

  const timestamp = new Date(date).getTime();
  if (Number.isNaN(timestamp)) return "Recently";

  const elapsed = Date.now() - timestamp;
  const minutes = Math.floor(elapsed / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return new Date(date).toLocaleDateString();
}

function mapApiForm(form: ApiForm): FormRecord {
  return {
    id: form.id,
    title: form.title,
    description: form.description ?? "",
    status: form.status.toLowerCase() === "published"
      ? "Published"
      : "Draft",
    responses: 0,
    updated: formatUpdated(form.updated_at ?? form.created_at),
    color: form.color ?? "#7156e8",
    welcome: form.welcome ?? "Welcome! Let's get started.",
    questions: form.questions ?? [],
  };
}


const starterQuestions: Question[] = [
  { id: "demo-1", type: "text", label: "What should we call you?", required: true },
  {
    id: "demo-2",
    type: "email",
    label: "What's your work email?",
    required: true,
  },
  {
    id: "demo-3",
    type: "choice",
    label: "What can we help you with?",
    required: true,
    options: ["Product feedback", "Book a demo", "Support"],
  },
  {
    id: "demo-4",
    type: "yesno",
    label: "Would you like us to follow up?",
    required: false,
  },
];

const starterForms: FormRecord[] = [
  {
    id: "demo-1",
    title: "Product feedback",
    description: "Learn what customers think about your product.",
    status: "Published",
    responses: 128,
    updated: "2 hours ago",
    color: "#7156e8",
    welcome: "Hey there! We'd love your feedback. It only takes a minute.",
    questions: starterQuestions,
  },
  {
    id: "demo-2",
    title: "Demo request",
    description: "Qualify prospects and route demo requests.",
    status: "Published",
    responses: 54,
    updated: "Yesterday",
    color: "#167d68",
    welcome: "Welcome! Let's find the right time for your demo.",
    questions: starterQuestions.slice(0, 3),
  },
  {
    id: "demo-3",
    title: "Customer onboarding",
    description: "Collect the details your team needs to get started.",
    status: "Draft",
    responses: 0,
    updated: "3 days ago",
    color: "#d97735",
    welcome: "Welcome aboard! We just need a few details.",
    questions: starterQuestions.slice(0, 2),
  },
];


const iconPaths: Record<string, ReactNode> = {
  logo: <><path d="M6 5.5A2.5 2.5 0 0 1 8.5 3H16a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-4l-4.5 4v-4A2.5 2.5 0 0 1 5 11.5v-6Z" /><path d="M9 8h6M9 11h3" /></>,
  arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
  grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
  file: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h5" /></>,
  inbox: <><path d="M4 5h16v14H4z" /><path d="M4 14h4l2 2h4l2-2h4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  more: <><circle cx="5" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /></>,
  responses: <><path d="M5 4h14v16H5z" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
  trend: <path d="m4 16 5-5 4 3 7-8M15 6h5v5" />,
  code: <path d="m9 18-6-6 6-6M15 6l6 6-6 6" />,
  spark: <><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3Z" /><path d="m18.5 15 .6 2 1.9 1-1.9 1-.6 2-.6-2-1.9-1 1.9-1 .6-2Z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  grip: <><circle cx="9" cy="7" r=".8" fill="currentColor" /><circle cx="15" cy="7" r=".8" fill="currentColor" /><circle cx="9" cy="12" r=".8" fill="currentColor" /><circle cx="15" cy="12" r=".8" fill="currentColor" /><circle cx="9" cy="17" r=".8" fill="currentColor" /><circle cx="15" cy="17" r=".8" fill="currentColor" /></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" /></>,
  eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  copy: <><rect x="8" y="8" width="11" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  send: <path d="m4 4 17 8-17 8 3-8-3-8Zm3 8h14" />,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button className="logo" onClick={onClick} type="button">
      <span className="logo-mark"><Icon name="logo" size={21} /></span>
      <span>Formly</span>
    </button>
  );
}

function Landing({ onStart, openDemo }: { onStart: () => void; openDemo: () => void }) {
  return (
    <div className="landing">
      <header className="nav-wrap">
        <nav className="nav shell">
          <Logo />
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#demo">Demo</a>
          </div>
          <div className="nav-actions">
            <button className="button ghost" onClick={onStart}>Log in</button>
            <button className="button dark" onClick={onStart}>Start building <Icon name="arrow" size={17} /></button>
          </div>
        </nav>
      </header>

      <main>
        <section className="hero shell">
          <div className="eyebrow"><span>New</span> Turn every form into a conversation <Icon name="arrow" size={15} /></div>
          <h1>Forms people actually <em>enjoy</em> answering.</h1>
          <p>Build conversational forms, share them anywhere, and turn more visitors into customers—without writing a line of code.</p>
          <div className="hero-actions">
            <button className="button primary large" onClick={onStart}>Build your first form <Icon name="arrow" size={18} /></button>
            <button className="button soft large" onClick={openDemo}><span className="play">▶</span> Try the live demo</button>
          </div>
          <div className="social-proof">
            <div className="avatars"><span>JM</span><span>AK</span><span>SL</span><span>+2k</span></div>
            <div><b>Trusted by growing teams</b><small>No credit card required</small></div>
          </div>

          <div className="hero-product">
            <div className="mini-sidebar">
              <div className="mini-dots"><i /><i /><i /></div>
              <span className="mini-logo"><Icon name="logo" size={16} /></span>
              <i className="mini-line active" /><i className="mini-line" /><i className="mini-line short" />
            </div>
            <div className="product-main">
              <div className="product-top"><span>Product feedback</span><span className="status-dot">Published</span><button type="button">Share</button></div>
              <div className="builder-mock">
                <div className="mock-editor">
                  <small>QUESTION 3 OF 4</small>
                  <h3>What can we help you with?</h3>
                  <div className="mock-option selected"><span>A</span> Product feedback <Icon name="check" size={16} /></div>
                  <div className="mock-option"><span>B</span> Book a demo</div>
                  <div className="mock-option"><span>C</span> Support</div>
                </div>
                <div className="mock-chat">
                  <div className="chat-head"><span className="bot-avatar"><Icon name="logo" size={15} /></span><div><b>Formly</b><small>Typically replies instantly</small></div></div>
                  <div className="bubble bot">Hey there! We'd love your feedback.</div>
                  <div className="bubble bot">What can we help you with?</div>
                  <div className="bubble user">Product feedback</div>
                  <div className="typing"><i /><i /><i /></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="logo-cloud shell">
          <p>Powering better conversations at</p>
          <div><b>northstar</b><b>APERTURE</b><b>Arc.</b><b>Paperkite</b><b>MONO</b></div>
        </section>

        <section className="features section shell" id="features">
          <div className="section-kicker">EVERYTHING YOU NEED</div>
          <h2>From question to insight, <em>effortlessly.</em></h2>
          <p className="section-copy">A flexible toolkit for collecting the answers that move your business forward.</p>
          <div className="feature-grid">
            <article className="feature-card violet">
              <span className="feature-icon"><Icon name="spark" /></span>
              <h3>Build in minutes</h3>
              <p>Create beautiful, conversational forms with an intuitive drag-and-drop builder.</p>
              <div className="feature-art question-art"><span>What's your biggest goal?</span><i /><i className="half" /></div>
            </article>
            <article className="feature-card mint">
              <span className="feature-icon"><Icon name="code" /></span>
              <h3>Share anywhere</h3>
              <p>Embed on your site or share a unique link. It looks great on every screen.</p>
              <div className="feature-art code-art"><code>&lt;script src="formly.so/widget.js"<br /> data-form="f_82k1" /&gt;</code></div>
            </article>
            <article className="feature-card peach">
              <span className="feature-icon"><Icon name="trend" /></span>
              <h3>Learn what matters</h3>
              <p>See every response in one place and spot patterns without digging through spreadsheets.</p>
              <div className="feature-art chart-art"><span><b>248</b> responses</span><div><i /><i /><i /><i /><i /><i /><i /></div></div>
            </article>
          </div>
        </section>

        <section className="how section" id="how">
          <div className="shell">
            <div className="section-kicker">SIMPLE BY DESIGN</div>
            <h2>Live in three easy steps.</h2>
            <div className="steps">
              {[
                ["01", "Build your form", "Choose your questions, add your voice, and make it yours."],
                ["02", "Share or embed", "Send a link or add the chat widget to any website."],
                ["03", "Collect responses", "Watch answers roll in and follow up with the right people."],
              ].map(([num, title, text], index) => (
                <article className="step" key={num}>
                  <span>{num}</span>
                  <div className={`step-visual visual-${index + 1}`}>
                    {index === 0 && <><i /><i /><i /></>}
                    {index === 1 && <div><Icon name="code" /><b>formly.so/f/hello</b></div>}
                    {index === 2 && <><b>+28%</b><small>completion rate</small><Icon name="trend" size={30} /></>}
                  </div>
                  <h3>{title}</h3><p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cta shell">
          <div>
            <span className="cta-spark">✦</span>
            <h2>Ready to make forms feel human?</h2>
            <p>Create your first conversational form in minutes. Free to get started.</p>
            <button className="button light large" onClick={onStart}>Start building for free <Icon name="arrow" size={18} /></button>
          </div>
        </section>
      </main>

      <footer>
        <div className="shell footer-grid">
          <div><Logo /><p>Better forms. Better conversations.<br />Better answers.</p></div>
          <div><b>Product</b><a href="#features">Features</a><a href="#demo">Live demo</a><a href="#how">How it works</a></div>
          <div><b>Company</b><a href="#about">About</a><a href="#contact">Contact</a><a href="#privacy">Privacy</a></div>
          <div><b>Stay in the loop</b><p>Product updates, no noise.</p><div className="subscribe"><input aria-label="Email address" placeholder="you@company.com" /><button type="button"><Icon name="arrow" size={17} /></button></div></div>
        </div>
        <div className="shell footer-bottom">© 2025 Formly, Inc. <span>Made for better conversations.</span></div>
      </footer>
    </div>
  );
}

function Sidebar({ page, navigate }: { page: Page; navigate: (page: Page) => void }) {
  return (
    <aside className="sidebar">
      <Logo onClick={() => navigate("home")} />
      <div className="workspace"><span>FA</span><div><b>Formly Agency</b><small>Free workspace</small></div><span>⌄</span></div>
      <nav>
        <button className={page === "dashboard" ? "active" : ""} onClick={() => navigate("dashboard")}><Icon name="grid" /> Overview</button>
        <button className={page === "builder" ? "active" : ""} onClick={() => navigate("builder")}><Icon name="file" /> Forms <span>3</span></button>
        <button className={page === "responses" ? "active" : ""} onClick={() => navigate("responses")}><Icon name="inbox" /> Responses</button>
      </nav>
      <div className="sidebar-bottom">
        <button><Icon name="settings" /> Settings</button>
        <div className="user-row"><span>OP</span><div><b>Olivia Park</b><small>olivia@formly.so</small></div><span>⌄</span></div>
      </div>
    </aside>
  );
}

function DashboardHeader({ title, subtitle, onCreate }: { title: string; subtitle: string; onCreate?: () => void }) {
  return (
    <header className="dash-header">
      <div><h1>{title}</h1><p>{subtitle}</p></div>
      {onCreate && <button className="button primary" onClick={onCreate}><Icon name="plus" size={18} /> Create form</button>}
    </header>
  );
}

function Dashboard({ forms, submissions, onCreate, onEdit, onResponses, togglePublish, deleteForm }: {
  forms: FormRecord[];
  submissions: Submission[];
  onCreate: () => void;
  onEdit: (id: string) => void;
  onResponses: () => void;
  togglePublish: (id: string) => void;
  deleteForm: (id: string) => void;
}) {
  const totalResponses = forms.reduce((sum, form) => sum + form.responses, 0);
  return (
    <div className="dashboard-page">
      <DashboardHeader title="Good morning .... !" subtitle="Here's what's happening with your forms." onCreate={onCreate} />
      <div className="stat-grid">
        <article><span className="stat-icon purple"><Icon name="file" /></span><div><p>Total forms</p><b>{forms.length}</b><small><strong>+1</strong> this month</small></div></article>
        <article><span className="stat-icon green"><Icon name="responses" /></span><div><p>Total responses</p><b>{totalResponses}</b><small><strong>↑ 12.5%</strong> vs last month</small></div></article>
        <article><span className="stat-icon orange"><Icon name="trend" /></span><div><p>Completion rate</p><b>68.4%</b><small><strong>↑ 4.2%</strong> vs last month</small></div></article>
      </div>

      <section className="panel forms-panel">
        <div className="panel-heading"><div><h2>Your forms</h2><p>Create and manage your conversational forms.</p></div><button className="text-button" onClick={() => { if (forms[0]) onEdit(forms[0].id); }}>View all <Icon name="arrow" size={15} /></button></div>
        <div className="table forms-table">
          <div className="table-row table-head"><span>FORM NAME</span><span>STATUS</span><span>RESPONSES</span><span>LAST UPDATED</span><span /></div>
          {forms.map((form) => (
            <div className="table-row" key={form.id}>
              <div className="form-name"><span style={{ backgroundColor: `${form.color}18`, color: form.color }}><Icon name="file" /></span><div><button onClick={() => onEdit(form.id)}>{form.title}</button><small>{form.description}</small></div></div>
              <button className={`pill ${form.status.toLowerCase()}`} onClick={() => togglePublish(form.id)}><i />{form.status}</button>
              <span>{form.responses}</span><span>{form.updated}</span>
              <div className="row-actions"><button aria-label={`Edit ${form.title}`} onClick={() => onEdit(form.id)}><Icon name="more" /></button><button className="delete-action" aria-label={`Delete ${form.title}`} onClick={() => deleteForm(form.id)}><Icon name="trash" size={17} /></button></div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading"><div><h2>Recent responses</h2><p>The latest answers from your audience.</p></div><button className="text-button" onClick={onResponses}>View all <Icon name="arrow" size={15} /></button></div>
        <div className="response-list">
          {submissions.slice(0, 3).map((response) => (
            <button className="response-row" key={response.id} onClick={onResponses}>
              <span className="initial">{response.name.split(" ").map((part) => part[0]).join("")}</span>
              <div><b>{response.name}</b><small>{response.email}</small></div>
              <div><b>{forms.find((form) => form.id === response.formId)?.title || "Product feedback"}</b><small>{response.source}</small></div>
              <time>{response.submittedAt}</time><Icon name="chevron" size={17} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Chatbot({ form, onClose, onSubmit, embedded = false }: { form: FormRecord; onClose?: () => void; onSubmit: (answers: Record<string, string>) => void; embedded?: boolean }) {
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const current = form.questions[step];
  const complete = step >= form.questions.length;

  const answerQuestion = (answer: string) => {
    if (current?.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (current?.required && !answer.trim()) {
      setError("This question needs an answer.");
      return;
    }
    const next = { ...answers, [current.id]: answer };
    setAnswers(next);
    setValue("");
    setError("");
    if (step === form.questions.length - 1) {
      onSubmit(next);
    }
    setStep(step + 1);
  };

  const restart = () => {
    setStep(-1);
    setAnswers({});
    setValue("");
  };

  return (
    <div className={`chat-window ${embedded ? "embedded" : ""}`}>
      <div className="chat-header" style={{ backgroundColor: form.color }}>
        <span className="chat-brand"><span><Icon name="logo" size={17} /></span><div><b>{form.title}</b><small><i /> Online</small></div></span>
        {onClose && <button onClick={onClose} aria-label="Close chat"><Icon name="x" /></button>}
      </div>
      <div className="chat-body">
        <div className="chat-message bot-message">{form.welcome}</div>
        {step >= 0 && form.questions.slice(0, Math.min(step + 1, form.questions.length)).map((question, index) => (
          <div className="conversation" key={question.id}>
            <div className="chat-message bot-message">{question.label}</div>
            {index < step && <div className="chat-message user-message" style={{ backgroundColor: form.color }}>{answers[question.id]}</div>}
          </div>
        ))}
        {complete && (
          <div className="completion">
            <span style={{ backgroundColor: `${form.color}18`, color: form.color }}><Icon name="check" /></span>
            <h3>You're all set!</h3><p>Thanks for sharing. We'll be in touch soon.</p>
            <button className="text-button" onClick={restart}>Start again</button>
          </div>
        )}
      </div>
      {!complete && (
        <div className="chat-compose">
          {step === -1 ? (
            <button className="chat-start" style={{ backgroundColor: form.color }} onClick={() => setStep(0)}>Let's go <Icon name="arrow" size={17} /></button>
          ) : current.type === "choice" || current.type === "yesno" ? (
            <div className="answer-buttons">
              {(current.type === "yesno" ? ["Yes", "No"] : current.options || []).map((option) => (
                <button key={option} style={{ borderColor: form.color, color: form.color }} onClick={() => answerQuestion(option)}>{option}</button>
              ))}
            </div>
          ) : (
            <form onSubmit={(event) => { event.preventDefault(); answerQuestion(value); }}>
              <input aria-label="Your answer" type={current.type === "email" ? "email" : "text"} value={value} onChange={(event) => setValue(event.target.value)} placeholder={current.type === "email" ? "you@company.com" : "Type your answer..."} autoFocus />
              <button type="submit" aria-label="Send answer" style={{ backgroundColor: form.color }}><Icon name="send" size={18} /></button>
              {error && <small className="field-error">{error}</small>}
            </form>
          )}
        </div>
      )}
      <div className="chat-credit">Powered by <b>Formly</b></div>
    </div>
  );
}

function Builder({ form, updateForm, saveForm, goBack, onSubmission }: {
  form: FormRecord;
  updateForm: (form: FormRecord) => void;
  saveForm: (publish?: boolean) => void;
  goBack: () => void;
  onSubmission: (answers: Record<string, string>) => void;
}) {
  const [preview, setPreview] = useState(false);
  const [share, setShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedId, setSelectedId] = useState(form.questions[0]?.id);

  const updateQuestion = (id: string, patch: Partial<Question>) => {
  updateForm({
    ...form,
    questions: form.questions.map((question) =>
      question.id === id ? { ...question, ...patch } : question
    ),
  });
};
  const addQuestion = (type: QuestionType) => {
    const labels = { text: "What's your answer?", email: "What's your email address?", choice: "Choose an option", yesno: "Is that a yes?" };
const question: Question = {
  id: crypto.randomUUID(),
  type,
  label: labels[type],
  required: false,
  ...(type === "choice"
    ? { options: ["Option one", "Option two"] }
    : {}),
};    updateForm({ ...form, questions: [...form.questions, question] });
    setSelectedId(question.id);
  };
  const moveQuestion = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.questions.length) return;
    const questions = [...form.questions];
    [questions[index], questions[nextIndex]] = [questions[nextIndex], questions[index]];
    updateForm({ ...form, questions });
  };

  return (
    <div className="builder-page">
      <header className="builder-header">
        <button className="back-button" onClick={goBack}><Icon name="arrow" size={18} /></button>
        <div className="builder-title"><input aria-label="Form title" value={form.title} onChange={(event) => updateForm({ ...form, title: event.target.value })} /><span><i className={form.status === "Published" ? "live" : ""} />{form.status}</span></div>
        <div className="builder-actions"><button className="button ghost" onClick={() => setPreview(true)}><Icon name="eye" size={17} /> Preview</button><button className="button ghost" onClick={() => saveForm(false)}>Save draft</button><button className="button primary" onClick={() => { saveForm(true); setShare(true); }}>Publish <Icon name="arrow" size={17} /></button></div>
      </header>
      <div className="builder-layout">
        <aside className="question-tools">
          <h3>Add question</h3><p>Click a type to add it to your form.</p>
          <button onClick={() => addQuestion("text")}><span>Aa</span><div><b>Text</b><small>Short or long answer</small></div><Icon name="plus" size={16} /></button>
          <button onClick={() => addQuestion("email")}><span>@</span><div><b>Email</b><small>Email validation</small></div><Icon name="plus" size={16} /></button>
          <button onClick={() => addQuestion("choice")}><span>☷</span><div><b>Multiple choice</b><small>Choose one option</small></div><Icon name="plus" size={16} /></button>
          <button onClick={() => addQuestion("yesno")}><span>✓</span><div><b>Yes / No</b><small>Simple binary choice</small></div><Icon name="plus" size={16} /></button>
          <div className="customize">
            <h3>Customize</h3>
            <label>Brand color <input aria-label="Brand color" type="color" value={form.color} onChange={(event) => updateForm({ ...form, color: event.target.value })} /></label>
            <label>Welcome message <textarea value={form.welcome} onChange={(event) => updateForm({ ...form, welcome: event.target.value })} /></label>
          </div>
        </aside>
        <main className="question-canvas">
          <div className="canvas-inner">
            <div className="form-intro">
              <span>WELCOME SCREEN</span>
              <input value={form.title} onChange={(event) => updateForm({ ...form, title: event.target.value })} />
              <textarea value={form.description} onChange={(event) => updateForm({ ...form, description: event.target.value })} />
            </div>
            <div className="question-list">
              {form.questions.map((question, index) => (
                <article className={`question-card ${selectedId === question.id ? "selected" : ""}`} key={question.id} onClick={() => setSelectedId(question.id)}>
                  <div className="drag"><Icon name="grip" /></div>
                  <div className="question-number">{index + 1}</div>
                  <div className="question-content">
                    <small>{question.type === "yesno" ? "YES / NO" : question.type.toUpperCase()}</small>
                    <input value={question.label} onChange={(event) => updateQuestion(question.id, { label: event.target.value })} />
                    {question.type === "choice" && (
                      <div className="option-editor">
                        {(question.options || []).map((option, optionIndex) => <input key={optionIndex} value={option} onChange={(event) => {
                          const options = [...(question.options || [])]; options[optionIndex] = event.target.value; updateQuestion(question.id, { options });
                        }} />)}
                      </div>
                    )}
                  </div>
                  <div className="question-controls">
                    <label><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(question.id, { required: event.target.checked })} /><span /> Required</label>
                    <button aria-label="Move question up" disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveQuestion(index, -1); }}>↑</button>
                    <button aria-label="Move question down" disabled={index === form.questions.length - 1} onClick={(event) => { event.stopPropagation(); moveQuestion(index, 1); }}>↓</button>
                    <button aria-label="Delete question" onClick={(event) => { event.stopPropagation(); updateForm({ ...form, questions: form.questions.filter((item) => item.id !== question.id) }); }}><Icon name="trash" size={17} /></button>
                  </div>
                </article>
              ))}
            </div>
            <button className="add-inline" onClick={() => addQuestion("text")}><Icon name="plus" size={17} /> Add a question</button>
          </div>
        </main>
        <aside className="live-preview">
          <div className="preview-heading"><div><b>Live preview</b><small>See what your visitors will see</small></div><span>Mobile</span></div>
          <Chatbot form={form} embedded onSubmit={onSubmission} />
        </aside>
      </div>

      {preview && <div className="modal-backdrop" onMouseDown={() => setPreview(false)}><div className="preview-modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setPreview(false)}><Icon name="x" /></button><Chatbot form={form} embedded onSubmit={onSubmission} /></div></div>}
      {share && <ShareModal form={form} close={() => setShare(false)} copied={copied} setCopied={setCopied} />}
    </div>
  );
}

function ShareModal({ form, close, copied, setCopied }: { form: FormRecord; close: () => void; copied: boolean; setCopied: (copied: boolean) => void }) {
  const url = `${window.location.origin}/?form=${encodeURIComponent(form.id)}`;
  const snippet = `<script src=${url} data-form="${form.id}"></script>`;
  const copy = async (text: string) => {
    try{
      await navigator.clipboard.writeText(text);
      alert("lien copié");
    }catch{
      alert(`Copie manuelle : ${text}`);
    }
  };
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div className="share-modal" onMouseDown={(event) => event.stopPropagation()}>
        <button className="modal-close" onClick={close}><Icon name="x" /></button>
        <span className="success-mark"><Icon name="check" /></span>
        <h2>Your form is live!</h2><p>Share it with a link or add the widget to your website.</p>
        <label>PUBLIC LINK</label><div className="copy-field"><span>{url}</span><button onClick={() => copy(url)}><Icon name={copied ? "check" : "copy"} size={17} />{copied ? "Copied" : "Copy"}</button></div>
        <label>EMBED CODE</label><div className="code-field"><code>{snippet}</code><button onClick={() => copy(snippet)}><Icon name="copy" size={17} /></button></div>
        <button className="button primary full" onClick={close}>Done</button>
      </div>
    </div>
  );
}

function Responses({ submissions, forms }: { submissions: Submission[]; forms: FormRecord[] }) {
  const [selected, setSelected] = useState<Submission | null>(submissions[0] || null);
  useEffect(() => {
    setSelected((current) => {
      if (current) {
        const stillExists = submissions.find(
          (submission) => submission.id === current.id
        );

        if (stillExists) return stillExists;
      }

      return submissions[0] ?? null;
    });
  }, [submissions]);
  return (
    <div className="responses-page">
      <DashboardHeader title="Responses" subtitle="Review the people and answers behind every submission." />
      <div className="response-toolbar"><div className="search"><span>⌕</span><input placeholder="Search responses..." /></div><select aria-label="Filter form"><option>All forms</option>{forms.map((form) => <option key={form.id}>{form.title}</option>)}</select><button className="button ghost">Export CSV</button></div>
      <div className="responses-layout panel">
        <div className="submission-list">
          <div className="submission-list-head"><span>{submissions.length} submissions</span><small>Newest first</small></div>
          {submissions.map((submission) => (
            <button className={selected?.id === submission.id ? "selected" : ""} onClick={() => setSelected(submission)} key={submission.id}>
              <span className="initial">{submission.name.split(" ").map((part) => part[0]).join("")}</span><div><b>{submission.name}</b><small>{submission.email}</small><em>{forms.find((form) => form.id === submission.formId)?.title}</em></div><time>{submission.submittedAt.split(",")[0]}</time>
            </button>
          ))}
        </div>
        {selected ? <div className="response-detail">
          <div className="detail-head"><div><span className="initial large">{selected.name.split(" ").map((part) => part[0]).join("")}</span><div><h2>{selected.name}</h2><p>{selected.email}</p></div></div><span className="pill published"><i />Complete</span></div>
          <div className="detail-meta"><div><small>FORM</small><b>{forms.find((form) => form.id === selected.formId)?.title}</b></div><div><small>SUBMITTED</small><b>{selected.submittedAt}</b></div><div><small>SOURCE</small><b>{selected.source}</b></div></div>
          <div className="answers">
            {(forms.find((form) => form.id === selected.formId)?.questions || []).map((question, index) => <div key={question.id}><span>{index + 1}</span><section><small>{question.label}</small><p>{selected.answers[question.id] || "No answer"}</p></section></div>)}
          </div>
        </div> : <div className="empty-detail">Select a response to see the answers.</div>}
      </div>
    </div>
  );
}

function LoginModal({
  onLogin,
  onClose,
}: {
  onLogin: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    onLogin(name);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <button
          className="auth-close"
          type="button"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>

        <div className="auth-logo">F</div>
        <p className="auth-eyebrow">BIENVENUE CHEZ FORMLY</p>
        <h2>Comment doit-on vous appeler ?</h2>
        <p className="auth-description">
          Entrez votre prénom pour personnaliser votre espace de création.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="formly-first-name">Votre prénom</label>
          <input
            id="formly-first-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex. Yassine"
            autoFocus
            required
            maxLength={40}
          />
          <button className="button primary auth-submit" type="submit">
            Continuer
          </button>
        </form>

        <p className="auth-footnote">
          Version MVP · Aucun mot de passe nécessaire
        </p>
      </div>
    </div>
  );
}

function WelcomeModal({
  name,
  onContinue,
  onLogout,
}: {
  name: string;
  onContinue: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="auth-overlay">
      <div className="auth-modal auth-welcome">
        <div className="auth-welcome-icon">✦</div>
        <p className="auth-eyebrow">VOTRE ESPACE FORMLY</p>
        <h2>Bienvenue, {name} ! 👋</h2>
        <p className="auth-description">
          Ravi de vous retrouver. Tout est prêt pour créer votre prochain
          formulaire et découvrir les réponses de vos clients.
        </p>

        <button
          className="button primary auth-submit"
          type="button"
          onClick={onContinue}
        >
          Accéder à mon espace
        </button>

        <button className="auth-switch" type="button" onClick={onLogout}>
          Ce n'est pas vous ? Changer de prénom
        </button>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>("home");
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [editingId, setEditingId] = useState("demo-1");
  const [draft, setDraft] = useState<FormRecord>(starterForms[0]);
  const [widgetOpen, setWidgetOpen] = useState(false);
  const activeForm = forms.find((form) => form.id === editingId) || forms[0] || starterForms[0];
  const [publicForm, setPublicForm] = useState<FormRecord | null>(null);
  const [publicFormLoading, setPublicFormLoading] = useState(false);
  const [publicFormError, setPublicFormError] = useState("");

  useEffect(() => {
    const formId = new URLSearchParams(window.location.search).get("form");

    // Aucun identifiant dans l'URL : affichage normal de l'application.
    if (!formId) return;

    let cancelled = false;

    async function loadPublicForm() {
      setPublicFormLoading(true);
      setPublicFormError("");

      try {
        const result = await api.getForm(formId!);

        if (cancelled) return;

        if (result.status?.toLowerCase() !== "published") {
          throw new Error("Ce formulaire n'est pas publié.");
        }

        setPublicForm({
          id: result.id,
          title: result.title,
          description: result.description ?? "",
          status: "Published",
          responses: 0,
          updated: result.updated_at ?? "",
          color: result.color ?? "#7156e8",
          welcome: result.welcome ?? "",
          questions: result.questions ?? [],
        });
      } catch (error) {
        if (!cancelled) {
          setPublicFormError(
            error instanceof Error
              ? error.message
              : "Impossible de charger ce formulaire."
          );
        }
      } finally {
        if (!cancelled) setPublicFormLoading(false);
      }
    }

    loadPublicForm();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadFormsAndSubmissions() {
      try {
        // 1. Charger les formulaires depuis Supabase
        const apiForms: ApiForm[] = await api.listForms();

        if (cancelled) return;

        const loadedForms = apiForms.map(mapApiForm);

        // 2. Charger les réponses de chaque formulaire
        const results = await Promise.all(
          loadedForms.map(async (form) => {
            const rows: ApiSubmission[] =
              await api.listSubmissions(form.id);

            return rows.map((row) => {
              const answers = row.answers ?? {};

              // Récupérer le nom et l'e-mail à partir
              // des types de questions du formulaire.
              const emailQuestion = form.questions.find(
                (question) => question.type === "email"
              );

              const nameQuestion = form.questions.find(
                (question) =>
                  question.type === "text" &&
                  question.id !== emailQuestion?.id
              );

              const email = emailQuestion
                ? answers[emailQuestion.id] ?? ""
                : "";

              const name = nameQuestion
                ? answers[nameQuestion.id] ?? ""
                : "Visiteur";

              return {
                submission: {
                  id: String(row.id),
                  formId: String(row.form_id),
                  name: name.trim() || "Visiteur",
                  email,
                  source: row.source ?? "Lien public",
                  submittedAt: row.created_at
                    ? new Date(row.created_at).toLocaleString("fr-FR")
                    : "",
                  answers,
                } satisfies Submission,
                timestamp: row.created_at
                  ? new Date(row.created_at).getTime()
                  : 0,
              };
            });
          })
        );

        if (cancelled) return;

        // 3. Regrouper toutes les réponses et les trier
        // avec la date originale, de la plus récente à la plus ancienne.
        const allResponses = results
          .flat()
          .sort((a, b) => b.timestamp - a.timestamp)
          .map((item) => item.submission);

        setSubmissions(allResponses);

        // 4. Afficher le nombre réel de réponses par formulaire
        setForms(
          loadedForms.map((form) => ({
            ...form,
            responses: allResponses.filter(
              (response) => response.formId === form.id
            ).length,
          }))
        );
      } catch (error) {
        console.error(
          "Erreur de chargement des données Supabase :",
          error
        );
      }
    }

    loadFormsAndSubmissions();

    return () => {
      cancelled = true;
    };
  }, []);

  //useEffect(() => localStorage.setItem("formly-forms", JSON.stringify(forms)), [forms]);
  //useEffect(() => localStorage.setItem("formly-submissions", JSON.stringify(submissions)), [submissions]);

  const navigate = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const editForm = (id: string) => {
    const selected = forms.find((form) => form.id === id);
    if (selected) { setEditingId(id); setDraft({ ...selected, questions: selected.questions.map((question) => ({ ...question })) }); }
    navigate("builder");
  };
  
  const createForm = () => {
    const next: FormRecord = {
      id: `temp-${Date.now()}`,
      title: "Untitled form",
      description: "Add a short description for your form.",
      status: "Draft",
      responses: 0,
      updated: "Just now",
      color: "#7156e8",
      welcome: "Hi! Thanks for stopping by.",
      questions: [
        {
          id: String(Date.now() + 1),
          type: "text",
          label: "What should we call you?",
          required: true,
        },
      ],
    };

    setForms((current) => [...current, next]);
    setEditingId(next.id);
    setDraft(next);
    navigate("builder");
  };

  
  const saveForm = async (publish = false) => {
    const payload = {
      title: draft.title,
      description: draft.description,
      status: publish ? "Published" : draft.status,
      color: draft.color,
      welcome: draft.welcome,
      questions: draft.questions,
    };

    try {
      let saved: FormRecord;

      if (draft.id.startsWith("temp-")) {
        // Première sauvegarde : création dans Supabase
        const result = await api.createForm(payload);
        saved = mapApiForm(result);
      } else {
        // Sauvegardes suivantes : mise à jour dans Supabase
        const result = await api.updateForm(draft.id, payload);
        saved = mapApiForm(result);
      }

      setDraft(saved);
      setEditingId(saved.id);

      setForms((current) => {
        const exists = current.some((form) => form.id === draft.id);

        if (exists) {
          return current.map((form) =>
            form.id === draft.id
              ? { ...saved, responses: form.responses }
              : form
          );
        }

        return [saved, ...current];
      });
    } catch (error) {
      console.error("Erreur de sauvegarde :", error);
      alert(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer le formulaire."
      );
    }
  };

  
  const deleteForm = async (id: string) => {
    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer ce formulaire ? Cette action est irréversible."
    );

    if (!confirmed) return;

    try {
      // Supprimer d'abord le formulaire dans la base de données
      await api.deleteForm(id);

      // Mettre à jour l'interface seulement si la suppression réussit
      setForms((current) =>
        current.filter((form) => form.id !== id)
      );

      // Retirer également les réponses de ce formulaire de l'interface
      setSubmissions((current) =>
        current.filter((submission) => submission.formId !== id)
      );

      // Revenir au tableau de bord si le formulaire supprimé était ouvert
      if (editingId === id) {
        navigate("dashboard");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);

      window.alert(
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le formulaire."
      );
    }
  };

  const submit = async (
    form: FormRecord,
    answers: Record<string, string>
  ) => {
    try {
      const result = await api.submitAnswers(form.id, {
        answers,
        source: "Website widget",
      });

      const textAnswers = Object.values(answers);
      const email =
        textAnswers.find((answer) =>
          /^\S+@\S+\.\S+$/.test(answer)
        ) ?? "anonymous@visitor.com";

      const name =
        textAnswers.find(
          (answer) =>
            answer !== email &&
            !["Yes", "No", "Oui", "Non"].includes(answer)
        ) ?? "New visitor";

      const submission: Submission = {
        id: result.id,
        formId: result.form_id,
        name,
        email,
        source: result.source,
        submittedAt: result.created_at,
        answers: result.answers,
      };

      setSubmissions((current) => [
        submission,
        ...current,
      ]);

      setForms((current) =>
        current.map((item) =>
          item.id === form.id
            ? { ...item, responses: item.responses + 1 }
            : item
        )
      );
    } catch (error) {
      console.error("Erreur d'enregistrement :", error);

      alert(
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer les réponses."
      );

      throw error;
    }
  };
  const [userName, setUserName] = useState(() => localStorage.getItem("formly-user-name") || "");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  const startLogin = () => {
      if (userName) {
        setShowWelcome(true);
      } else {
        setShowLoginModal(true);
      }
    };

    const handleLogin = (name: string) => {
      const cleanName = name.trim();

      if (!cleanName) return;

      localStorage.setItem("formly-user-name", cleanName);
      setUserName(cleanName);
      setShowLoginModal(false);
      setShowWelcome(true);
    };

    const enterDashboard = () => {
      setShowWelcome(false);
      navigate("dashboard");
    };

    const handleNavigation = (next: Page) => {
      if (
        (next === "dashboard" || next === "builder" || next === "responses") &&
        !userName
      ) {
        startLogin();
        return;
      }

      navigate(next);
    };
  const appContent = useMemo(() => {
    if (publicFormLoading) {
      return <div className="p-8 text-center">Chargement du formulaire...</div>;
    }

    if (publicFormError) {
      return <div className="p-8 text-center">{publicFormError}</div>;
    }

    if (publicForm) {
      return (
        <Chatbot
          key={publicForm.id}
          form={publicForm}
          onSubmit={(answers) => submit(publicForm, answers)}
        />
      );
    }
    if (page === "home") {
    return (
      <Landing
        onStart={startLogin}
        openDemo={() => setWidgetOpen(true)}
      />
    );
  }
    if (page === "builder") return <Builder form={draft} updateForm={setDraft} saveForm={saveForm} goBack={() => navigate("dashboard")} onSubmission={(answers) => submit(draft, answers)} />;
    return (
      <div className="app-shell">
      <Sidebar page={page} navigate={handleNavigation} />        <main className="app-main">
          {page === "dashboard"
            ? <Dashboard forms={forms} submissions={submissions} onCreate={createForm} onEdit={editForm} onResponses={() => navigate("responses")} togglePublish={(id) => setForms((current) => current.map((form) => form.id === id ? { ...form, status: form.status === "Published" ? "Draft" : "Published" } : form))} deleteForm={deleteForm} />
            : <Responses submissions={submissions} forms={forms} />}
        </main>
      </div>
    );
  }, [page, forms, submissions, draft]);
  return (
    <>
      {appContent}

      {/* Boîte de dialogue pour demander le prénom */}
      {showLoginModal && (
        <LoginModal
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Message de bienvenue après la saisie du prénom */}
      {showWelcome && userName && (
        <WelcomeModal
          name={userName}
          onContinue={enterDashboard}
          onLogout={() => {
            localStorage.removeItem("formly-user-name");
            setUserName("");
            setShowWelcome(false);
            setShowLoginModal(true);
          }}
        />
      )}

      {/* Widget de démonstration : on le conserve */}
      {page === "home" && (
        <div id="demo" className="floating-chat">
          {widgetOpen && (
            <Chatbot
              form={activeForm}
              onClose={() => setWidgetOpen(false)}
              onSubmit={(answers) => submit(activeForm, answers)}
            />
          )}

          <button
            className={`chat-launcher ${widgetOpen ? "open" : ""}`}
            onClick={() => setWidgetOpen(!widgetOpen)}
            aria-label="Open form chat"
          >
            <Icon name={widgetOpen ? "x" : "logo"} size={25} />
          </button>
        </div>
      )}
    </>
  );

}


export default App;
