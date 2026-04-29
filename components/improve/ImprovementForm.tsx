'use client';
import { useState } from 'react';
import { BusinessProfile } from '@/lib/types';

interface Props {
  onSubmit: (profile: BusinessProfile) => void;
}

export function ImprovementForm({ onSubmit }: Props) {
  const [businessName, setBusinessName] = useState('');
  const [url, setUrl] = useState('');
  const [sector, setSector] = useState('Professional Services');
  const [location, setLocation] = useState('');
  const [services, setServices] = useState('');
  const [targetCustomers, setTargetCustomers] = useState('');
  const [comp1, setComp1] = useState('');
  const [comp2, setComp2] = useState('');
  const [comp3, setComp3] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Brand voice questionnaire
  const [clientDescription, setClientDescription] = useState('');
  const [uniqueDifference, setUniqueDifference] = useState('');
  const [tone, setTone] = useState<BusinessProfile['tonePreference']>('warm');
  const [proofPoints, setProofPoints] = useState('');
  const [primaryProblem, setPrimaryProblem] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !url) return;
    const domain = (() => {
      try {
        return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(
          /^www\./,
          ''
        );
      } catch {
        return url;
      }
    })();
    onSubmit({
      businessName,
      url: url.startsWith('http') ? url : `https://${url}`,
      domain,
      sector,
      location,
      services: services.split('\n').map((s) => s.trim()).filter(Boolean),
      targetCustomers,
      competitors: [comp1, comp2, comp3].filter(Boolean),
      meetingNotes,
      contactEmail,
      clientDescription,
      uniqueDifference,
      tonePreference: tone,
      proofPoints,
      primaryProblem,
    });
  };

  return (
    <div className="card max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-1">AI Visibility Improver</h2>
      <p className="text-sm text-brand-gray-dark mb-4">
        Foundation pack: Quick Wins · Schema · FAQs · Articles · Brand Voice · Strategy · Prompts. Takes 3–5 minutes.
      </p>
      <form onSubmit={submit} className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Business name *</label>
            <input className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Website URL *</label>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="example.co.za" />
          </div>
          <div>
            <label className="label">Sector</label>
            <select className="input" value={sector} onChange={(e) => setSector(e.target.value)}>
              <option>Professional Services</option>
              <option>Healthcare</option>
              <option>Real Estate</option>
              <option>Education &amp; Training</option>
              <option>Hospitality</option>
              <option>E-commerce</option>
              <option>Technology</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="label">Primary city/region *</label>
            <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>
        </div>
        <div>
          <label className="label">Services (one per line)</label>
          <textarea className="input" rows={4} value={services} onChange={(e) => setServices(e.target.value)} />
        </div>
        <div>
          <label className="label">Target customers</label>
          <textarea className="input" rows={3} value={targetCustomers} onChange={(e) => setTargetCustomers(e.target.value)} />
        </div>
        <div>
          <label className="label">Top 3 competitors (optional)</label>
          <div className="grid grid-cols-3 gap-2">
            <input className="input" value={comp1} onChange={(e) => setComp1(e.target.value)} placeholder="Competitor 1" />
            <input className="input" value={comp2} onChange={(e) => setComp2(e.target.value)} placeholder="Competitor 2" />
            <input className="input" value={comp3} onChange={(e) => setComp3(e.target.value)} placeholder="Competitor 3" />
          </div>
        </div>
        <div>
          <label className="label">Contact email (optional)</label>
          <input className="input" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Meeting notes</label>
          <textarea className="input" rows={4} value={meetingNotes} onChange={(e) => setMeetingNotes(e.target.value)} />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-sm mb-3">Brand Voice Questionnaire</h3>
          <div className="grid gap-3">
            <div>
              <label className="label">Q1: How would their best client describe what they do in one sentence?</label>
              <input className="input" value={clientDescription} onChange={(e) => setClientDescription(e.target.value)} />
              <div className="hint">e.g. They help us keep more of what we earn</div>
            </div>
            <div>
              <label className="label">Q2: What do they do that no competitor does?</label>
              <textarea className="input" rows={2} maxLength={300} value={uniqueDifference} onChange={(e) => setUniqueDifference(e.target.value)} />
            </div>
            <div>
              <label className="label">Q3: Tone</label>
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    ['authoritative', 'Authoritative & precise'],
                    ['warm', 'Warm & approachable'],
                    ['friendly', 'Friendly & direct'],
                    ['playful', 'Playful & bold'],
                  ] as [BusinessProfile['tonePreference'], string][]
                ).map(([k, label]) => (
                  <label key={k} className="text-sm flex items-center gap-2">
                    <input
                      type="radio"
                      name="tone"
                      checked={tone === k}
                      onChange={() => setTone(k)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Q4: Best result for a client — one sentence</label>
              <input className="input" value={proofPoints} onChange={(e) => setProofPoints(e.target.value)} />
              <div className="hint">e.g. Saved a Cape Town retailer R1.2m in SARS penalties</div>
            </div>
            <div>
              <label className="label">Q5: The #1 question customers ask before hiring them</label>
              <input className="input" maxLength={150} value={primaryProblem} onChange={(e) => setPrimaryProblem(e.target.value)} />
            </div>
          </div>
        </div>

        <button className="btn-primary w-full" type="submit">Generate AI Visibility Pack</button>
      </form>
    </div>
  );
}
