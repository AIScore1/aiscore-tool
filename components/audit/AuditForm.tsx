'use client';
import { useState } from 'react';

interface Props {
  onSubmit: (data: {
    url: string;
    businessName: string;
    businessType: string;
    sector: string;
    location: string;
    services: string[];
  }) => void;
}

export function AuditForm({ onSubmit }: Props) {
  const [url, setUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [sector, setSector] = useState('Professional Services');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [services, setServices] = useState('');

  return (
    <div className="card max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-1">Run a full GEO audit</h2>
      <p className="text-sm text-brand-gray-dark mb-4">
        50-page crawl, 6-module scoring, 4 AI calls. ~3 minutes.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!url) return;
          onSubmit({
            url,
            businessName,
            businessType: businessType || sector,
            sector,
            location,
            services: services.split('\n').map((s) => s.trim()).filter(Boolean),
          });
        }}
        className="grid gap-4"
      >
        <div>
          <label className="label">Website URL *</label>
          <input
            className="input"
            type="text"
            value={url}
            placeholder="https://example.co.za"
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Business name</label>
          <input
            className="input"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Sector</label>
            <select
              className="input"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
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
            <label className="label">Location</label>
            <input
              className="input"
              type="text"
              value={location}
              placeholder="e.g. Cape Town"
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label">Business type / description</label>
          <input
            className="input"
            type="text"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
            placeholder="e.g. Boutique tax advisory"
          />
        </div>
        <div>
          <label className="label">Services (one per line)</label>
          <textarea
            className="input"
            value={services}
            onChange={(e) => setServices(e.target.value)}
            rows={4}
          />
        </div>
        <button type="submit" className="btn-primary w-full">
          Run audit
        </button>
      </form>
    </div>
  );
}
