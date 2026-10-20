import { APPLY_EMAIL, JOB_NOTICE, type Job } from "@/data/jobs";

export function JobNotice() {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-6">
      <h3 className="font-display text-lg font-semibold">{JOB_NOTICE.title}</h3>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-white/70 leading-relaxed">
        {JOB_NOTICE.body.map((b) => <li key={b}>{b}</li>)}
      </ul>
    </div>
  );
}

export function JobCard({ job }: { job: Job }) {
  const subject = encodeURIComponent(`Application: ${job.title} - ${job.location}`);
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-semibold">{job.title}</h3>
          <p className="mt-1 text-sm text-white/60">{job.location}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-widest text-white/70">
            {job.type}
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">{job.pay}</span>
        </div>
      </div>
      <p className="mt-4 text-white/75 leading-relaxed">{job.summary}</p>
      <h4 className="mt-5 text-xs uppercase tracking-widest text-white/50">Key responsibilities</h4>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-white/70">
        {job.duties.map((d) => <li key={d}>{d}</li>)}
      </ul>
      <h4 className="mt-5 text-xs uppercase tracking-widest text-white/50">Requirements</h4>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-white/70">
        {job.reqs.map((r) => <li key={r}>{r}</li>)}
      </ul>
      <h4 className="mt-5 text-xs uppercase tracking-widest text-white/50">What we offer</h4>
      <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-white/70">
        {job.benefits.map((b) => <li key={b}>{b}</li>)}
      </ul>
      <p className="mt-5 text-sm text-white/70 leading-relaxed">{job.howToApply}</p>
      <a
        href={`mailto:${APPLY_EMAIL}?subject=${subject}`}
        className="mt-6 self-start bg-white text-black px-6 py-3 rounded-xl font-semibold hover:bg-white/90"
      >
        Apply
      </a>
    </article>
  );
}
