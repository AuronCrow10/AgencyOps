import { Link } from 'react-router-dom';
import { Button, PageShell } from '../components/ui';

const outcomes = [
  {
    title: 'Respond faster',
    description: 'Turn new inquiries into prioritized action instead of leaving operators to manually triage every request.'
  },
  {
    title: 'Qualify consistently',
    description: 'Use structured intake, AI analysis, and repeatable workflows to score and categorize leads the same way every time.'
  },
  {
    title: 'Run a tighter pipeline',
    description: 'Keep leads, tasks, notifications, and follow-up visibility inside one operational view for the whole team.'
  }
];

const workflow = [
  {
    step: 'Capture',
    description: 'Collect inbound requests through a public form or external systems without losing context.'
  },
  {
    step: 'Qualify',
    description: 'Analyze urgency, fit, and opportunity value automatically so the team knows what deserves immediate attention.'
  },
  {
    step: 'Act',
    description: 'Create tasks, notify the right people, and push the lead into a clear next step without manual coordination.'
  }
];

export function HomePage() {
  return (
    <PageShell>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] border border-slate-200 bg-white/92 p-10 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sea">AgencyOps</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              Turn inbound agency inquiries into qualified opportunities and clear next steps.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              AgencyOps helps service teams capture leads, assess fit and urgency, assign follow-up, and keep pipeline operations moving without manual triage chaos.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/intake">
                <Button>See the intake flow</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary">View the dashboard</Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl bg-mist px-5 py-4">
                <p className="text-sm font-semibold text-ink">AI qualification</p>
                <p className="mt-2 text-sm text-slate-600">Score, categorize, and summarize requests automatically.</p>
              </div>
              <div className="rounded-3xl bg-mist px-5 py-4">
                <p className="text-sm font-semibold text-ink">Operator workflow</p>
                <p className="mt-2 text-sm text-slate-600">Create tasks, update statuses, and manage the pipeline in one place.</p>
              </div>
              <div className="rounded-3xl bg-mist px-5 py-4">
                <p className="text-sm font-semibold text-ink">Automation layer</p>
                <p className="mt-2 text-sm text-slate-600">Notify teams and trigger downstream systems when lead data changes.</p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[2rem] border border-teal-200 bg-gradient-to-br from-ink via-slate-900 to-sea p-8 text-white shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-200">Built for agencies</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">
              Stop letting new business live in inboxes, spreadsheets, and memory.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-200">
              This solution is designed for agencies that want a more credible intake process, faster response times, and a cleaner handoff from inquiry to delivery planning.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-sm">
                <p className="text-sm font-semibold text-white">What clients care about</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                  <li>Fewer missed or delayed follow-ups</li>
                  <li>Clearer qualification before a team invests time</li>
                  <li>Better visibility into pipeline health and next actions</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-teal-300/20 bg-teal-400/10 px-5 py-4">
                <p className="text-sm font-semibold text-teal-100">Where it fits best</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">
                  Ideal for agencies and service teams handling a steady flow of inquiries, discovery requests, support escalations, or partnership opportunities.
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sea">What improves</p>
            <div className="mt-5 space-y-5">
              {outcomes.map((item) => (
                <div key={item.title}>
                  <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-panel">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sea">How the workflow works</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {workflow.map((item, index) => (
                <div key={item.step} className="rounded-3xl border border-slate-100 bg-slate-50 px-5 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Step {index + 1}</p>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{item.step}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
