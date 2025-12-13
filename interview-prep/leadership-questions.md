# Leadership Interview Questions

## The Real "Head of" Answers

These answers reflect how a Head of Databases thinks - not textbook management, but battle-tested wisdom from running databases at scale.

---

## Team Management

### Q: How do you handle underperformance?

**Textbook Answer:** PIPs, coaching, documentation.

**Head of Databases Answer:** 

> "First, I check if the *system* is failing them, not the other way around.
>
> Is the on-call rotation creating sleep deprivation? Are the docs terrible? Is the tooling fighting them? Is the person in the wrong role - a great operator who was promoted into architecture work they hate?
>
> If a previously-strong performer is struggling, the environment changed. I fix the environment first.
>
> If after fixing systemic issues the person still struggles, I have a direct conversation: 'Here's what I'm observing. Here's the impact. What's going on?' Often there's something I don't know - personal issues, burnout, role mismatch.
>
> PIPs are a last resort, and honestly, by the time you need one, both parties usually know it's not working. I'd rather have an honest conversation about finding a better fit than pretend a PIP will fix a fundamental mismatch."

---

### Q: How do you balance innovation vs reliability?

**Textbook Answer:** 70/20/10 split, feature flags.

**Head of Databases Answer:**

> "Reliability *is* a feature. If the database is down, the innovation doesn't matter.
>
> I use **Error Budgets** from the SRE playbook. We define an acceptable error rate - say, 99.9% availability means we can have 43 minutes of downtime per month. That's our error budget.
>
> If we're within budget, teams can take risks - ship faster, try new things. If we've burned through the budget early, we freeze feature work and focus only on reliability.
>
> This makes the trade-off explicit and data-driven. No more arguments about 'should we ship this risky change?' - the error budget tells us.
>
> For something like OrioleDB, I'd frame it as high-risk innovation. We test it extensively on non-critical workloads, build internal expertise for 6+ months, and have a complete rollback plan before touching production."

---

### Q: How do you align multiple distributed teams toward shared goals?

**Head of Databases Answer:**

> "Context, not control.
>
> I start with the 'why' - what customer problem are we solving? What's the business impact? When people understand the mission, they make better decisions without me.
>
> Quarterly roadmaps tied to company OKRs give direction. Each team owns specific outcomes, not just outputs. I care about 'reduce query latency p99 by 30%' not 'ship the caching feature.'
>
> Weekly cross-team syncs surface dependencies early. We use RFCs for decisions affecting multiple teams - forces people to think through implications and get buy-in upfront.
>
> Most importantly, I build relationships so leads communicate directly. If they need to escalate to me for every cross-team decision, I've failed."

---

### Q: How do you prioritize across teams?

**Head of Databases Answer:**

> "I ruthlessly protect focus. Every priority added is a priority removed elsewhere.
>
> Framework: Impact × Urgency, aligned with company goals.
>
> I protect 20% for tech debt and reliability. This isn't negotiable. Teams that ignore tech debt eventually grind to a halt.
>
> I make prioritization transparent. Teams should understand *why* we're building X before Y. When they understand the context, they stop fighting me on priorities and start helping me make better calls.
>
> I'm willing to make hard calls and own the consequences. 'We're not doing that this quarter' is a complete sentence. Trying to do everything means doing nothing well."

---

## Technical Leadership

### Q: How do you stay technical while managing multiple teams?

**Head of Databases Answer:**

> "I don't pretend I can stay current on everything. Instead:
>
> 1. **Go deep in one area.** For me, it might be the XID wraparound problem or replication internals. This keeps my technical intuition sharp.
>
> 2. **Participate in design reviews** for major features. I'm not approving code, I'm asking 'what happens when this fails?' and 'have we considered the edge cases?'
>
> 3. **Read every on-call report and postmortem.** This is where I learn what's actually breaking. The patterns tell me where to invest.
>
> 4. **Build systems, not dependency.** If I'm the bottleneck for technical decisions, I've failed. I hire senior people and trust them. My job is to set direction, remove blockers, and occasionally ask the 'dumb' questions that uncover hidden assumptions."

---

### Q: How do you make architectural decisions?

**Head of Databases Answer:**

> "Written RFCs with four sections: Problem, Options Considered, Recommendation, and Risks.
>
> Required review from affected teams. This isn't democracy - I'll make the call if needed - but I want to hear dissenting views before deciding.
>
> Time-box decisions. Analysis paralysis kills momentum. 'We'll decide by Friday with the information we have' is often the right call. Perfect is the enemy of good.
>
> Document decisions with the context that led to them. Future me (or future team members) will want to know *why* we made this choice when circumstances change.
>
> And I'm willing to revisit decisions when the facts change. 'Based on new information, we're changing course' is strength, not weakness."

---

## Crisis & Incidents

### Q: Walk me through how you'd handle a major outage.

**Head of Databases Answer:**

> "Structured incident response:
>
> 1. **Acknowledge and assess.** Get eyes on it within 5 minutes. Is this affecting customers? What's the blast radius?
>
> 2. **Communicate.** Status page update. Leadership brief. Customers don't care about the technical details; they care about 'is it being fixed?'
>
> 3. **Contain, then fix.** Stop the bleeding first. If I can reduce impact by failing over, cutting traffic, or rolling back, I do that before investigating root cause.
>
> 4. **Parallel workstreams.** One person investigates. One person communicates. One person coordinates. Never one person doing all three.
>
> 5. **Document the timeline in real-time.** This becomes the postmortem foundation.
>
> 6. **Blameless postmortem within 48 hours.** Focus on systems, not individuals. What allowed this to happen? How do we prevent it?
>
> 7. **Follow through on action items.** A postmortem with untracked action items is worse than no postmortem - it breeds cynicism."

---

### Q: How do you prevent incidents from recurring?

**Head of Databases Answer:**

> "You can't prevent all incidents, but you can prevent the *same* incident.
>
> Every postmortem has 3-5 concrete action items with owners and due dates. I track them to completion. If they're not getting done, I'm failing as a leader.
>
> I look for systemic patterns:
> - Multiple incidents from the same area? That team needs help or investment.
> - Incidents happening at night? On-call rotation or monitoring needs work.
> - Human error causing incidents? The system should have prevented that action or made it recoverable.
>
> The goal is to make the right thing easy and the wrong thing hard. If someone can accidentally DELETE all users, that's a system design failure, not a people failure."

---

## Supabase-Specific

### Q: How would you approach leading teams across OrioleDB, Multigres, and Wrappers?

**Head of Databases Answer:**

> "Different teams, different maturity, different domains. I resist the urge to unify too quickly.
>
> First 30 days: Listen. 1:1s with everyone. What's working? What's frustrating? What would they change if they could? I'm building trust and context.
>
> Find the common threads: shared infrastructure needs, shared pain points, shared tooling gaps. Address those first - it creates quick wins and shows I'm adding value.
>
> Establish consistent practices where they make sense - incident response, on-call rotation, code review standards. But respect team autonomy where it doesn't affect reliability.
>
> Build bridges with Product counterparts. A Head of Engineering who doesn't have strong Product relationships is flying blind."

---

### Q: What would be your 90-day plan?

**Head of Databases Answer:**

> "**Days 1-30: Absorb.**
> - 1:1s with every team member. Understand people before process.
> - Review recent postmortems. Where are the bodies buried?
> - Shadow on-call. See the operational reality.
> - Understand current roadmaps, commitments, and challenges.
> - Build relationships with Product, Platform, and other Engineering leads.
>
> **Days 31-60: Identify.**
> - What are the top 3 systemic problems I can address?
> - Are there staffing gaps? Skill gaps? Process gaps?
> - Start proposing improvements - but small, reversible ones first.
> - Begin contributing to technical decisions (I have enough context now).
> - Hire for critical gaps if any.
>
> **Days 61-90: Execute.**
> - Demonstrate value through delivered results.
> - Establish regular operating rhythm (team syncs, planning cycles).
> - Measure improvements against baseline.
> - Start thinking about longer-term strategy and investments.
>
> The biggest mistake in a new leadership role is changing too much too fast. Trust is earned before it's spent."

---

### Q: Why should we hire someone learning Postgres for Head of Databases?

**Head of Databases Answer:**

> "Let me be direct: you're not hiring me to write WAL code. You're hiring me to lead teams, set direction, and navigate the organizational and technical complexity at scale.
>
> What I bring:
> - **Leadership experience** that took years to develop.
> - **Developer empathy** from building products - I know what database users need.
> - **Fast learning velocity** - I've demonstrated this by building [this curriculum] in days.
> - **Fresh perspective** - sometimes an outsider sees patterns insiders miss.
>
> What I'm acquiring rapidly:
> - Technical depth in Postgres internals. I can already discuss XIDs, MVCC, WAL, replication, and query optimization at a reasonable level.
>
> My strategy: surround myself with Postgres experts. I'll learn from them while providing the organizational leadership and strategic thinking they need. In 6 months, I'll be dangerous technically. But the leadership judgment? That takes years to develop - and I already have it.
>
> The real question: do you need a leader who's also a Postgres expert, or a Postgres expert who can learn to lead? I'm betting you need the former."

---

## Questions to Ask Them

1. "What's the biggest challenge facing the Postgres teams right now that a Head of Databases would need to solve in the first 6 months?"

2. "How do the Postgres teams currently coordinate with Product? What's working and what needs improvement?"

3. "Tell me about a recent incident that exposed a gap you haven't fully addressed yet."

4. "What does success look like in this role after 6 months? After a year?"

5. "Tell me about the OrioleDB investment - what's the timeline, and honestly, what are you worried about?"

6. "How does Supabase think about the balance between contributing to Postgres ecosystem vs. building proprietary features?"

7. "If I talked to someone who left this team in the past year, what would they say about the culture?"
